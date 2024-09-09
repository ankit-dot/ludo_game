import { Router } from "express";
import supabase, { pool } from "../config/dbConfig.js";
import { canMove, nextPlayerTurn, nextPosition, nextTurn } from "../utils.js";

let router = Router();

router.put("/:game_id/move", async (req, res) => {
  try {
    const { game_id } = req.params;
    const coin_id = req.body.coin_id;
    const dice_value = req.headers["dice_value"];

    if (dice_value < 1 || dice_value > 6) {
      return res.status(400).json({ message: "Invalid dice spin" });
    }

    // Check game status
    const gameData = await pool.query("SELECT * FROM game WHERE id = $1;", [
      game_id,
    ]);

    if (gameData.rows[0].status !== "playing") {
      return res.status(400).json({ message: "Not your turn" });
    }

    // Get coin position data
    const coinData = await pool.query(
      "SELECT * FROM coin_position WHERE id = $1;",
      [coin_id]
    );

    // Get player turn data
    const playerTurnData = await pool.query(
      "SELECT * FROM player_turn WHERE player_id = $1;",
      [coinData.rows[0].player_id]
    );

    if (
      !playerTurnData.rows.length ||
      playerTurnData.rows[0].game_id !== game_id
    ) {
      return res.status(400).json({ message: "Not your turn" });
    }

    // Get player's color
    const colorData = await pool.query(
      "SELECT color FROM player WHERE id = $1;",
      [coinData.rows[0].player_id]
    );

    const position = coinData.rows[0].position;
    const steps_walked = coinData.rows[0].steps_walked;
    const color = colorData.rows[0].color;

    // Calculate new position using nextPosition function
    const newPosition = nextPosition(position, dice_value, color, steps_walked);

    if (newPosition[0] === -1) {
      return res
        .status(400)
        .json({ message: "This move is not possible, choose another coin" });
    }

    // Update coin position
    await pool.query(
      "UPDATE coin_position SET position = $1, steps_walked = $2 WHERE id = $3;",
      [newPosition[0], newPosition[1], coin_id]
    );

    // If steps_walked is 57, update position to 100
    if (steps_walked === 57) {
      await pool.query(
        "UPDATE coin_position SET position = 100 WHERE id = $1;",
        [coin_id]
      );
    }

    // If steps_walked > 51, set position to -1 and mark coin as in_home
    if (steps_walked > 51) {
      await pool.query(
        "UPDATE coin_position SET position = -1, in_home = TRUE WHERE id = $1;",
        [coin_id]
      );
    }

    const coin_position = await pool.query(
      "SELECT * FROM coin_position WHERE game_id = $1",
      [game_id]
    );

    const nextPlayerData = await nextPlayerTurn(game_id, dice_value);

    await pool.query(
      "UPDATE player_turn SET player_id = $1, dice_value = $3 WHERE game_id = $2;",
      [nextPlayerData.rows[0].id, game_id, dice_value]
    );

    return res.status(200).json({
      message: "Coin position updated",
      gameState: coin_position.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:game_id/roll_dice", async (req, res) => {
  try {
    const { game_id } = req.params;
    const dice_value = Math.ceil(Math.random() * 6);
    const gameData = await pool.query("SELECT * FROM game WHERE id = $1;", [
      game_id,
    ]);

    if (gameData.rows[0].status !== "playing") {
      return res.status(400).json({ message: "game not started" });
    }
    const playerTurnData = await pool.query(
      "SELECT * FROM player_turn WHERE game_id = $1;",
      [game_id]
    );

    if (
      !playerTurnData.rows.length ||
      playerTurnData.rows[0].game_id !== game_id
    ) {
      return res.status(400).json({ message: "Not your turn" });
    }

    const availableCoins = await pool.query(
      "SELECT * FROM coin_position WHERE game_id = $1 AND player_id = $2 AND position != 100 ",
      [game_id, playerTurnData.rows[0].player_id]
    );

    const coin_position = await pool.query(
      "SELECT * FROM coin_position WHERE game_id = $1",
      [game_id]
    );

    const can_move = canMove(availableCoins, dice_value);

    const nextPlayerData = await nextPlayerTurn(game_id, dice_value);

    if (!can_move) {
      await pool.query(
        "UPDATE player_turn SET player_id = $1, dice_value = $3 WHERE game_id = $2;",
        [nextPlayerData.rows[0].id, game_id, dice_value]
      );
    }

    return res.status(200).json({
      gameState: coin_position.rows,
      canMove: can_move,
      diceValue: dice_value,
      nextPlayer: nextPlayerData.rows[0].id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

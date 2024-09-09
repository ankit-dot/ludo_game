import { Router } from "express";
import supabase, { pool } from "../config/dbConfig.js";

let router = Router();

router.post("/create", async (req, res) => {
  try {
    const user_id = req.headers["user_id"];

    const gameCreate = await pool.query(
      "INSERT INTO game (status, created_by, created_at) VALUES ('waiting', $1, EXTRACT(EPOCH FROM NOW())) RETURNING id;",
      [user_id]
    );

    const playerInsert = await pool.query(
      "INSERT INTO player (game_id, user_id, color, status, finished_ts) VALUES ($1, $2, 'red', 'in_progress', NULL);",
      [gameCreate.rows[0].id, user_id]
    );

    console.log("game created");
    return res
      .status(200)
      .json({ game_id: gameCreate.rows[0].id, user_id: user_id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: ` something went wrong :- ${error.message}` });
  }
});

router.post("/join", async (req, res) => {
  try {
    const user_id = req.headers["user_id"];
    const gameData = await pool.query(
      "SELECT * FROM game WHERE status = $1 ORDER BY created_at DESC LIMIT 1;",
      ["waiting"]
    );

    if (gameData.rows.length === 0) {
      return res.status(404).json({ message: "No available games right now" });
    }

    const playerCount = await pool.query(
      "SELECT COUNT(*) FROM player WHERE game_id = $1;",
      [gameData.rows[0].id]
    );

    let color;
   console.log(playerCount.rows[0].count);
    if (playerCount.rows[0].count === '1') {
      color = "green";
    } else if (playerCount.rows[0].count === '2') {
      color = "yellow";
    } else {
      color = "blue";
    }

    // if playerCount is more then three bad request.
    const playerInsert = await pool.query(
      "INSERT INTO player (game_id, user_id, color, status, finished_ts) VALUES ($1, $2, $3, 'in_progress', NULL);",
      [gameData.rows[0].id, user_id, color]
    );

    if (playerCount >= 3) {
      const gameUpdate = await pool.query(
        "UPDATE game SET status = $1 WHERE id = $2;",
        ["playing", gameData.rows[0].id]
      );

      return res.json({ game_id: gameData.rows[0].id });
    }

    return res.status(200).json({ message: "player joined" }); // response player_id and color
  } catch (error) {
    return res
      .status(500)
      .json({ message: ` something went wrong :- ${error.message}` });
  }
});

router.post("/start/:game_id", async (req, res) => {
  try {
    const { game_id } = req.params;

    // Check if there are 4 players for the game
    const playerData = await pool.query(
      "SELECT * FROM player WHERE game_id = $1;",
      [game_id]
    );

    if (playerData.rows.length < 4) {
      return res.status(400).json({ message: "Not enough players" });
    }

    // Defensive programming: Check if coin positions are already initialized
    const coinData = await pool.query(
      "SELECT * FROM coin_position WHERE game_id = $1;",
      [game_id]
    );

     await pool.query(
      "UPDATE game SET status = $1 WHERE id = $2;",
      ["playing", game_id]
    );
   
    if (coinData.rows.length) {
      return res.status(400).json({ message: "game is already started" });
    }
    
      for (const player of playerData.rows) {
        for (let i = 0; i < 4; i++) {
          await pool.query(
            "INSERT INTO coin_position (player_id, in_home, position , game_id) VALUES ($1, $2, $3,$4);",
            [player.id, false, 0, game_id]
          );
        }
      
    }
    
    const dice_value = Math.ceil(Math.random() * 6);
    // Select the first player with the red color
    const firstPlayer = await pool.query(
      "SELECT id FROM player WHERE game_id = $1 AND color = 'red';",
      [game_id]
    );

    const player_id = firstPlayer.rows[0].id;

    // Insert the first turn for the player with the red color
    await pool.query(
      "INSERT INTO player_turn (game_id, player_id , dice_value) VALUES ($1, $2 ,$3);",
      [game_id, player_id , dice_value]
    );

    res.status(200).json({ message: "game started" });
  } catch (error) {
    res.status(500).json({ message: `Something went wrong: ${error.message}` });
  }
});


export default router;

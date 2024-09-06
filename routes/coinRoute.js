import { Router } from "express";
import supabase from "../config/dbConfig.js";
import { nextPosition, nextTurn } from "../utils.js";

let router = Router();

router.put("/:game_id/move/:coin_id", async (req, res) => {
  try {
    const { game_id, coin_id } = req.params;
    const dice_value = req.body.value;

    if (dice_value < 1 || dice_value > 6) {
      return res.status(400).json({ message: "invalid dice spin " });
    }

    const gameData = await supabase.from("game").select("*").eq("id", game_id);

    if (gameData.data[0].status !== "playing") {
      return res.status(400).json({ message: "Not your turn " });
    }

    const { data } = await supabase
      .from("coin_position")
      .select("*")
      .eq("id", coin_id);

    const player_turn_data = await supabase
      .from("player_turn")
      .select("*")
      .eq("player_id", data[0].player_id);

    if (
      !player_turn_data.data.length ||
      player_turn_data.data[0].game_id !== game_id
    ) {
      return res.status(400).json({ message: "Not your turn " });
    }

    const colorData = await supabase
      .from("player")
      .select("color")
      .eq("id", data[0].player_id);

    const position = data[0].position;
    const steps_walked = data[0].steps_walked;

    const color = colorData.data[0].color;

    const newPosition = nextPosition(position, color, dice_value, steps_walked);

    if (newPosition[0] === -1) {
      return res
        .status(400)
        .json({ message: "this move is not posible chose other coin " });
    }

    await supabase
      .from("coin_position")
      .update({
        position: newPosition[0],
        steps_walked: newPosition[1],
      })
      .eq("id", coin_id);

    if (steps_walked === 57) {
      await supabase
        .from("coin_position")
        .update({ position: 100 })
        .eq("id", coin_id);
    }

    if (steps_walked > 51) {
      await supabase
        .from("coin_position")
        .update({
          position: -1,
          in_home: TRUE,
        })
        .eq("id", coin_id);
    }

    const next_color = nextTurn(color, dice_value);

    const nextPlayerID = await supabase
      .from("player")
      .select("id")
      .eq("game_id", game_id)
      .eq("color", next_color);

    await supabase
      .from("player_turn")
      .update({
        player_id: nextPlayerID.data[0].id,
      })
      .eq("game_id", game_id);

    return res.status(200).json({ message: "coin position updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// game state api

export default router;

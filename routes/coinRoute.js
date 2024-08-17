import { Router } from "express";
import supabase from "../config/dbConfig.js";

let router = Router();

const startingPosition = (color) => {
  if (color === "red") {
    return 1;
  } else if (color === "blue") {
    return 14;
  } else if (color === "yellow") {
    return 27;
  }
  return 40;
};

router.put("/move", async (req, res) => {
  const game_id = req.headers["game_id"];
  const dice_value = req.body.value;
  const coin_id = req.body.coin_id;

  const { data } = await supabase
    .from("coin_position")
    .select("*")
    .eq("id", coin_id);

  const position = data[0].position;
  const steps_walked = data[0].steps_walked;

  const color = await supabase
    .from("player")
    .select("color")
    .eq("id", data[0].player_id);

  if (dice_value === 6 && data[0].position === 0) {
    await supabase
      .from("coin_position")
      .update({
        position: startingPosition(color.data[0].color),
        steps_walked: 1,
      })
      .eq("id", coin_id);
  } else {
    var coinUpadate = await supabase
      .from("coin_position")
      .update({
        position: (position + dice_value) % 52 || 52,
        steps_walked: steps_walked + dice_value,
      })
      .eq("id", coin_id);
  }

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


  const players = await supabase
    .from("player")
    .select("id")
    .eq("game_id", game_id);

  const currentPlayer = await supabase
    .from("player_turn")
    .select("player_id")
    .eq("game_id", game_id);




  res.json(coinUpadate);
});


// game state api 
router.get("/available", async (req, res) => {
  try {
    const game_id = req.headers["game_id"];
    const diceValue = req.body.value;

    const { data } = await supabase
      .from("player_turn")
      .select("player_id")
      .eq("game_id", game_id);

    const coinData = await supabase
      .from("coin_position")
      .select("*")
      .eq("player_id", data[0].player_id);

    const coinJson = coinData.data;

    const availableCoins = coinJson.filter((coin) => {
      return (
        coin.position !== 100 &&
        coin.steps_walked + diceValue <= 57 &&
        !(coin.position === 0 && diceValue >= 1 && diceValue <= 5)
      );
    });

    res.status(200).json(availableCoins);
  } catch (error) {
    res
      .status(500)
      .json({ message: ` something went wrong :- ${error.message}` });
  }
});

export default router;

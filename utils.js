import { pool } from "./config/dbConfig.js";

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

export const nextPosition = (position, dice_value, color, steps_walked) => {
  // Ensure position, dice_value, and steps_walked are treated as numbers
  const pos = parseInt(position, 10);
  const dice = parseInt(dice_value, 10);
  const steps = parseInt(steps_walked, 10);

  if (
    steps + dice > 57 ||
    (pos === 0 && dice !== 6) ||
    steps === 57
  ) {
    return [-1, -1];
  }

  if (pos === 0 && dice === 6) {
    return [startingPosition(color), 1];
  }

  const new_position = (pos + dice) % 52 || 52;
  const new_steps_walked = steps + dice;

  return [new_position, new_steps_walked];
};;

export const nextTurn = (color, dice_value) => {
  if (dice_value == 6) {
    return color;
  }

  if (color === "red") {
    return "blue";
  } else if (color === "blue") {
    return "yellow";
  } else if (color === "yellow") {
    return "green";
  } else {
    return "red";
  }
};

export const nextPlayerTurn = async (game_id, dice_value) => {
  const playerTurnData = await pool.query(
    "SELECT * FROM player_turn WHERE game_id = $1;",
    [game_id]
  );
  const playerColor = await pool.query(
    "SELECT color FROM player WHERE id = $1;",
    [playerTurnData.rows[0].player_id]
  );

  const nextColor = nextTurn(playerColor.rows[0].color, dice_value);
  const nextPlayerID = await pool.query(
    "SELECT id FROM player WHERE game_id = $1 AND color = $2;",
    [game_id, nextColor]
  );

  return nextPlayerID;
};

export const canMove = (coins, dice_value) => {
  var flag = false;
  const dice = +dice_value;

  coins.rows.map((coin) => {
    const steps = +coin.steps_walked;
    const position = +coin.position; 

    if (position === 0) {
      if (dice === 6) {
        flag = true;
      }
    } else if (steps + dice <= 57 && position !== 100) {
      flag = true;
    }
  });

  return flag;
};

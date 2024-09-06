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

export const nextPosition = (position, color, dice_value, steps_walked) => {
  if (
    position + dice_value > 57 ||
    (position === 0 && dice_value != 6) ||
    steps_walked === 57
  ) {
    return [-1 , -1];
  }

  if (position === 0 && dice_value === 6) {
    return [startingPosition(color) , 1];
  }

  const new_position = (position + dice_value) % 52 || 52;
  const new_steps_walked = steps_walked + dice_value;

  return [new_position , new_steps_walked];
};

export const nextTurn = (color , dice_value) => {


  if(dice_value === 6){
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

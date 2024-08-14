import { Router } from "express";
import supabase from "../config/dbConfig.js";

let router = Router();

router.post("/create", async (req, res) => {
  try {
    const user_id = req.headers["user_id"];
  
    const { data, error } = await supabase
      .from("game")
      .insert({
        status: "waiting",
        created_by: user_id,
        created_at: Date.now(),
      })
      .select("id")
      .single();

    // check if currently in another game bad request 400 response code.

    await supabase.from("player").insert({
      game_id: data.id,
      user_id: user_id,
      color: "red",
      status: "in_progress",
      finished_ts: null,
    });
   
    console.log("game created");
    res.status(200).json({ game_id: data.id, user_id: user_id });
  } catch (error) {
    res
      .status(500)
      .json({ message: ` something went wrong :- ${error.message}` });
  }
});

router.post("/join", async (req, res) => {
  try {
    const user_id = req.headers["user_id"];
    const { data } = await supabase
      .from("game")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: false })
      .limit(1);
    if (data.length === 0) {
      res.json({ message: "No available games right now" });
    }

    const { count } = await supabase
      .from("player")
      .select("*", { count: "exact", head: true })
      .eq("game_id", data[0].id);

    let color;

    if (count === 1){ color = "green"}
    else if (count === 2) {color = "yellow"}
    else {color = "blue"};
    

    // if count is more then three bad request.
    await supabase.from("player").insert({
      game_id: data[0].id,
      user_id: user_id,
      color: color,
      status: "progressed",
      finished_ts: null,
    });
    
    if (count >= 3) {
      await supabase
        .from("game")
        .update({ status: "playing" })
        .eq("id", data[0].id);

      res.json({ game_id: data[0].id });
    }

    res.status(200).json({ message: "player joined" }); // response player_id and color 
  } catch (error) {
    res
      .status(500)
      .json({ message: ` something went wrong :- ${error.message}` });
  }
});

router.post("/start", async (req, res) => {
  const game_id = req.headers["game_id"];

  //if not 4 players bad request.

  const { data } = await supabase
    .from("player")
    .select("*")
    .eq("game_id", game_id);

  
  for(const playerData of data){
    for(let i = 0; i < 4; i++){
      await supabase.from("coin_position").insert({
        player_id:playerData.id,
        in_home:false,
        position:0
      });
    }
  }


  // start game and move coin

 const cointTable =   await supabase.from("coin_position").select("*");
 res.send(cointTable);



});




export default router;

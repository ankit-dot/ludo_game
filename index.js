import express from "express";
import "dotenv/config";
const app = express();
const port = 3000;
// import userRoutes from './routes/userRoute.js'
import supabase from "./config/dbConfig.js";
import gameRoutes from './routes/gameRoute.js'
import coinRoutes from './routes/coinRoute.js'

app.use(express.json());


// app.use("/api/v1/users", userRoutes);
app.use("/api/v1/games", gameRoutes);
app.use("/api/v1/coin", coinRoutes);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

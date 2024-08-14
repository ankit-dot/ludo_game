// import { Router } from 'express'
// import supabase from '../config/dbConfig.js';
// import pkg from 'express/lib/response.js';
// const { redirect } = pkg;


// let router = Router()





// router.post("/auth", async (req, res) => {

//     const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: 'http://localhost:3000/api/v1/users',
//         },
//       })
      
//       if (data.url) {
//         console.log(data.url)// use the redirect API for your server framework
//       }

//   });
// router.get("/", async (req, res) => {
    
    

//     const token = req.query.access_token;
      
  
//     const { autheError } = await supabase.from("user").insert({
//       email: "ankit@gmail.com",
//       username: "ankit07",
//     });
//     if (autheError) {
//       res.send(autheError);
//     }
    
//     res.send("created!!");

//   });

// export default router
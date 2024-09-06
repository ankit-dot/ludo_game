import { createClient } from '@supabase/supabase-js'
import "dotenv/config";
import pkg from 'pg';
const { Pool } = pkg;




// Export the pool instance for use in other modules



const supabaseUrl = 'https://czmutdptyfpbnqjiedsa.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;



export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });




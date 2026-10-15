import { createClient } from "@supabase/supabase-js";
import ws from "ws";

import { SUPABASE_SERVICE_ROLE, SUPABASE_URL } from "./env.js";



if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    persistSession: false
  },
  realtime: {
    transport: ws 
  }
});

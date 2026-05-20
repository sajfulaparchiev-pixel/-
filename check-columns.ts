import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://wupdzngvlyuvioyesgjl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGR6bmd2bHl1dmlveWVzZ2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTI1NDEsImV4cCI6MjA4NDcyODU0MX0.zzj4vS_4GZnMfdouohoymclBQMM6t8xI4pEphTwG3wE");
async function run() {
  const { data, error } = await supabase.from("messages").select("deleted_for_sender, deleted_for_all").limit(1);
  if (error) console.error("Error:", error);
  else console.log("Success: columns exist");
}
run();

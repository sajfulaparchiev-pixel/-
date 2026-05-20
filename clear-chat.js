import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wupdzngvlyuvioyesgjl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGR6bmd2bHl1dmlveWVzZ2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTI1NDEsImV4cCI6MjA4NDcyODU0MX0.zzj4vS_4GZnMfdouohoymclBQMM6t8xI4pEphTwG3wE"
);

async function deleteMessages() {
  const { data, error } = await supabase
    .from("messages")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Just need a condition to delete all
  if (error) {
    console.error("Error deleting messages:", error);
  } else {
    console.log("Deleted messages:", data);
  }
}

deleteMessages();

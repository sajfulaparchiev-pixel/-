-- Messages table for real-time chat between users
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_type TEXT,
  file_data TEXT,
  deleted_for_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);

-- Helper function: stable conversation id from two user ids (sorted)
CREATE OR REPLACE FUNCTION public.make_conversation_id(a UUID, b UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN a < b THEN a::text || '_' || b::text ELSE b::text || '_' || a::text END;
$$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Sender can insert messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND conversation_id = public.make_conversation_id(sender_id, recipient_id));

CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Sender can delete own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
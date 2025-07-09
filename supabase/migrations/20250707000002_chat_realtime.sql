-- Migration: enable realtime replication for chat_messages

-- Add chat_messages to supabase_realtime publication (if not already)
alter publication supabase_realtime add table if not exists public.chat_messages;

-- Ensure replica identity full for UPDATE / DELETE support
alter table public.chat_messages replica identity full; 
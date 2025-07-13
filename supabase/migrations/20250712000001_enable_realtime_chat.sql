-- Enable realtime for chat_messages table
alter publication supabase_realtime add table chat_messages;

-- Set replica identity to full for better realtime updates
alter table chat_messages replica identity full;
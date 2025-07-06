-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert messages
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow all authenticated users to read messages
CREATE POLICY "Users can read all messages" ON messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
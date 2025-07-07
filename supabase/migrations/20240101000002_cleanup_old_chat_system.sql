-- Migration to clean up old chat system after moving to Stream Chat

-- Drop the messages table and its associated policies/triggers
DROP TABLE IF EXISTS public.messages CASCADE;

-- Note: We're keeping the profiles table as it may be useful for user profiles
-- and other features beyond just chat

-- Drop any chat-related functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_message() CASCADE;

-- Add a comment to document the migration
COMMENT ON SCHEMA public IS 'Migrated from Supabase-based chat to Stream Chat. Messages table removed.';
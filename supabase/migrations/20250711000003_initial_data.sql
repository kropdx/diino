-- Initial data seeding for Diino application

-- Create the global chat room that the application expects
INSERT INTO public.chat_rooms (id, name, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Global Chat', NOW()) 
ON CONFLICT (id) DO NOTHING;

-- Add any other initial data the application expects here
-- For example, default tags, admin users, etc. 
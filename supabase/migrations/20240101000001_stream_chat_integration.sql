-- Stream Chat Integration
-- This sets up automatic user syncing to Stream Chat when new users sign up
-- All users are automatically added to a single global chat channel

-- Create a function to sync users with Stream Chat
CREATE OR REPLACE FUNCTION sync_user_to_stream()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to create the Stream user and add to global channel
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-stream-user',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_stream();

-- Note: You need to deploy the Supabase Edge Function 'sync-stream-user'
-- and set the following environment variables:
-- - STREAM_API_KEY: Your Stream Chat API key
-- - STREAM_API_SECRET: Your Stream Chat API secret
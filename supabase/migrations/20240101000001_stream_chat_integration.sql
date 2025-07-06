-- Create a function to sync users with Stream Chat
CREATE OR REPLACE FUNCTION sync_user_to_stream()
RETURNS TRIGGER AS $$
DECLARE
  stream_api_key text;
  stream_api_secret text;
BEGIN
  -- Note: In production, store these in Supabase Vault
  -- For now, you'll need to set these values manually
  stream_api_key := 'your_stream_api_key';
  stream_api_secret := 'your_stream_api_secret';
  
  -- Call an edge function to create the Stream user
  -- This is a placeholder - you'll need to implement the edge function
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/sync-stream-user',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || stream_api_secret,
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_stream();

-- Note: You'll need to create a Supabase Edge Function called 'sync-stream-user'
-- that handles the actual Stream Chat user creation
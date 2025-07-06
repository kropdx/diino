import { StreamChat } from 'stream-chat';

export async function createStreamUser(userId: string, email: string, name?: string) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Missing Stream Chat API credentials');
  }
  
  const serverClient = StreamChat.getInstance(apiKey, apiSecret);
  
  const token = serverClient.createToken(userId);
  
  await serverClient.upsertUser({
    id: userId,
    name: name || email.split('@')[0] || 'User',
  });
  
  return token;
}
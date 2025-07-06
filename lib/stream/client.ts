import { StreamChat } from 'stream-chat';

let streamClient: StreamChat | null = null;

export function getStreamClient() {
  if (!streamClient) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      throw new Error('Missing NEXT_PUBLIC_STREAM_API_KEY environment variable');
    }
    streamClient = StreamChat.getInstance(apiKey);
  }
  return streamClient;
}
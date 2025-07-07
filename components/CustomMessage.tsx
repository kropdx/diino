'use client';

import { useMessageContext } from 'stream-chat-react';

export default function CustomMessage() {
  const { message } = useMessageContext();
  
  if (!message) return null;

  const username = message.user?.name || message.user?.id || 'Unknown';
  const isDeleted = message.type === 'deleted';
  
  return (
    <div className="flex items-start gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/50">
      <span className="font-semibold text-sm shrink-0">@{username}</span>
      <span className="text-sm flex-1">
        {isDeleted ? (
          <span className="text-gray-400 italic">Message deleted</span>
        ) : (
          <span>{message.text}</span>
        )}
      </span>
      <span className="text-gray-500 text-xs shrink-0">
        {message.created_at && new Date(message.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </span>
    </div>
  );
}
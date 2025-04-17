import React from 'react';
import type { ContactMessage } from '../../types';

interface MessagesTabProps {
  messages: ContactMessage[];
}

const MessagesTab: React.FC<MessagesTabProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Messages</h2>
      {messages.length === 0 ? (
        <p className="text-gray-500">No messages found.</p>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="p-4 bg-gray-50 rounded-md shadow-sm">
            <p className="font-medium">{msg.full_name}</p>
            <p className="text-sm text-gray-600">{msg.email}</p>
            <p className="text-sm mt-1">{msg.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(msg.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default MessagesTab;



import React, { useState, useRef, useEffect } from 'react';
import { MessageThread, User } from '../types';
import { Icon } from './Icon';

interface ChatViewProps {
  thread: MessageThread;
  currentUser: User;
  participant: User;
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

const ChatBubble: React.FC<{ message: string; isCurrentUser: boolean; }> = ({ message, isCurrentUser }) => {
  const bubbleClasses = isCurrentUser
    ? 'bg-orange-600 text-white self-end'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start';
  return (
    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${bubbleClasses}`}>
      {message}
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({ thread, currentUser, participant, onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md z-10 sticky top-0">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button onClick={onClose} className="text-gray-600 dark:text-gray-300 hover:text-orange-600 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <img src={participant.profilePicture} alt={participant.name} className="w-10 h-10 rounded-full object-cover mr-3" />
          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{participant.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Regarding: {thread.productTitle}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col space-y-4">
          {thread.messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              isCurrentUser={msg.senderId === currentUser.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2">
        <form onSubmit={handleSend} className="container mx-auto px-2 flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full py-2 px-4 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button type="submit" className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-700 transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

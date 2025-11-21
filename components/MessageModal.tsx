
import React, { useState } from 'react';
import { Icon } from './Icon';
import { Product } from '../types';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSendMessage: (message: string) => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, product, onSendMessage }) => {
  const [message, setMessage] = useState(`Hi, I'm interested in your "${product.title}". Is it still available?`);

  if (!isOpen) return null;

  const handleSend = () => {
    if (message.trim() === '') {
        alert('Please enter a message.');
        return;
    }
    onSendMessage(message);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <Icon name="close" className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Message Seller</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Regarding: <span className="font-semibold">{product.title}</span></p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Message</label>
              <textarea 
                id="message" 
                rows={5} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSend} 
                className="bg-orange-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

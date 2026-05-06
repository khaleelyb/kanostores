
import React from 'react';
import { MessageThread, User } from '../types';
import type { Order } from '../services/dbService';

const formatTimeAgo = (timestamp: number): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - timestamp) / 1000);
    if (seconds < 60) return `Just now`;
    
    const intervals: { [key: string]: number } = {
        'y': 31536000,
        'mo': 2592000,
        'd': 86400,
        'h': 3600,
        'm': 60
    };
    
    for (const key in intervals) {
        const interval = Math.floor(seconds / intervals[key]);
        if (interval >= 1) {
            return `${interval}${key} ago`;
        }
    }
    return `Just now`;
};


interface MessageItemProps {
    name: string;
    message: string;
    time: string;
    avatarUrl: string;
    productTitle: string;
    onClick: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ name, message, time, avatarUrl, productTitle, onClick }) => (
    <button onClick={onClick} className="w-full text-left flex items-start p-4 space-x-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
        <div className="relative flex-shrink-0">
            <img className="h-12 w-12 rounded-full object-cover" src={avatarUrl} alt={name} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-200">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic truncate" title={productTitle}>Re: {productTitle}</p>
            <p className="text-sm truncate text-gray-600 dark:text-gray-300">{message}</p>
        </div>
    </button>
);

interface MessagesPageProps {
    threads: MessageThread[];
    currentUser: User;
    users: User[];
    orders: Order[];
    onSelectThread: (threadId: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ threads, currentUser, users, orders, onSelectThread }) => {
    const myThreads = threads
        .filter(thread => thread.participants.includes(currentUser.id))
        .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

    const sellerOrders = orders
        .filter(order => order.sellerId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const statusClasses: Record<Order['status'], string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };


    if (myThreads.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                {sellerOrders.length > 0 && (
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Your Orders</h2>
                        <div className="space-y-2">
                            {sellerOrders.slice(0, 5).map(order => (
                                <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{order.productTitle || 'Order item'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyerName || 'Unknown buyer'} • ₦{order.amount.toLocaleString()}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClasses[order.status]}`}>{order.status}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Messages</h1>
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No messages yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">When you message a seller, your conversation will appear here.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {sellerOrders.length > 0 && (
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Your Orders</h2>
                    <div className="space-y-2">
                        {sellerOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{order.productTitle || "Order item"}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyerName || "Unknown buyer"} • ₦{order.amount.toLocaleString()}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClasses[order.status]}`}>{order.status}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Messages</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {myThreads.map(thread => {
                        const otherParticipantId = thread.participants.find(p => p !== currentUser.id);
                        const otherUser = users.find(u => u.id === otherParticipantId);
                        const lastMessage = thread.messages[thread.messages.length - 1];

                        if (!otherUser || !lastMessage) return null;

                        return (
                            <MessageItem 
                                key={thread.id}
                                name={otherUser.name}
                                avatarUrl={otherUser.profilePicture}
                                message={`${lastMessage.senderId === currentUser.id ? 'You: ' : ''}${lastMessage.text}`}
                                time={formatTimeAgo(lastMessage.timestamp)}
                                productTitle={thread.productTitle}
                                onClick={() => onSelectThread(thread.id)}
                            />
                        );
                    })}
                </div>
            </div>
            </div>
        </div>
    );
};

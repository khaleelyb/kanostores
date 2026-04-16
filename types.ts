export interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  location: string;
  date: string;
  description: string;
  sellerId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  profilePicture: string;
  phone?: string;
  bio?: string;          // ← add this
  isAdmin?: boolean;
  isVerified?: boolean;
  isBoosted?: boolean;
  boostedUntil?: string | null;
}

export type Theme = 'light' | 'dark' | 'system';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface MessageThread {
  id: string;
  productId: string;
  productTitle: string;
  participants: [string, string];
  messages: Message[];
  lastMessageTimestamp: number;
}

export type Page = 'home' | 'saved' | 'messages' | 'profile' | 'edit-profile' | 'admin';

export interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[]; // Changed from image: string to images: string[]
  location: string;
  date: string;
  description: string;
  sellerId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  profilePicture: string; // URL to the image or data URL
}

export type Theme = 'light' | 'dark' | 'system';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface MessageThread {
  id: string; // combination of participants and product
  productId: string;
  productTitle: string;
  participants: [string, string]; // [user1_id, user2_id]
  messages: Message[];
  lastMessageTimestamp: number;
}

export type Page = 'home' | 'saved' | 'messages' | 'profile' | 'edit-profile';

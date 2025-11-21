/// <reference path="../supabase-js-shim.d.ts" />
import { createClient } from '@supabase/supabase-js';

// Prefer Vite-style env vars; also support NEXT_PUBLIC_* and generic Node env fallbacks
const nodeEnv = (globalThis as any)?.process?.env || {};
const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL ||
  viteEnv.NEXT_PUBLIC_SUPABASE_URL ||
  viteEnv.REACT_APP_SUPABASE_URL ||
  nodeEnv.VITE_SUPABASE_URL ||
  nodeEnv.NEXT_PUBLIC_SUPABASE_URL ||
  nodeEnv.REACT_APP_SUPABASE_URL ||
  nodeEnv.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  viteEnv.REACT_APP_SUPABASE_ANON_KEY ||
  nodeEnv.VITE_SUPABASE_ANON_KEY ||
  nodeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  nodeEnv.REACT_APP_SUPABASE_ANON_KEY ||
  nodeEnv.SUPABASE_ANON_KEY ||
  nodeEnv.SUPABASE_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn('[Supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          username: string;
          profile_picture: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          username: string;
          profile_picture: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string;
          profile_picture?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          price: number;
          category: string;
          image: string;
          location: string;
          date: string;
          description: string;
          seller_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          price: number;
          category: string;
          image: string;
          location: string;
          date: string;
          description: string;
          seller_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          price?: number;
          category?: string;
          image?: string;
          location?: string;
          date?: string;
          description?: string;
          seller_id?: string;
          created_at?: string;
        };
      };
      saved_products: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      message_threads: {
        Row: {
          id: string;
          product_id: string;
          product_title: string;
          participant1_id: string;
          participant2_id: string;
          last_message_timestamp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_title: string;
          participant1_id: string;
          participant2_id: string;
          last_message_timestamp: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          product_title?: string;
          participant1_id?: string;
          participant2_id?: string;
          last_message_timestamp?: number;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          text: string;
          timestamp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          text: string;
          timestamp: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          text?: string;
          timestamp?: number;
          created_at?: string;
        };
      };
    };
  };
}

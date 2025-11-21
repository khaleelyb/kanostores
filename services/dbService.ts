import { supabase } from './supabase_client';
import { Product, User, MessageThread, Message, Theme } from '../types';

// Theme
export const getTheme = (): Theme => {
    try {
        const saved = localStorage.getItem('kano-theme');
        return (saved as Theme) || 'system';
    } catch {
        return 'system';
    }
};

export const saveTheme = (theme: Theme): void => {
    try {
        localStorage.setItem('kano-theme', theme);
    } catch (error) {
        console.error('Error saving theme:', error);
    }
};

// Current User
export const getCurrentUser = (): User | null => {
    try {
        const saved = localStorage.getItem('kano-currentUser');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export const saveCurrentUser = (user: User): void => {
    try {
        localStorage.setItem('kano-currentUser', JSON.stringify(user));
    } catch (error) {
        console.error('Error saving current user:', error);
    }
};

export const clearCurrentUser = (): void => {
    localStorage.removeItem('kano-currentUser');
};

// Users
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            profilePicture: u.profile_picture
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                name: user.name,
                username: user.username,
                profile_picture: user.profilePicture
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            username: data.username,
            profilePicture: data.profile_picture
        };
    } catch (error) {
        console.error('Error creating user:', error);
        return null;
    }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('users')
            .update({
                name: updates.name,
                username: updates.username,
                profile_picture: updates.profilePicture
            })
            .eq('id', userId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(p => {
            let images: string[] = [];
            try {
                const parsed = JSON.parse(p.image);
                if (Array.isArray(parsed)) {
                    images = parsed;
                } else {
                    images = [p.image];
                }
            } catch {
                // If it fails to parse, assume it's a single URL string
                if (p.image) {
                    images = [p.image];
                }
            }

            return {
                id: p.id,
                title: p.title,
                price: p.price,
                category: p.category,
                images: images, 
                location: p.location,
                date: p.date,
                description: p.description,
                sellerId: p.seller_id
            };
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    try {
        // Serialize images array to JSON string
        const imagePayload = JSON.stringify(product.images);

        const { data, error } = await supabase
            .from('products')
            .insert({
                title: product.title,
                price: product.price,
                category: product.category,
                image: imagePayload, // Store as JSON string
                location: product.location,
                date: product.date,
                description: product.description,
                seller_id: product.sellerId
            })
            .select()
            .single();
        
        if (error) {
            console.error('Supabase createProduct error details:', error.message, error.details, error.hint);
            throw error;
        }

        let images: string[] = [];
        try {
             const parsed = JSON.parse(data.image);
             if (Array.isArray(parsed)) images = parsed;
             else images = [data.image];
        } catch {
             images = [data.image];
        }
        
        return {
            id: data.id,
            title: data.title,
            price: data.price,
            category: data.category,
            images: images,
            location: data.location,
            date: data.date,
            description: data.description,
            sellerId: data.seller_id
        };
    } catch (error) {
        console.error('Error creating product:', error);
        return null;
    }
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<boolean> => {
    try {
        const payload: any = {
            title: updates.title,
            price: updates.price,
            category: updates.category,
            description: updates.description
        };

        if (updates.images) {
            payload.image = JSON.stringify(updates.images);
        }

        const { error } = await supabase
            .from('products')
            .update(payload)
            .eq('id', productId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating product:', error);
        return false;
    }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        return false;
    }
};

// Saved Products, Threads, Messages, etc. (unchanged)
export const getSavedProductIds = async (userId: string | undefined): Promise<Set<string>> => {
    if (!userId) return new Set();
    try {
        const { data, error } = await supabase.from('saved_products').select('product_id').eq('user_id', userId);
        if (error) throw error;
        return new Set((data || []).map(item => item.product_id));
    } catch (error) {
        console.error('Error fetching saved products:', error);
        return new Set();
    }
};

export const saveProduct = async (userId: string, productId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('saved_products').insert({ user_id: userId, product_id: productId });
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving product:', error);
        return false;
    }
};

export const unsaveProduct = async (userId: string, productId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('saved_products').delete().eq('user_id', userId).eq('product_id', productId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error unsaving product:', error);
        return false;
    }
};

export const getThreads = async (): Promise<MessageThread[]> => {
    try {
        const { data: threadsData, error: threadsError } = await supabase.from('message_threads').select('*').order('last_message_timestamp', { ascending: false });
        if (threadsError) throw threadsError;
        
        const threads = await Promise.all((threadsData || []).map(async (thread) => {
            const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').eq('thread_id', thread.id).order('timestamp', { ascending: true });
            if (messagesError) throw messagesError;
            const messages: Message[] = (messagesData || []).map(m => ({ id: m.id, senderId: m.sender_id, text: m.text, timestamp: m.timestamp }));
            return {
                id: thread.id,
                productId: thread.product_id,
                productTitle: thread.product_title,
                participants: [thread.participant1_id, thread.participant2_id] as [string, string],
                messages,
                lastMessageTimestamp: thread.last_message_timestamp
            };
        }));
        return threads;
    } catch (error) {
        console.error('Error fetching threads:', error);
        return [];
    }
};

export const createThread = async (thread: Omit<MessageThread, 'messages'>): Promise<MessageThread | null> => {
    try {
        const { data, error } = await supabase.from('message_threads').insert({
                id: thread.id,
                product_id: thread.productId,
                product_title: thread.productTitle,
                participant1_id: thread.participants[0],
                participant2_id: thread.participants[1],
                last_message_timestamp: thread.lastMessageTimestamp
            }).select().single();
        if (error) throw error;
        return {
            id: data.id,
            productId: data.product_id,
            productTitle: data.product_title,
            participants: [data.participant1_id, data.participant2_id] as [string, string],
            messages: [],
            lastMessageTimestamp: data.last_message_timestamp
        };
    } catch (error) {
        console.error('Error creating thread:', error);
        return null;
    }
};

export const updateThreadTimestamp = async (threadId: string, timestamp: number): Promise<boolean> => {
    try {
        const { error } = await supabase.from('message_threads').update({ last_message_timestamp: timestamp }).eq('id', threadId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating thread timestamp:', error);
        return false;
    }
};

export const createMessage = async (message: Message, threadId: string): Promise<Message | null> => {
    try {
        const { data, error } = await supabase.from('messages').insert({
                thread_id: threadId,
                sender_id: message.senderId,
                text: message.text,
                timestamp: message.timestamp
            }).select().single();
        if (error) throw error;
        await updateThreadTimestamp(threadId, message.timestamp);
        return { id: data.id, senderId: data.sender_id, text: data.text, timestamp: data.timestamp };
    } catch (error) {
        console.error('Error creating message:', error);
        return null;
    }
};

export const uploadImage = async (file: File, bucket: 'products' | 'profiles'): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};

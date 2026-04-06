import { supabase } from './supabase_client';
import { Product, User, MessageThread, Message, Theme } from '../types';

// ── Theme ─────────────────────────────────────────────────────────────────────
export const getTheme = (): Theme => {
    try { return (localStorage.getItem('kano-theme') as Theme) || 'system'; } catch { return 'system'; }
};
export const saveTheme = (theme: Theme): void => {
    try { localStorage.setItem('kano-theme', theme); } catch (e) { console.error(e); }
};

// ── Session user ──────────────────────────────────────────────────────────────
export const getCurrentUser = (): User | null => {
    try { const s = localStorage.getItem('kano-currentUser'); return s ? JSON.parse(s) : null; } catch { return null; }
};
export const saveCurrentUser = (user: User): void => {
    try { localStorage.setItem('kano-currentUser', JSON.stringify(user)); } catch (e) { console.error(e); }
};
export const clearCurrentUser = (): void => { localStorage.removeItem('kano-currentUser'); };

// ── Helper: map DB row → User ─────────────────────────────────────────────────
const rowToUser = (u: any): User => ({
    id: u.id,
    name: u.name,
    username: u.username,
    profilePicture: u.profile_picture,
    phone: u.phone ?? undefined,
    bio: u.bio ?? undefined,          // ← add
    isVerified: u.is_verified ?? false,
    isBoosted: u.is_boosted ?? false,
    boostedUntil: u.boosted_until ?? null,
});

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(rowToUser);
    } catch (e) { console.error('getUsers:', e); return []; }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert({ name: user.name, username: user.username, profile_picture: user.profilePicture, phone: user.phone ?? null })
            .select().single();
        if (error) throw error;
        return rowToUser(data);
    } catch (e) { console.error('createUser:', e); return null; }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined)            payload.name = updates.name;
        if (updates.username !== undefined)        payload.username = updates.username;
        if (updates.profilePicture !== undefined)  payload.profile_picture = updates.profilePicture;
        if (updates.phone !== undefined)           payload.phone = updates.phone || null;
        if (updates.bio !== undefined) payload.bio = updates.bio || null;
        if (updates.isVerified !== undefined)      payload.is_verified = updates.isVerified;
        if (updates.isBoosted !== undefined)       payload.is_boosted = updates.isBoosted;
        if (updates.boostedUntil !== undefined)    payload.boosted_until = updates.boostedUntil;

        const { error } = await supabase.from('users').update(payload).eq('id', userId);
        if (error) throw error;
        return true;
    } catch (e) { console.error('updateUser:', e); return false; }
};

// ── Products ──────────────────────────────────────────────────────────────────
const parseImages = (raw: string): string[] => {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; } catch { return raw ? [raw] : []; }
};

export const getProducts = async (): Promise<Product[]> => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({
            id: p.id, title: p.title, price: p.price, category: p.category,
            images: parseImages(p.image), location: p.location, date: p.date,
            description: p.description, sellerId: p.seller_id,
        }));
    } catch (e) { console.error('getProducts:', e); return []; }
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert({ title: product.title, price: product.price, category: product.category,
                image: JSON.stringify(product.images), location: product.location,
                date: product.date, description: product.description, seller_id: product.sellerId })
            .select().single();
        if (error) throw error;
        return { id: data.id, title: data.title, price: data.price, category: data.category,
            images: parseImages(data.image), location: data.location, date: data.date,
            description: data.description, sellerId: data.seller_id };
    } catch (e) { console.error('createProduct:', e); return null; }
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<boolean> => {
    try {
        const payload: Record<string, unknown> = { title: updates.title, price: updates.price, category: updates.category, description: updates.description };
        if (updates.images) payload.image = JSON.stringify(updates.images);
        const { error } = await supabase.from('products').update(payload).eq('id', productId);
        if (error) throw error;
        return true;
    } catch (e) { console.error('updateProduct:', e); return false; }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
        return true;
    } catch (e) { console.error('deleteProduct:', e); return false; }
};

// ── Saved products ────────────────────────────────────────────────────────────
export const getSavedProductIds = async (userId: string | undefined): Promise<Set<string>> => {
    if (!userId) return new Set();
    try {
        const { data, error } = await supabase.from('saved_products').select('product_id').eq('user_id', userId);
        if (error) throw error;
        return new Set((data || []).map(i => i.product_id));
    } catch (e) { console.error(e); return new Set(); }
};
export const saveProduct = async (userId: string, productId: string): Promise<boolean> => {
    try { const { error } = await supabase.from('saved_products').insert({ user_id: userId, product_id: productId }); if (error) throw error; return true; } catch { return false; }
};
export const unsaveProduct = async (userId: string, productId: string): Promise<boolean> => {
    try { const { error } = await supabase.from('saved_products').delete().eq('user_id', userId).eq('product_id', productId); if (error) throw error; return true; } catch { return false; }
};

// ── Threads & Messages ────────────────────────────────────────────────────────
export const getThreads = async (): Promise<MessageThread[]> => {
    try {
        const { data: td, error: te } = await supabase.from('message_threads').select('*').order('last_message_timestamp', { ascending: false });
        if (te) throw te;
        return Promise.all((td || []).map(async t => {
            const { data: md, error: me } = await supabase.from('messages').select('*').eq('thread_id', t.id).order('timestamp', { ascending: true });
            if (me) throw me;
            return { id: t.id, productId: t.product_id, productTitle: t.product_title,
                participants: [t.participant1_id, t.participant2_id] as [string, string],
                messages: (md || []).map(m => ({ id: m.id, senderId: m.sender_id, text: m.text, timestamp: m.timestamp })),
                lastMessageTimestamp: t.last_message_timestamp };
        }));
    } catch (e) { console.error('getThreads:', e); return []; }
};

export const createThread = async (thread: Omit<MessageThread, 'messages'>): Promise<MessageThread | null> => {
    try {
        const { data, error } = await supabase.from('message_threads')
            .insert({ id: thread.id, product_id: thread.productId, product_title: thread.productTitle,
                participant1_id: thread.participants[0], participant2_id: thread.participants[1],
                last_message_timestamp: thread.lastMessageTimestamp })
            .select().single();
        if (error) throw error;
        return { id: data.id, productId: data.product_id, productTitle: data.product_title,
            participants: [data.participant1_id, data.participant2_id] as [string, string],
            messages: [], lastMessageTimestamp: data.last_message_timestamp };
    } catch (e) { console.error('createThread:', e); return null; }
};

export const updateThreadTimestamp = async (threadId: string, timestamp: number): Promise<boolean> => {
    try { const { error } = await supabase.from('message_threads').update({ last_message_timestamp: timestamp }).eq('id', threadId); if (error) throw error; return true; } catch { return false; }
};

export const createMessage = async (message: Message, threadId: string): Promise<Message | null> => {
    try {
        const { data, error } = await supabase.from('messages')
            .insert({ thread_id: threadId, sender_id: message.senderId, text: message.text, timestamp: message.timestamp })
            .select().single();
        if (error) throw error;
        await updateThreadTimestamp(threadId, message.timestamp);
        return { id: data.id, senderId: data.sender_id, text: data.text, timestamp: data.timestamp };
    } catch (e) { console.error('createMessage:', e); return null; }
};

export const uploadImage = async (file: File, bucket: 'products' | 'profiles'): Promise<string | null> => {
    try {
        const ext = file.name.split('.').pop();
        const name = `${Date.now()}-${Math.random().toString(36).slice(7)}.${ext}`;
        const { data, error } = await supabase.storage.from(bucket).upload(name, file);
        if (error) throw error;
        return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
    } catch (e) { console.error('uploadImage:', e); return null; }
};

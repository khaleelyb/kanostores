import { supabase } from './supabase_client';
import { Product, User, MessageThread, Message, Theme } from '../types';

// ── Theme ─────────────────────────────────────────────────────────────────────
export const getTheme = (): Theme => {
    try { return (localStorage.getItem('kano-theme') as Theme) || 'system'; } catch { return 'system'; }
};
export const saveTheme = (theme: Theme): void => {
    try { localStorage.setItem('kano-theme', theme); } catch (e) { console.error(e); }
};

// ── Session user (LOCAL STORAGE) ──────────────────────────────────────────────
 const getCurrentUser = (): User | null => {
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
    bio: u.bio ?? undefined,
    isVerified: u.is_verified ?? false,
    isBoosted: u.is_boosted ?? false,
    boostedUntil: u.boosted_until ?? null,
    isApprovedSeller: u.is_approved_seller ?? false,
    email: u.email ?? undefined,
    address: u.address ?? undefined,
    pin: u.pin ?? null,
});

// ── SUPABASE AUTH ─────────────────────────────────────────────────────────────

// SIGN UP
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  username: string,
  profilePicture?: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username, profile_picture: profilePicture ?? '' }
      }
    });
    if (error) throw error;
    if (!data.user) return null;

    // wait for DB trigger
    await new Promise(r => setTimeout(r, 500));

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (!userData) return null;

    const user = rowToUser(userData);
    saveCurrentUser(user);

    return user;
  } catch (e) {
    console.error('signUpWithEmail:', e);
    return null;
  }
};

// SIGN IN
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (!userData) return null;

    const user = rowToUser(userData);
    saveCurrentUser(user);

    return user;
  } catch (e) {
    console.error('signInWithEmail:', e);
    return null;
  }
};

// SIGN OUT
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  clearCurrentUser();
};

// GET SESSION USER
export const getSessionUser = async (): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();

    return data ? rowToUser(data) : null;
  } catch {
    return null;
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(rowToUser);
    } catch (e) { console.error('getUsers:', e); return []; }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.username !== undefined) payload.username = updates.username;
        if (updates.profilePicture !== undefined) payload.profile_picture = updates.profilePicture;
        if (updates.phone !== undefined) payload.phone = updates.phone || null;
        if (updates.bio !== undefined) payload.bio = updates.bio || null;
        if (updates.email !== undefined) payload.email = updates.email || null;
        if (updates.address !== undefined) payload.address = updates.address || null;

        const { error } = await supabase.from('users').update(payload).eq('id', userId);
        if (error) throw error;
        return true;
    } catch (e) { console.error('updateUser:', e); return false; }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    try {
        await supabase.from('saved_products').delete().eq('user_id', userId);
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
        return true;
    } catch (e) { console.error('deleteUser:', e); return false; }
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
const parseImages = (raw: string): string[] => {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; } catch { return raw ? [raw] : []; }
};

export const getProducts = async (): Promise<Product[]> => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            category: p.category,
            images: parseImages(p.image),
            location: p.location,
            date: p.date,
            description: p.description,
            sellerId: p.seller_id,
        }));
    } catch (e) { console.error('getProducts:', e); return []; }
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    try {
        const { data, error } = await supabase.from('products')
            .insert({
                title: product.title,
                price: product.price,
                category: product.category,
                image: JSON.stringify(product.images),
                location: product.location,
                date: product.date,
                description: product.description,
                seller_id: product.sellerId
            })
            .select().single();
        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            price: data.price,
            category: data.category,
            images: parseImages(data.image),
            location: data.location,
            date: data.date,
            description: data.description,
            sellerId: data.seller_id,
        };
    } catch (e) { console.error('createProduct:', e); return null; }
};

// ── SAVED PRODUCTS ────────────────────────────────────────────────────────────
export const getSavedProductIds = async (userId?: string): Promise<Set<string>> => {
    if (!userId) return new Set();
    try {
        const { data } = await supabase.from('saved_products').select('product_id').eq('user_id', userId);
        return new Set((data || []).map(i => i.product_id));
    } catch { return new Set(); }
};
// In dbService.ts — add this instead
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    // First verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) return false;

    // Now update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  } catch (e) { console.error('changeUserPassword:', e); return false; }
};


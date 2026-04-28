import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { Footer } from './components/Footer';
import { AddProductModal } from './components/AddProductModal';
import { BottomNav } from './components/BottomNav';
import { SavedPage } from './components/SavedPage';
import { MessagesPage } from './components/MessagesPage';
import { ProfilePage } from './components/ProfilePage';
import { EditProfilePage } from './components/EditProfilePage';
import { AuthModal, AuthData } from './components/AuthModal';
import { AuthPrompt } from './components/AuthPrompt';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ShopListPage } from './components/ShopListPage';
import { ShopProductsPage } from './components/ShopProductsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Toast } from './components/Toast';
import { Product, User, Theme, Message, MessageThread, Page } from './types';
import { CATEGORIES, CART_CATEGORIES } from './constants';
import { generateAvatar } from './utils/avatar';
import { ChatView } from './components/ChatView';
import { MessageModal } from './components/MessageModal';
import * as db from './services/dbService';
import type { Order } from './services/dbService'; // ADDED: Order type import
import { isSupabaseConfigured } from './services/supabase_client';
import { supabase } from './services/supabase_client';
import { CartPage } from './components/CartPage';
import { CartItem } from './types';
import { PinModal } from './components/PinModal';
import { changeUserPassword } from './services/dbService';
import { setUserPassword } from './services/dbService'; // add this line
import { signInWithEmail, signUpWithEmail, signOut, getSessionUser } from './services/dbService';

// ── Admin usernames – add yours here ──────────────────────────────────────────
const ADMIN_USERNAMES = ['admin', 'superadmin007gunfu', 'admin1', 'superadmin00700'];
// ──────────────────────────────────────────────────────────────────────────────
// At the top of App.tsx, add this helper (outside the component):
const isActiveBoosted = (user: User) =>
  user.isBoosted && (!user.boostedUntil || new Date(user.boostedUntil) > new Date());
const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // ADDED: orders state
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionCategoryPick = new Map<string, string>();

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [theme, setTheme] = useState<Theme>(db.getTheme);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const scrollPosition = useRef(0);

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'login' | 'register' }>({ isOpen: false, view: 'login' });
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [pinModal, setPinModal] = useState<{ isOpen: boolean; mode: 'enter' | 'setup' }>({ isOpen: false, mode: 'enter' });
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const [productsData, usersData, threadsData, ordersData] = await Promise.all([
        db.getProducts(), db.getUsers(), db.getThreads(), db.getOrders()
      ]);
      setProducts(productsData);
      setUsers(usersData);
      setThreads(threadsData);
      setOrders(ordersData);

      // Try Supabase Auth session first
      try {
        const sessionUser = await db.getSessionUser();
        if (sessionUser) {
          const withAdmin = { ...sessionUser, isAdmin: ADMIN_USERNAMES.includes(sessionUser.username) };
          setCurrentUser(withAdmin);
          const savedIds = await db.getSavedProductIds(sessionUser.id);
          setSavedProductIds(savedIds);
        } else {
          // Fall back to localStorage (old users)
          const localUser = db.getCurrentUser();
          if (localUser) {
            const freshUser = usersData.find(u => u.id === localUser.id);
            if (freshUser) {
              setCurrentUser({ ...freshUser, isAdmin: ADMIN_USERNAMES.includes(freshUser.username) });
              const savedIds = await db.getSavedProductIds(freshUser.id);
              setSavedProductIds(savedIds);
            }
          }
        }
      } catch (authErr) {
        console.warn('Auth session error, falling back to localStorage:', authErr);
        // Fall back to localStorage
        const localUser = db.getCurrentUser();
        if (localUser) {
          const freshUser = usersData.find(u => u.id === localUser.id);
          if (freshUser) {
            setCurrentUser({ ...freshUser, isAdmin: ADMIN_USERNAMES.includes(freshUser.username) });
            const savedIds = await db.getSavedProductIds(freshUser.id);
            setSavedProductIds(savedIds);
          }
        }
      }

    } catch (err) {
      console.error(err);
      showToast('Error loading data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, []);

  // --- HISTORY ---
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const s = e.state;
      if (!s) { setSelectedProduct(null); setActiveThreadId(null); setSelectedCategory(null); setSelectedShop(null); setActivePage('home'); return; }
      if (s.page) setActivePage(s.page);
      setSelectedProduct(s.view === 'product' && s.productId ? products.find(p => p.id === s.productId) ?? null : null);
      setActiveThreadId(s.view === 'thread' ? s.threadId ?? null : null);
      if (s.view === 'shop' && s.sellerId) { setSelectedShop(users.find(u => u.id === s.sellerId) ?? null); setSelectedCategory(s.category ?? null); }
      else if (s.view === 'category') { setSelectedCategory(s.category ?? null); setSelectedShop(null); }
      else if (!s.view || s.view === 'home') { setSelectedCategory(null); setSelectedShop(null); }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [products, users, threads]);

  useEffect(() => {
    if (currentUser) { db.saveCurrentUser(currentUser); db.getSavedProductIds(currentUser.id).then(setSavedProductIds); }
    else { db.clearCurrentUser(); setSavedProductIds(new Set()); }
  }, [currentUser]);

  useEffect(() => {
    db.saveTheme(theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else { document.documentElement.classList.remove('dark'); }
  }, [theme]);

  useEffect(() => {
    if (!selectedProduct && scrollPosition.current > 0) window.scrollTo(0, scrollPosition.current);
  }, [selectedProduct]);
// Realtime: new products
useEffect(() => {
  const channel = supabase
    .channel('products-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as any;
          const newProduct: Product = {
            id: p.id,
            title: p.title,
            price: p.price,
            category: p.category,
            images: (() => { try { const r = JSON.parse(p.image); return Array.isArray(r) ? r : [p.image]; } catch { return [p.image]; } })(),
            location: p.location,
            date: p.date,
            description: p.description,
            sellerId: p.seller_id,
          };
          setProducts(prev =>
            prev.some(x => x.id === newProduct.id) ? prev : [newProduct, ...prev]
          );
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as any;
          setProducts(prev =>
            prev.map(x =>
              x.id === p.id
                ? { ...x, title: p.title, price: p.price, category: p.category,
                    description: p.description,
                    images: (() => { try { const r = JSON.parse(p.image); return Array.isArray(r) ? r : [p.image]; } catch { return [p.image]; } })() }
                : x
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(x => x.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);

// Realtime: orders
useEffect(() => {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const o = payload.new as any;
          const newOrder: Order = {
            id: o.id,
            buyerId: o.buyer_id ?? null,
            sellerId: o.seller_id ?? null,
            productId: o.product_id ?? null,
            productTitle: o.product_title,
            amount: o.amount,
            currency: o.currency ?? 'NGN',
            status: o.status,
            korapayReference: o.korapay_reference ?? null,
            buyerEmail: o.buyer_email ?? null,
            buyerName: o.buyer_name ?? null,
            buyerPhone: o.buyer_phone ?? null,
            buyerAddress: o.buyer_address ?? null,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          };
          setOrders(prev =>
            prev.some(x => x.id === newOrder.id) ? prev : [newOrder, ...prev]
          );
        } else if (payload.eventType === 'UPDATE') {
          const o = payload.new as any;
          setOrders(prev =>
            prev.map(x =>
              x.id === o.id
                ? { ...x, status: o.status, updatedAt: o.updated_at }
                : x
            )
          );
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
  const showToast = (msg: string) => setToast({ message: msg, id: Date.now() });

  // --- AUTH ---
 const handleLogin = async (data: AuthData) => {
  // Try Supabase Auth first (email login)
  if (data.username.includes('@')) {
    const result = await db.signInWithEmail(data.username, data.password ?? '');
    if (!result) { showToast('Invalid email or password.'); return; }

    const withAdmin = { ...result, isAdmin: ADMIN_USERNAMES.includes(result.username) };
    if (withAdmin.pin && withAdmin.isApprovedSeller) {
      setCurrentUser(withAdmin);
      setPinUnlocked(false);
      setPinModal({ isOpen: true, mode: 'enter' });
    } else {
      setCurrentUser(withAdmin);
      setPinUnlocked(true);
      showToast(`Welcome back, ${result.name}!`);
    }
    setAuthModal({ isOpen: false, view: 'login' });
    return;
  }

  // Fall back to username login (for existing/admin accounts)
  const user = users.find(u => u.username === data.username);
  if (!user) { showToast('Username not found.'); return; }

  // Verify password if set
  if (data.password) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('password')
      .eq('id', user.id)
      .single();

    if (dbUser?.password && dbUser.password !== data.password) {
      showToast('Incorrect password.');
      return;
    }
  }

  const withAdmin = { ...user, isAdmin: ADMIN_USERNAMES.includes(user.username) };
  if (withAdmin.pin && withAdmin.isApprovedSeller) {
    setCurrentUser(withAdmin);
    setPinUnlocked(false);
    setPinModal({ isOpen: true, mode: 'enter' });
  } else {
    setCurrentUser(withAdmin);
    setPinUnlocked(true);
    showToast(`Welcome back, ${user.name}!`);
  }
  setAuthModal({ isOpen: false, view: 'login' });
};
  const handlePinSuccess = async (enteredPin: string) => {
  if (!currentUser) return;
  if (pinModal.mode === 'enter') {
    if (enteredPin === currentUser.pin) {
      setPinUnlocked(true);
      setPinModal({ isOpen: false, mode: 'enter' });
      showToast(`Welcome back, ${currentUser.name}!`);
    } else {
      // Return a signal to the modal to show error — simplest: use a ref or re-open with error
      showToast('Wrong PIN. Try again.');
      setPinModal({ isOpen: false, mode: 'enter' });
      setTimeout(() => setPinModal({ isOpen: true, mode: 'enter' }), 50);
    }
  } else if (pinModal.mode === 'setup') {
    const ok = await db.setUserPin(currentUser.id, enteredPin);
    if (ok) {
      setCurrentUser(prev => prev ? { ...prev, pin: enteredPin } : prev);
      setPinUnlocked(true);
      setPinModal({ isOpen: false, mode: 'setup' });
      showToast('PIN set successfully!');
    }
  }
};

const handleForgotPin = async (username: string, newPin: string): Promise<boolean> => {
  const result = await db.getUserPinByUsername(username);
  if (!result) return false;
  const ok = await db.setUserPin(result.id, newPin);
  if (ok && currentUser && result.id === currentUser.id) {
    setCurrentUser(prev => prev ? { ...prev, pin: newPin } : prev);
    setPinUnlocked(true);
  }
  return ok;
};

const handleRegister = async (data: AuthData) => {
  if (!data.name || !data.username) { showToast('Please fill all fields.'); return; }
  if (users.some(u => u.username === data.username)) { showToast('Username already taken.'); return; }

  const result = await signUpWithEmail(
    data.username, // username is actually email in your AuthModal
    data.password ?? '',
    data.name,
    data.username.split('@')[0], // derive username from email
    data.profilePicture
  );

  if (result) {
    const withAdmin = { ...result, isAdmin: ADMIN_USERNAMES.includes(result.username) };
    setUsers(prev => [withAdmin, ...prev]);
    setCurrentUser(withAdmin);
    setAuthModal({ isOpen: false, view: 'login' });
    showToast(`Welcome, ${result.name}! Check your email to confirm your account.`);
  } else {
    showToast('Error creating account. Email may already be in use.');
  }
};

  const handleLogout = async () => {
  await signOut();
  setCurrentUser(null);
  window.history.pushState({ page: 'home' }, '', '#home');
  setActivePage('home');
  setSelectedProduct(null);
  setSelectedCategory(null);
  setSelectedShop(null);
  showToast('You have been logged out.');
};

// Add session restore in the initial useEffect
useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const [productsData, usersData, threadsData, ordersData] = await Promise.all([
        db.getProducts(), db.getUsers(), db.getThreads(), db.getOrders()
      ]);
      setProducts(productsData);
      setUsers(usersData);
      setThreads(threadsData);
      setOrders(ordersData);

      // Restore session from Supabase Auth
      const sessionUser = await db.getSessionUser();
      if (sessionUser) {
        const withAdmin = { ...sessionUser, isAdmin: ADMIN_USERNAMES.includes(sessionUser.username) };
        setCurrentUser(withAdmin);
        const savedIds = await db.getSavedProductIds(sessionUser.id);
        setSavedProductIds(savedIds);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, []);

  const handleUpdateProfilePicture = async (url: string) => {
    if (!currentUser) return;
    const ok = await db.updateUser(currentUser.id, { profilePicture: url });
    if (ok) {
      const u = { ...currentUser, profilePicture: url };
      setCurrentUser(u); setUsers(prev => prev.map(x => x.id === currentUser.id ? u : x));
      showToast('Profile picture updated!');
    } else showToast('Error updating picture.');
  };

  const handleUpdateProfile = async (name: string, username: string, phone: string, bio: string) => {
    if (!currentUser) return;
    if (username !== currentUser.username && users.some(u => u.username === username && u.id !== currentUser.id)) { showToast('Username already taken.'); return; }
    const ok = await db.updateUser(currentUser.id, { name, username, phone: phone || undefined, bio: bio || undefined });
    if (ok) {
      const u = { ...currentUser, name, username, phone: phone || undefined, bio: bio || undefined };
      setCurrentUser(u); setUsers(users.map(x => x.id === currentUser.id ? u : x));
      showToast('Profile updated!');
    } else showToast('Error updating profile.');
  };
const handleSaveBuyerDetails = async (email: string, address: string, phone: string, name: string) => {
  if (!currentUser) return;
  const updates = { email, address, phone, name };
  const ok = await db.updateUser(currentUser.id, updates);
  if (ok) {
    const updated = { ...currentUser, email, address, phone, name };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    // localStorage auto-updates via the useEffect watching currentUser
  }
};
  // --- PRODUCTS ---
  const handleAddProduct = async (data: Omit<Product, 'id' | 'sellerId' | 'location' | 'date'>) => {
    if (!currentUser) { setAuthModal({ isOpen: true, view: 'login' }); showToast('Please log in to post.'); return; }
    const p = await db.createProduct({ ...data, sellerId: currentUser.id, location: 'Kano', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    if (p) { setProducts(prev => [p, ...prev]); showToast('Ad posted successfully!'); }
    else showToast('Error posting ad.');
  };

  const handleUpdateProduct = async (updated: Product) => {
    const ok = await db.updateProduct(updated.id, updated);
    if (ok) { setProducts(products.map(p => p.id === updated.id ? updated : p)); showToast('Ad updated.'); setProductToEdit(null); }
    else showToast('Error updating ad.');
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Delete this listing?')) {
      const ok = await db.deleteProduct(id);
      if (ok) { setProducts(products.filter(p => p.id !== id)); showToast('Listing deleted.'); }
      else showToast('Error deleting listing.');
    }
  };

  // Admin delete (no confirm dialog — admin dashboard has its own)
  const handleAdminDeleteProduct = async (id: string) => {
    const ok = await db.deleteProduct(id);
    if (ok) { setProducts(products.filter(p => p.id !== id)); showToast('Product deleted.'); }
    else showToast('Error deleting product.');
  };
const handleAdminEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsAddProductModalOpen(true);
  };
  const handleAdminDeleteUser = async (id: string) => {
    const userProds = products.filter(p => p.sellerId === id);
    await Promise.all(userProds.map(p => db.deleteProduct(p.id)));
    await db.deleteUser(id);
    setProducts(products.filter(p => p.sellerId !== id));
    setUsers(users.filter(u => u.id !== id));
    showToast('User removed.');
  };

  const handleAdminUpdateUser = async (userId: string, updates: Partial<User>) => {
    const ok = await db.updateUser(userId, updates);
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
      }
      if (updates.isVerified !== undefined) showToast(updates.isVerified ? 'Verified badge granted.' : 'Verified badge removed.');
      else if (updates.isBoosted !== undefined) showToast(updates.isBoosted ? 'User boosted!' : 'Boost removed.');
    } else {
      showToast('Error updating user.');
    }
  };

  // ADDED: Order status update handler
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const ok = await db.updateOrderStatus(orderId, status);
    if (ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
      showToast(`Order marked as ${status}.`);
    } else {
      showToast('Error updating order status.');
    }
  };

  // --- SAVE / TOGGLE ---
  const handleToggleSave = async (productId: string) => {
    if (!currentUser) { setAuthModal({ isOpen: true, view: 'login' }); showToast('Log in to save items.'); return; }
    const isSaved = savedProductIds.has(productId);
    if (isSaved) {
      const ok = await db.unsaveProduct(currentUser.id, productId);
      if (ok) { const s = new Set(savedProductIds); s.delete(productId); setSavedProductIds(s); showToast('Removed from saved.'); }
    } else {
      const ok = await db.saveProduct(currentUser.id, productId);
      if (ok) { const s = new Set(savedProductIds); s.add(productId); setSavedProductIds(s); showToast('Saved!'); }
    }
  };

  // --- NAVIGATION ---
  const handlePostAdClick = () => {
  if (!currentUser) { setAuthModal({ isOpen: true, view: 'login' }); return; }
  if (!currentUser.isApprovedSeller && !currentUser.isAdmin) {
    showToast('Seller access required. Contact admin to get approved.');
    return;
  }
  setProductToEdit(null); setIsAddProductModalOpen(true);
};

  const handleSelectCategory = (category: string) => {
    scrollPosition.current = window.scrollY;
    window.history.pushState({ view: 'category', category, page: 'home' }, '', `#category=${encodeURIComponent(category)}`);
    setSelectedCategory(category); setSelectedShop(null); setSelectedProduct(null);
  };
  // 2. Add handler function (inside the App component, near other handlers):
const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  if (!currentUser) return false;
  const ok = await db.changeUserPassword(currentUser.id, currentPassword, newPassword);
  if (ok) showToast('Password updated successfully!');
  else showToast('Current password is incorrect.');
  return ok;
};

  const handleSelectShop = (seller: User) => {
    if (!selectedCategory) return;
    window.history.pushState({ view: 'shop', sellerId: seller.id, category: selectedCategory, page: 'home' }, '', `#shop=${seller.id}`);
    setSelectedShop(seller);
  };

  const handleSelectProduct = (product: Product) => {
    scrollPosition.current = window.scrollY;
    window.history.pushState({ view: 'product', productId: product.id, page: activePage }, '', `#product=${product.id}`);
    setSelectedProduct(product);
  };

  const handleMessageSeller = (product: Product) => {
    if (!currentUser) { setAuthModal({ isOpen: true, view: 'login' }); return; }
    if (currentUser.id === product.sellerId) { showToast("You can't message yourself."); return; }
    setMessageModal({ isOpen: true, product });
  };

  const handleAddToCart = (product: Product) => {
  if (!currentUser) { setAuthModal({ isOpen: true, view: 'login' }); return; }
  if (!CART_CATEGORIES.has(product.category)) {
    showToast('This item cannot be added to cart.');
    return;
  }
  setCartItems(prev => {
    const existing = prev.find(i => i.product.id === product.id);
    if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { product, quantity: 1 }];
  });
  showToast('Added to cart!');
};

const handleUpdateCartQuantity = (productId: string, quantity: number) => {
  if (quantity <= 0) { handleRemoveFromCart(productId); return; }
  setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
};

const handleRemoveFromCart = (productId: string) => {
  setCartItems(prev => prev.filter(i => i.product.id !== productId));
  showToast('Removed from cart.');
};

const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const handleSendMessage = async (text: string) => {
    if (!currentUser || !messageModal.product) return;
    const { product } = messageModal;
    const participants: [string, string] = [currentUser.id, product.sellerId].sort() as [string, string];
    const threadId = `${product.id}-${participants[0]}-${participants[1]}`;
    const msg: Message = { id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now() };
    const existing = threads.find(t => t.id === threadId);
    if (existing) {
      const created = await db.createMessage(msg, threadId);
      if (created) setThreads(threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, created], lastMessageTimestamp: created.timestamp } : t));
    } else {
      const thread = await db.createThread({ id: threadId, productId: product.id, productTitle: product.title, participants, lastMessageTimestamp: msg.timestamp });
      if (thread) { const created = await db.createMessage(msg, threadId); if (created) setThreads(prev => [...prev, { ...thread, messages: [created] }]); }
    }
    setMessageModal({ isOpen: false, product: null });
    showToast('Message sent!');
    window.history.pushState({ page: 'messages' }, '', '#messages'); setActivePage('messages');
    window.history.pushState({ view: 'thread', threadId, page: 'messages' }, '', `#thread=${threadId}`); setActiveThreadId(threadId);
  };

  const handleSendMessageInChat = async (text: string, threadId: string) => {
    if (!currentUser) return;
    const msg: Message = { id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now() };
    const created = await db.createMessage(msg, threadId);
    if (created) setThreads(threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, created], lastMessageTimestamp: created.timestamp } : t));
  };

  const handleThreadSelect = (threadId: string) => {
    window.history.pushState({ view: 'thread', threadId, page: activePage }, '', `#thread=${threadId}`);
    setActiveThreadId(threadId);
  };

  const handlePageChange = (page: Page) => {
    if (activePage === page && !selectedProduct && !activeThreadId && !selectedCategory) return;
    window.history.pushState({ page }, '', `#${page}`);
    setSelectedProduct(null); setActiveThreadId(null); setSelectedCategory(null); setSelectedShop(null); setActivePage(page);
  };

  const handleBack = () => window.history.back();

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q && (selectedCategory || selectedShop || selectedProduct)) {
      setSelectedCategory(null); setSelectedShop(null); setSelectedProduct(null); setActivePage('home');
    }
  };

  // --- COMPUTED ---
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Sellers whose name, username, or bio matches the search query
  const filteredSellers = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    // Only include sellers who have at least one product
    const sellerIds = new Set(products.map(p => p.sellerId));
    return users.filter(u =>
      sellerIds.has(u.id) && (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.bio ?? '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, users, products]);

  const savedProducts = useMemo(() => products.filter(p => savedProductIds.has(p.id)), [products, savedProductIds]);
  const userProducts = useMemo(() => currentUser ? products.filter(p => p.sellerId === currentUser.id) : [], [products, currentUser]);
  const activeThread = threads.find(t => t.id === activeThreadId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 animate-pulse shadow-lg shadow-orange-200 dark:shadow-orange-900/40" />
          <p className="text-sm text-gray-400 font-medium">Loading marketplace…</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Product detail
    if (selectedProduct) {
      const seller = users.find(u => u.id === selectedProduct.sellerId);
      return (
        <ProductDetailPage
          product={selectedProduct}
          seller={seller ?? null}
          currentUser={currentUser}
          onClose={handleBack}
          onMessageSeller={handleMessageSeller}
          onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
          isSaved={savedProductIds.has(selectedProduct.id)}
          onToggleSave={() => handleToggleSave(selectedProduct.id)}
          onPaymentSuccess={(reference) => {
            showToast('🎉 Payment successful! Order placed.');
          }}
          onAddToCart={handleAddToCart}
cartItemCount={cartItems.find(i => i.product.id === selectedProduct.id)?.quantity ?? 0}
          onSaveBuyerDetails={handleSaveBuyerDetails}
        />
      );
    }

    // Chat
    if (activeThread) {
      const otherId = activeThread.participants.find(p => p !== currentUser?.id);
      const participant = users.find(u => u.id === otherId);
      if (!currentUser || !participant) return null;
      return <ChatView
  thread={activeThread}
  currentUser={currentUser}
  participant={participant}
  onClose={handleBack}
  onSendMessage={text => handleSendMessageInChat(text, activeThread.id)}
  onNewMessage={(msg) => {
    setThreads(prev =>
      prev.map(t =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, msg], lastMessageTimestamp: msg.timestamp }
          : t
      )
    );
  }}
/>;
    }

    switch (activePage) {
      case 'admin':
        return currentUser?.isAdmin
          ? <AdminDashboard 
              products={products} 
              users={users} 
              orders={orders}
              currentUser={currentUser} 
              onDeleteProduct={handleAdminDeleteProduct}
              onEditProduct={handleAdminEditProduct}
              onDeleteUser={handleAdminDeleteUser} 
              onUpdateUser={handleAdminUpdateUser} 
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onBack={handleBack} 
            />
          : <AuthPrompt page="home" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

      case 'saved':
        return currentUser
          ? <SavedPage products={savedProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} />
          : <AuthPrompt page="saved" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

      case 'messages':
        return currentUser
          ? <MessagesPage threads={threads} currentUser={currentUser} users={users} onSelectThread={handleThreadSelect} />
          : <AuthPrompt page="messages" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;
case 'cart':
  return currentUser
    ? <CartPage
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={(product) => { handleSelectProduct(product); }}
        onSelectProduct={handleSelectProduct}
        currentUser={currentUser}
        onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
        users={users}
        onCartCheckoutSuccess={() => setCartItems([])}
      />
    : <AuthPrompt page="cart" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;
     case 'profile':
  return currentUser
    ? (
      <ProfilePage
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateProfilePicture={handleUpdateProfilePicture}
        setActivePage={handlePageChange}
        userProducts={userProducts}
        onMessageSeller={handleMessageSeller}
        savedProductIds={savedProductIds}
        onToggleSave={handleToggleSave}
        onSelectProduct={handleSelectProduct}
        onEditProduct={p => {
          setProductToEdit(p);
          setIsAddProductModalOpen(true);
        }}
        onDeleteProduct={handleDeleteProduct}
        theme={theme}
        setTheme={setTheme}
        onSetPin={() => {
  if (!currentUser?.isApprovedSeller && !currentUser?.isAdmin) {
    showToast('PIN is only available for approved sellers.');
    return;
  }
  setPinModal({ isOpen: true, mode: 'setup' });
}}  // ✅ added here
        onChangePassword={handleChangePassword}   // ← ADD THIS LINE
      />
    )
    : (
      <AuthPrompt
        page="profile"
        onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
      />
    );
      case 'edit-profile':
        return currentUser
          ? <EditProfilePage currentUser={currentUser} onSaveChanges={handleUpdateProfile} onClose={handleBack} />
          : <AuthPrompt page="edit-profile" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

      case 'home':
      default:
        // Search results
        if (searchQuery) {
          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="pt-6 pb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {filteredProducts.length + filteredSellers.length} results
                  </span>{' '}
                  for "{searchQuery}"
                </p>
              </div>

              {/* Matching Shops */}
              {filteredSellers.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                    </svg>
                    Shops
                    <span className="text-xs font-normal text-gray-400">({filteredSellers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSellers.map(seller => {
                      const sellerProducts = products.filter(p => p.sellerId === seller.id);
                      const thumbnail = sellerProducts[0]?.images?.[0] ?? '';
                      const boosted = isActiveBoosted(seller);
                      return (
                        <button
                          key={seller.id}
                          onClick={() => {
                            // Navigate to the seller's first category, or show all products
                            const firstCategory = sellerProducts[0]?.category ?? null;
                            if (firstCategory) {
                              setSearchQuery('');
                              setSelectedCategory(firstCategory);
                              setSelectedShop(seller);
                              window.history.pushState({ view: 'shop', sellerId: seller.id, category: firstCategory, page: 'home' }, '', `#shop=${seller.id}`);
                            }
                          }}
                          className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800/60 overflow-hidden hover:shadow-xl hover:shadow-orange-50 dark:hover:shadow-orange-900/10 transition-all duration-300 hover:-translate-y-0.5 text-left"
                        >
                          {/* Banner / thumbnail */}
                          <div className="relative h-24 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                            {thumbnail
                              ? <img src={thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" />
                              : <div className="flex items-center justify-center h-full text-3xl opacity-20">🏪</div>
                            }
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute bottom-2 right-2">
                              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {sellerProducts.length} listing{sellerProducts.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {boosted && (
                              <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
                                </svg>
                                TOP
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-3.5 flex items-center gap-3">
                            <img src={seller.profilePicture} alt={seller.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 shadow-sm flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{seller.name}</p>
                                {seller.isVerified && (
                                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">@{seller.username}</p>
                              {seller.bio && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{seller.bio}</p>
                              )}
                            </div>
                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Products */}
              {filteredProducts.length > 0 && (
                <>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                    </svg>
                    Products
                    <span className="text-xs font-normal text-gray-400">({filteredProducts.length})</span>
                  </h3>
                  <ProductGrid
                    products={[...filteredProducts].sort((a, b) => {
                      const aB = isActiveBoosted(users.find(u => u.id === a.sellerId) as any) ? 1 : 0;
                      const bB = isActiveBoosted(users.find(u => u.id === b.sellerId) as any) ? 1 : 0;
                      return bB - aB;
                    })}
                    onMessageSeller={handleMessageSeller}
                    savedProductIds={savedProductIds}
                    onToggleSave={handleToggleSave}
                    onSelectProduct={handleSelectProduct}
                  />
                </>
              )}

              {/* Nothing found */}
              {filteredProducts.length === 0 && filteredSellers.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mt-4">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">No results found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try a different search term.</p>
                </div>
              )}
            </div>
          );
        }

        if (selectedShop && selectedCategory) {
          return <ShopProductsPage seller={selectedShop} category={selectedCategory} products={products} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} onMessageSeller={handleMessageSeller} onBack={handleBack} />;
        }

        if (selectedCategory) {
          return <ShopListPage category={selectedCategory} products={products} users={users} onSelectShop={handleSelectShop} onBack={handleBack} />;
        }

        return (
  <>
    <CategoryFilter categories={CATEGORIES} selectedCategory={null} setSelectedCategory={handleSelectCategory} />

    {/* Hero strip */}
    <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Find great deals in Kano</h2>
          <p className="text-orange-100 mt-1 text-sm">{products.length.toLocaleString()} active listings from sellers</p>
        </div>
        <button
          onClick={handlePostAdClick}
          className="flex-shrink-0 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-orange-50 transition-all"
        >
          + Post Free Ad
        </button>
      </div>
    </div>

   {(() => {
  const boostedUsers = users.filter(isActiveBoosted);
  if (boostedUsers.length === 0) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
          </svg>
          Featured
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Featured Stores</h3>
      </div>

      <div className="space-y-6 mb-8">
        {boostedUsers.map(seller => {
          // Pick a random category for this seller (stable per session)
const sellerAllProducts = products.filter(p => p.sellerId === seller.id);
const sellerCategories = [...new Set(sellerAllProducts.map(p => p.category))];

if (!sessionCategoryPick.has(seller.id) || !sellerCategories.includes(sessionCategoryPick.get(seller.id)!)) {
  const randomCat = sellerCategories[Math.floor(Math.random() * sellerCategories.length)];
  sessionCategoryPick.set(seller.id, randomCat);
}

const pickedCategory = sessionCategoryPick.get(seller.id)!;
const sellerProducts = sellerAllProducts.filter(p => p.category === pickedCategory).slice(0, 4);
          if (sellerProducts.length === 0) return null;
          return (
            <div key={seller.id} className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 overflow-hidden">
              {/* Store Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={seller.profilePicture}
                      alt={seller.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-300 dark:ring-amber-700"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{seller.name}</p>
                      {seller.isVerified && (
                        <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
  @{seller.username} · 
  <span className="text-orange-500 font-semibold ml-1">{pickedCategory}</span>
</p>
                    {seller.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{seller.bio}</p>}
                  </div>
                </div>
                <button
                  onClick={() => {
  setSelectedCategory(pickedCategory);
  setSelectedShop(seller);
  window.history.pushState(
    { view: 'shop', sellerId: seller.id, category: pickedCategory, page: 'home' },
    '',
    `#shop=${seller.id}`
  );
}}
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  View Store
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Store Products - horizontal scroll on mobile */}
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sellerProducts.map(product => {
                    const isSaved = savedProductIds.has(product.id);
                    return (
                      <div key={product.id} className="group relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-200">
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className="relative block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 w-full"
                        >
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                              </svg>
                            </div>
                          )}
                          {/* Save button */}
                          <button
                            onClick={e => { e.stopPropagation(); handleToggleSave(product.id); }}
                            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow transition-all ${isSaved ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-400 hover:text-orange-500'}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                          </button>
                        </button>
                        <button onClick={() => handleSelectProduct(product)} className="block p-2 text-left w-full">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 leading-snug">{product.title}</p>
                          <p className="text-sm font-bold text-orange-500 mt-0.5">₦{product.price.toLocaleString()}</p>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 mb-6" />
    </div>
  );
})()}

  </>
);
    }
  };

  // Hide header/footer/nav on admin page
  const isAdmin = activePage === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {!isAdmin && (
        <Header
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          onPostAdClick={handlePostAdClick}
          activePage={activePage}
          setActivePage={handlePageChange}
          currentUser={currentUser}
          cartCount={cartCount}
          onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
        />
      )}
      <main className={`flex-grow ${!isAdmin ? 'pb-16 md:pb-0' : ''}`}>
        {renderPage()}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && (
        <BottomNav onPostAdClick={handlePostAdClick} activePage={activePage} setActivePage={handlePageChange} cartCount={cartCount} />
      )}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => { setIsAddProductModalOpen(false); setProductToEdit(null); }}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        productToEdit={productToEdit}
      />
      <PinModal
  isOpen={pinModal.isOpen}
  mode={pinModal.mode}
  username={currentUser?.username}
  onSuccess={handlePinSuccess}
  onClose={pinModal.mode === 'setup' ? () => setPinModal({ isOpen: false, mode: 'setup' }) : undefined}
  onForgotPin={handleForgotPin}
/>
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, view: 'login' })}
        onLogin={handleLogin}
        onRegister={handleRegister}
        initialView={authModal.view}
      />
      {messageModal.isOpen && messageModal.product && (
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={() => setMessageModal({ isOpen: false, product: null })}
          product={messageModal.product}
          onSendMessage={handleSendMessage}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
};

export default App;

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

// ── Admin usernames – add yours here ──────────────────────────────────────────
const ADMIN_USERNAMES = ['admin', 'superadmin'];
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
      if (currentUser) {
        const savedIds = await db.getSavedProductIds(currentUser.id);
        setSavedProductIds(savedIds);
        // ✅ Sync currentUser with fresh DB data (picks up isApprovedSeller etc.)
        const freshUser = usersData.find(u => u.id === currentUser.id);
        if (freshUser) {
          setCurrentUser({ 
            ...freshUser, 
            isAdmin: ADMIN_USERNAMES.includes(freshUser.username) 
          });
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
    const user = users.find(u => u.username === data.username);
    if (user) {
      const withAdmin = { ...user, isAdmin: ADMIN_USERNAMES.includes(user.username) };
      setCurrentUser(withAdmin);
      setAuthModal({ isOpen: false, view: 'login' });
      showToast(`Welcome back, ${user.name}!`);
    } else {
      showToast('User not found. Try registering.');
    }
  };

  const handleRegister = async (data: AuthData) => {
    if (!isSupabaseConfigured) { showToast('Supabase is not configured.'); return; }
    if (users.some(u => u.username === data.username)) { showToast('Username already taken.'); return; }
    const newUser = await db.createUser({ name: data.name!, username: data.username!, profilePicture: data.profilePicture || generateAvatar(data.name!) });
    if (newUser) {
      const withAdmin = { ...newUser, isAdmin: ADMIN_USERNAMES.includes(newUser.username) };
      setUsers(prev => [withAdmin, ...prev]);
      setCurrentUser(withAdmin);
      setAuthModal({ isOpen: false, view: 'login' });
      showToast(`Welcome, ${newUser.name}!`);
    } else { showToast('Error creating account.'); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.history.pushState({ page: 'home' }, '', '#home');
    setActivePage('home'); setSelectedProduct(null); setSelectedCategory(null); setSelectedShop(null);
    showToast('You have been logged out.');
  };

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

  const handleAdminDeleteUser = async (id: string) => {
    // Delete all their products from DB first
    const userProds = products.filter(p => p.sellerId === id);
    await Promise.all(userProds.map(p => db.deleteProduct(p.id)));
    // Delete the user from DB
    await db.deleteUser(id);
    // Update local state
    setProducts(products.filter(p => p.sellerId !== id));
    setUsers(users.filter(u => u.id !== id));
    showToast('User removed.');
  };

  const handleAdminEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsAddProductModalOpen(true);
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
              orders={orders}  // ADDED: orders prop
              currentUser={currentUser} 
              onDeleteProduct={handleAdminDeleteProduct}
              onEditProduct={handleAdminEditProduct} // <-- ADDED THIS
              onDeleteUser={handleAdminDeleteUser} 
              onUpdateUser={handleAdminUpdateUser} 
              onUpdateOrderStatus={handleUpdateOrderStatus}  // ADDED: order status handler
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
        onCheckout={(product) => { handleSelectProduct(product); /* payment modal opens there */ }}
        onSelectProduct={handleSelectProduct}
        currentUser={currentUser}
        onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
      />
    : <AuthPrompt page="cart" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;
      case 'profile':
        return currentUser
          ? <ProfilePage currentUser={currentUser} onLogout={handleLogout} onUpdateProfilePicture={handleUpdateProfilePicture} setActivePage={handlePageChange} userProducts={userProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} onEditProduct={p => { setProductToEdit(p); setIsAddProductModalOpen(true); }} onDeleteProduct={handleDeleteProduct} theme={theme} setTheme={setTheme} />
          : <AuthPrompt page="profile" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

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
                              // Navigate to the seller's first category, or show all products
                            const firstCategory = sellerProducts[0]?.category ?? null;
                            if (firstCategory) {
                              setSearchQuery('');
                              setSelectedCategory(firstCategory);
                              window.history.pushState({ view: 'shop', sellerId: seller.id, category: firstCategory, page: 'home' }, '', `#shop=${seller.id}`);
                              setSelectedShop(seller);
                            }
                          }}
                          className="flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800 text-left"
                        >
                          <div className="h-24 bg-gray-100 dark:bg-gray-800 relative">
                            {thumbnail && (
                              <img src={thumbnail} alt="" className="w-full h-full object-cover opacity-50" />
                            )}
                            <div className="absolute -bottom-6 left-4">
                              <img
                                src={seller.profilePicture || generateAvatar(seller.name)}
                                alt={seller.name}
                                className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-900 object-cover bg-white"
                              />
                            </div>
                          </div>
                          <div className="pt-8 pb-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 dark:text-white truncate">{seller.name}</span>
                              {seller.isVerified && (
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                </svg>
                              )}
                              {boosted && (
                                <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{seller.username}</p>
                            <p className="text-xs text-gray-400 mt-2">{sellerProducts.length} items</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Products */}
              {filteredProducts.length > 0 ? (
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    Items
                    <span className="text-xs font-normal text-gray-400">({filteredProducts.length})</span>
                  </h3>
                  <ProductGrid
                    products={filteredProducts}
                    users={users}
                    onProductClick={handleSelectProduct}
                    savedProductIds={savedProductIds}
                    onToggleSave={handleToggleSave}
                  />
                </div>
              ) : (
                filteredSellers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                  </div>
                )
              )}
            </div>
          );
        }

        // Shop view
        if (selectedShop && selectedCategory) {
          const shopProducts = products.filter(p => p.sellerId === selectedShop.id && p.category === selectedCategory);
          return (
            <ShopProductsPage
              shop={selectedShop}
              category={selectedCategory}
              products={shopProducts}
              onBack={() => { setSelectedShop(null); setSelectedCategory(null); }}
              onProductClick={handleSelectProduct}
              savedProductIds={savedProductIds}
              onToggleSave={handleToggleSave}
            />
          );
        }

        // Category view
        if (selectedCategory) {
          return (
            <ShopListPage
              category={selectedCategory}
              products={products}
              users={users}
              onBack={() => setSelectedCategory(null)}
              onSelectShop={handleSelectShop}
            />
          );
        }

        // Default home view
        return (
          <>
            <CategoryFilter
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Featured Deals</h2>
              </div>
              <ProductGrid
                products={products}
                users={users}
                onProductClick={handleSelectProduct}
                savedProductIds={savedProductIds}
                onToggleSave={handleToggleSave}
              />
            </main>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
      {!activeThread && !selectedProduct && (
        <Header
          onPostAdClick={handlePostAdClick}
          onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
          currentUser={currentUser}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          theme={theme}
          setTheme={setTheme}
          cartItemCount={cartCount}
          onCartClick={() => handlePageChange('cart')}
          setActivePage={handlePageChange}
        />
      )}

      <div className="flex-1 pb-20 md:pb-0">
        {renderPage()}
      </div>

      {!activeThread && !selectedProduct && <Footer />}

      {!activeThread && !selectedProduct && (
        <BottomNav
          activePage={activePage}
          onPageChange={handlePageChange}
          unreadCount={threads.reduce((sum, t) => sum + (t.messages.filter(m => m.senderId !== currentUser?.id && !m.read).length > 0 ? 1 : 0), 0)}
          currentUser={currentUser}
        />
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => { setIsAddProductModalOpen(false); setProductToEdit(null); }}
        onSubmit={productToEdit ? handleUpdateProduct : handleAddProduct}
        productToEdit={productToEdit}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        view={authModal.view}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onSwitchView={(view) => setAuthModal({ ...authModal, view })}
      />

      {messageModal.isOpen && messageModal.product && (
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={() => setMessageModal({ isOpen: false, product: null })}
          product={messageModal.product}
          onSend={handleSendMessage}
        />
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;

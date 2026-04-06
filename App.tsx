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
import { CATEGORIES } from './constants';
import { generateAvatar } from './utils/avatar';
import { ChatView } from './components/ChatView';
import { MessageModal } from './components/MessageModal';
import * as db from './services/dbService';
import { isSupabaseConfigured } from './services/supabase_client';

// ── Admin usernames – add yours here ──────────────────────────────────────────
const ADMIN_USERNAMES = ['admin', 'superadmin'];
// ──────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
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
        const [productsData, usersData, threadsData] = await Promise.all([
          db.getProducts(), db.getUsers(), db.getThreads()
        ]);
        setProducts(productsData);
        setUsers(usersData);
        setThreads(threadsData);
        if (currentUser) {
          const savedIds = await db.getSavedProductIds(currentUser.id);
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
    const userProds = products.filter(p => p.sellerId === id);
    await Promise.all(userProds.map(p => db.deleteProduct(p.id)));
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
      return <ProductDetailPage product={selectedProduct} seller={seller ?? null} onClose={handleBack} onMessageSeller={handleMessageSeller} isSaved={savedProductIds.has(selectedProduct.id)} onToggleSave={() => handleToggleSave(selectedProduct.id)} />;
    }

    // Chat
    if (activeThread) {
      const otherId = activeThread.participants.find(p => p !== currentUser?.id);
      const participant = users.find(u => u.id === otherId);
      if (!currentUser || !participant) return null;
      return <ChatView thread={activeThread} currentUser={currentUser} participant={participant} onClose={handleBack} onSendMessage={text => handleSendMessageInChat(text, activeThread.id)} />;
    }

    switch (activePage) {
      case 'admin':
        return currentUser?.isAdmin
          ? <AdminDashboard products={products} users={users} currentUser={currentUser} onDeleteProduct={handleAdminDeleteProduct} onDeleteUser={handleAdminDeleteUser} onUpdateUser={handleAdminUpdateUser} onBack={handleBack} />
          : <AuthPrompt page="home" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

      case 'saved':
        return currentUser
          ? <SavedPage products={savedProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} />
          : <AuthPrompt page="saved" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

      case 'messages':
        return currentUser
          ? <MessagesPage threads={threads} currentUser={currentUser} users={users} onSelectThread={handleThreadSelect} />
          : <AuthPrompt page="messages" onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })} />;

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
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredProducts.length} results</span> for "{searchQuery}"
                </p>
              </div>
              <ProductGrid products={filteredProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} />
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
                  <p className="text-orange-100 mt-1 text-sm">{products.length.toLocaleString()} active listings from local sellers</p>
                </div>
                <button
                  onClick={handlePostAdClick}
                  className="flex-shrink-0 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-orange-50 transition-all"
                >
                  + Post Free Ad
                </button>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Latest Listings</h3>
            </div>
            <ProductGrid products={products} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} />
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
          onLoginClick={() => setAuthModal({ isOpen: true, view: 'login' })}
        />
      )}
      <main className={`flex-grow ${!isAdmin ? 'pb-16 md:pb-0' : ''}`}>
        {renderPage()}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && (
        <BottomNav onPostAdClick={handlePostAdClick} activePage={activePage} setActivePage={handlePageChange} />
      )}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => { setIsAddProductModalOpen(false); setProductToEdit(null); }}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        productToEdit={productToEdit}
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

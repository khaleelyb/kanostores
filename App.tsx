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
import { Toast } from './components/Toast';
import { Product, User, Theme, Message, MessageThread, Page } from './types';
import { CATEGORIES } from './constants';
import { generateAvatar } from './utils/avatar';
import { ChatView } from './components/ChatView';
import { MessageModal } from './components/MessageModal';
import * as db from './services/dbService';
import { isSupabaseConfigured } from './services/supabase_client';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [theme, setTheme] = useState<Theme>(db.getTheme);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Scroll Restoration
  const scrollPosition = useRef(0);

  // Modal State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [authModal, setAuthModal] = useState<{isOpen: boolean, view: 'login' | 'register'}>({isOpen: false, view: 'login'});
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean, product: Product | null }>({ isOpen: false, product: null });

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [productsData, usersData, threadsData] = await Promise.all([
          db.getProducts(),
          db.getUsers(),
          db.getThreads()
        ]);
        
        setProducts(productsData);
        setUsers(usersData);
        setThreads(threadsData);
        
        if (currentUser) {
          const savedIds = await db.getSavedProductIds(currentUser.id);
          setSavedProductIds(savedIds);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // --- HISTORY MANAGEMENT ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      if (!state) {
        setSelectedProduct(null);
        setActiveThreadId(null);
        setActivePage('home');
        return;
      }

      // Handle Page State
      if (state.page) {
        setActivePage(state.page);
      }

      // Handle Product View
      if (state.view === 'product' && state.productId) {
        const product = products.find(p => p.id === state.productId);
        if (product) setSelectedProduct(product);
      } else {
        setSelectedProduct(null);
      }

      // Handle Thread View
      if (state.view === 'thread' && state.threadId) {
        setActiveThreadId(state.threadId);
      } else {
        setActiveThreadId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, threads]); 

  // --- EFFECTS ---
  useEffect(() => {
    if (currentUser) {
      db.saveCurrentUser(currentUser);
      // Reload saved products when user changes
      db.getSavedProductIds(currentUser.id).then(setSavedProductIds);
    } else {
      db.clearCurrentUser();
      setSavedProductIds(new Set());
    }
  }, [currentUser]);
  
  useEffect(() => {
    db.saveTheme(theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Scroll Restoration Logic
  useEffect(() => {
    if (!selectedProduct && scrollPosition.current > 0) {
        window.scrollTo(0, scrollPosition.current);
    }
  }, [selectedProduct]);

  // --- UTILS ---
  const showToast = (message: string) => {
    setToast({ message, id: Date.now() });
  };

  // --- HANDLERS ---
  const handleLogin = async (data: AuthData) => {
    const user = users.find(u => u.username === data.username);
    if (user) {
      setCurrentUser(user);
      setAuthModal({isOpen: false, view: 'login'});
      showToast(`Welcome back, ${user.name}!`);
    } else {
      showToast('User not found. Try registering.');
    }
  };
  
  const handleRegister = async (data: AuthData) => {
    if (!isSupabaseConfigured) {
      showToast('Supabase is not configured. Set env vars and restart.');
      return;
    }
    if (users.some(u => u.username === data.username)) {
      showToast('This username is already taken.');
      return;
    }
    
    const newUser = await db.createUser({
      name: data.name!,
      username: data.username!,
      profilePicture: data.profilePicture || generateAvatar(data.name!)
    });
    
    if (newUser) {
      setUsers(prev => [newUser, ...prev]);
      setCurrentUser(newUser);
      setAuthModal({isOpen: false, view: 'login'});
      showToast(`Welcome, ${newUser.name}! Your account has been created.`);
    } else {
      showToast('Error creating account. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.history.pushState({ page: 'home' }, '', '#home');
    setActivePage('home');
    setSelectedProduct(null);
    showToast("You have been logged out.");
  };

  const handleUpdateProfilePicture = async (newPictureUrl: string) => {
    if (!currentUser) return;
    
    const success = await db.updateUser(currentUser.id, { profilePicture: newPictureUrl });
    if (success) {
      const updatedUser = { ...currentUser, profilePicture: newPictureUrl };
      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(user => user.id === currentUser.id ? updatedUser : user));
      showToast('Profile picture updated!');
    } else {
      showToast('Error updating profile picture.');
    }
  };
  
  const handleUpdateProfile = async (name: string, username: string) => {
    if (!currentUser) return;
    
    if (username !== currentUser.username && users.some(u => u.username === username && u.id !== currentUser.id)) {
        showToast("This username is already taken.");
        return;
    }
    
    const success = await db.updateUser(currentUser.id, { name, username });
    if (success) {
      const updatedUser = { ...currentUser, name, username };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      showToast("Profile updated successfully!");
      window.history.back();
    } else {
      showToast('Error updating profile.');
    }
  };

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'sellerId' | 'location' | 'date'>) => {
    if (!currentUser) {
        showToast('You must be logged in to post an ad.');
        setAuthModal({isOpen: true, view: 'login'});
        return;
    }
    
    const newProduct = await db.createProduct({
      ...productData,
      sellerId: currentUser.id,
      location: 'Kano',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
    
    if (newProduct) {
      setProducts(prev => [newProduct, ...prev]);
      showToast('Your ad has been posted successfully!');
    } else {
      showToast('Error posting ad. Please try again.');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const success = await db.updateProduct(updatedProduct.id, updatedProduct);
    if (success) {
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      showToast('Your ad has been updated.');
      setProductToEdit(null);
    } else {
      showToast('Error updating ad.');
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
        const success = await db.deleteProduct(productId);
        if (success) {
          setProducts(products.filter(p => p.id !== productId));
          showToast('Ad deleted successfully.');
        } else {
          showToast('Error deleting ad.');
        }
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsAddProductModalOpen(true);
  };

  const handleToggleSave = async (productId: string) => {
    if (!currentUser) {
        setAuthModal({ isOpen: true, view: 'login' });
        showToast('Please log in to save products.');
        return;
    }
    
    const isSaved = savedProductIds.has(productId);
    
    if (isSaved) {
      const success = await db.unsaveProduct(currentUser.id, productId);
      if (success) {
        const newSaved = new Set(savedProductIds);
        newSaved.delete(productId);
        setSavedProductIds(newSaved);
        showToast('Product unsaved.');
      }
    } else {
      const success = await db.saveProduct(currentUser.id, productId);
      if (success) {
        const newSaved = new Set(savedProductIds);
        newSaved.add(productId);
        setSavedProductIds(newSaved);
        showToast('Product saved!');
      }
    }
  };
  
  const handlePostAdClick = () => {
    if (!currentUser) {
        setAuthModal({isOpen: true, view: 'login'});
        showToast("Please log in to post an ad.");
        return;
    }
    setProductToEdit(null);
    setIsAddProductModalOpen(true);
  };
  
  const handleSelectProduct = (product: Product) => {
      scrollPosition.current = window.scrollY;
      window.history.pushState({ view: 'product', productId: product.id, page: activePage }, '', `#product=${product.id}`);
      setSelectedProduct(product);
  };

  const handleMessageSeller = (product: Product) => {
    if (!currentUser) {
        setAuthModal({ isOpen: true, view: 'login' });
        showToast('Please log in to message sellers.');
        return;
    }
    if (currentUser.id === product.sellerId) {
        showToast("You cannot message yourself.");
        return;
    }
    setMessageModal({ isOpen: true, product });
  };
  
  const handleSendMessage = async (messageText: string) => {
    if (!currentUser || !messageModal.product) return;

    const { product } = messageModal;
    const participants: [string, string] = [currentUser.id, product.sellerId].sort() as [string, string];
    const threadId = `${product.id}-${participants[0]}-${participants[1]}`;

    const newMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        text: messageText,
        timestamp: Date.now(),
    };

    const existingThread = threads.find(t => t.id === threadId);
    
    if (existingThread) {
        const createdMessage = await db.createMessage(newMessage, threadId);
        if (createdMessage) {
          setThreads(threads.map(t => t.id === threadId ? {
              ...t,
              messages: [...t.messages, createdMessage],
              lastMessageTimestamp: createdMessage.timestamp,
          } : t));
        }
    } else {
        const newThread = await db.createThread({
            id: threadId,
            productId: product.id,
            productTitle: product.title,
            participants,
            lastMessageTimestamp: newMessage.timestamp,
        });
        
        if (newThread) {
          const createdMessage = await db.createMessage(newMessage, threadId);
          if (createdMessage) {
            setThreads(prev => [...prev, { ...newThread, messages: [createdMessage] }]);
          }
        }
    }

    setMessageModal({ isOpen: false, product: null });
    showToast('Message sent!');
    
    window.history.pushState({ page: 'messages' }, '', '#messages');
    setActivePage('messages');
    window.history.pushState({ view: 'thread', threadId, page: 'messages' }, '', `#thread=${threadId}`);
    setActiveThreadId(threadId);
  };

  const handleSendMessageInChat = async (text: string, threadId: string) => {
    if (!currentUser) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text,
      timestamp: Date.now(),
    };

    const createdMessage = await db.createMessage(newMessage, threadId);
    if (createdMessage) {
      setThreads(threads.map(t => t.id === threadId ? {
        ...t,
        messages: [...t.messages, createdMessage],
        lastMessageTimestamp: createdMessage.timestamp,
      } : t));
    }
  };

  const handleThreadSelect = (threadId: string) => {
      window.history.pushState({ view: 'thread', threadId, page: activePage }, '', `#thread=${threadId}`);
      setActiveThreadId(threadId);
  };

  const handlePageChange = (page: Page) => {
    if (activePage === page && !selectedProduct && !activeThreadId) return;
    
    window.history.pushState({ page }, '', `#${page}`);
    setSelectedProduct(null);
    setActiveThreadId(null);
    setActivePage(page);
  };
  
  const handleBack = () => {
      window.history.back();
  };

  // --- COMPUTED VALUES ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
      const searchMatch = searchQuery === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, searchQuery]);
  
  const savedProducts = useMemo(() => {
    return products.filter(p => savedProductIds.has(p.id));
  }, [products, savedProductIds]);

  const userProducts = useMemo(() => {
    return currentUser ? products.filter(p => p.sellerId === currentUser.id) : [];
  }, [products, currentUser]);
  
  const activeThread = threads.find(t => t.id === activeThreadId);

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const renderPage = () => {
    if (selectedProduct) {
        const seller = users.find(u => u.id === selectedProduct.sellerId);
        return <ProductDetailPage 
            product={selectedProduct} 
            seller={seller || null}
            onClose={handleBack}
            onMessageSeller={handleMessageSeller}
            isSaved={savedProductIds.has(selectedProduct.id)}
            onToggleSave={() => handleToggleSave(selectedProduct.id)}
        />;
    }

    if (activeThread) {
        const otherParticipantId = activeThread.participants.find(p => p !== currentUser?.id);
        const participant = users.find(u => u.id === otherParticipantId);
        if (!currentUser || !participant) return null;
        return <ChatView 
            thread={activeThread}
            currentUser={currentUser}
            participant={participant}
            onClose={handleBack}
            onSendMessage={(text) => handleSendMessageInChat(text, activeThread.id)}
        />;
    }

    switch (activePage) {
        case 'saved':
            return currentUser ? <SavedPage products={savedProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} /> : <AuthPrompt page="saved" onLoginClick={() => setAuthModal({isOpen: true, view: 'login'})} />;
        case 'messages':
            return currentUser ? <MessagesPage threads={threads} currentUser={currentUser} users={users} onSelectThread={handleThreadSelect} /> : <AuthPrompt page="messages" onLoginClick={() => setAuthModal({isOpen: true, view: 'login'})} />;
        case 'profile':
            return currentUser ? <ProfilePage currentUser={currentUser} onLogout={handleLogout} onUpdateProfilePicture={handleUpdateProfilePicture} setActivePage={handlePageChange} userProducts={userProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} theme={theme} setTheme={setTheme} /> : <AuthPrompt page="profile" onLoginClick={() => setAuthModal({isOpen: true, view: 'login'})} />;
        case 'edit-profile':
            return currentUser ? <EditProfilePage currentUser={currentUser} onSaveChanges={handleUpdateProfile} onClose={handleBack} /> : <AuthPrompt page="edit-profile" onLoginClick={() => setAuthModal({isOpen: true, view: 'login'})} />;
        case 'home':
        default:
            return (
                <>
                    <CategoryFilter categories={CATEGORIES} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                    <ProductGrid products={filteredProducts} onMessageSeller={handleMessageSeller} savedProductIds={savedProductIds} onToggleSave={handleToggleSave} onSelectProduct={handleSelectProduct} />
                </>
            );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPostAdClick={handlePostAdClick}
        activePage={activePage}
        setActivePage={handlePageChange}
        currentUser={currentUser}
        onLoginClick={() => setAuthModal({isOpen: true, view: 'login'})}
      />
      <main className="flex-grow pb-16 md:pb-0">
        {renderPage()}
      </main>
      <Footer />
      <BottomNav 
        onPostAdClick={handlePostAdClick}
        activePage={activePage}
        setActivePage={handlePageChange}
      />
      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={() => {setIsAddProductModalOpen(false); setProductToEdit(null);}} 
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        productToEdit={productToEdit}
      />
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({isOpen: false, view: 'login'})} 
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

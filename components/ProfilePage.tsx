import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { User, Product, Theme, Page } from '../types';
import { ProductGrid } from './ProductGrid';

const VerifiedBadge = () => (
  <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Verified account">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

interface ProfilePageProps {
  currentUser: User | null;
  onLogout: () => void;
  onUpdateProfilePicture: (newPictureUrl: string) => void;
  setActivePage: (page: Page) => void;
  userProducts: Product[];
  onMessageSeller: (product: Product) => void;
  savedProductIds: Set<string>;
  onToggleSave: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSelector: React.FC<{ theme: Theme; setTheme: (t: Theme) => void }> = ({ theme, setTheme }) => (
  <div className="px-4 py-3">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Appearance</p>
    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
      {(['light', 'dark', 'system'] as Theme[]).map(t => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
            theme === t
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser, onLogout, onUpdateProfilePicture, setActivePage,
  userProducts, onMessageSeller, savedProductIds, onToggleSave,
  onSelectProduct, onEditProduct, onDeleteProduct, theme, setTheme,
}) => {
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) {
    return <div className="text-center py-20"><p>Please log in to see your profile.</p></div>;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Profile Hero */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <img
                src={newImagePreview || currentUser.profilePicture}
                alt={currentUser.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ring-orange-50 dark:ring-orange-900/20"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded-2xl transition-all duration-200"
              >
                <Icon name="pencil" className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            </div>

            {newImagePreview && (
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => { onUpdateProfilePicture(newImagePreview); setNewImagePreview(null); }}
                  className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-orange-600 transition-colors">
                  Save Photo
                </button>
                <button onClick={() => setNewImagePreview(null)}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h1>
              {currentUser.isVerified && <VerifiedBadge />}
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">@{currentUser.username}</p>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{userProducts.length}</p>
                <p className="text-xs text-gray-400">Listings</p>
              </div>
              {currentUser.isAdmin && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md shadow-orange-200 dark:shadow-orange-900/40">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                  Admin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Admin Panel Button */}
        {currentUser.isAdmin && (
          <button
            onClick={() => setActivePage('admin')}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-red-300 dark:shadow-red-900/50">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Admin Dashboard</p>
              <p className="text-xs text-gray-400">Manage users, products & analytics</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
          <button
            onClick={() => setActivePage('edit-profile')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Icon name="pencil" className="w-4 h-4 text-blue-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Edit Profile</span>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>

          <ThemeSelector theme={theme} setTheme={setTheme} />

          <button
            onClick={() => alert('Feature coming soon!')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <Icon name="home" className="w-4 h-4 text-green-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Help & Support</span>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Log Out
        </button>
      </div>

      {/* My Ads */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">My Listings</h2>
        {userProducts.length > 0 ? (
          <ProductGrid products={userProducts} onMessageSeller={onMessageSeller} savedProductIds={savedProductIds} onToggleSave={onToggleSave} onSelectProduct={onSelectProduct}>
            {({ product }: { product: Product }) => (
              <div className="flex justify-end gap-3 px-3.5 pb-3 -mt-1">
                <button onClick={() => onEditProduct(product)} className="text-xs font-semibold text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2.5 py-1 rounded-lg transition-colors">Edit</button>
                <button onClick={() => onDeleteProduct(product.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1 rounded-lg transition-colors">Delete</button>
              </div>
            )}
          </ProductGrid>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200">No listings yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Post your first ad to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

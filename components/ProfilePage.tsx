import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { User, Product, Theme, Page } from '../types';
import { ProductGrid } from './ProductGrid';
import { HelpSupportPage } from './HelpSupportPage';
import { ChangePasswordModal } from './ChangePasswordModal';
import { PrivacyPage } from './PrivacyPage';
import { TermsPage } from './TermsPage';
import type { Order } from '../services/dbService';

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
  onSetPin: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  orders: Order[];
}

const formatOrderTime = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

interface PayoutDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const PAYOUT_KEY = 'kano-payout-details';

const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA', 'Fidelity Bank',
  'Union Bank', 'Sterling Bank', 'Wema Bank', 'FCMB', 'Stanbic IBTC', 'Polaris Bank',
  'Ecobank', 'Keystone Bank', 'Providus Bank', 'Opay', 'Moniepoint MFB', 'Kuda Bank'
];

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
  onSelectProduct, onEditProduct, onDeleteProduct, theme, setTheme, onSetPin,
  onChangePassword, orders,
}) => {
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails>(() => {
    try {
      const raw = localStorage.getItem(PAYOUT_KEY);
      if (!raw) return { bankName: '', accountNumber: '', accountName: '' };
      const all = JSON.parse(raw) as Record<string, PayoutDetails>;
      return all[currentUser?.id ?? ''] ?? { bankName: '', accountNumber: '', accountName: '' };
    } catch {
      return { bankName: '', accountNumber: '', accountName: '' };
    }
  });
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sellerOrders = orders
    .filter(order => order.sellerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!currentUser) {
    return <div className="text-center py-20"><p>Please log in to see your profile.</p></div>;
  }

  if (showHelp) return <HelpSupportPage onClose={() => setShowHelp(false)} />;
  if (showPrivacy) return <PrivacyPage onClose={() => setShowPrivacy(false)} />;
  if (showTerms) return <TermsPage onClose={() => setShowTerms(false)} />;

  const handleAccountNumberChange = (value: string) => {
    const accountNumber = value.replace(/\D/g, '').slice(0, 10);
    setPayoutDetails(prev => ({
      ...prev,
      accountNumber,
      accountName: accountNumber.length === 10 && !prev.accountName ? currentUser?.name ?? '' : prev.accountName,
    }));
  };

  const handleSavePayoutDetails = () => {
    if (!currentUser) return;
    try {
      const raw = localStorage.getItem(PAYOUT_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[currentUser.id] = payoutDetails;
      localStorage.setItem(PAYOUT_KEY, JSON.stringify(all));
      setPayoutSaved(true);
      setTimeout(() => setPayoutSaved(false), 1800);
    } catch (e) {
      console.error('save payout details failed', e);
    }
  };

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
                <button
                  onClick={() => { onUpdateProfilePicture(newImagePreview); setNewImagePreview(null); }}
                  className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Save Photo
                </button>
                <button
                  onClick={() => setNewImagePreview(null)}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-semibold px-4 py-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
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
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
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



        {(currentUser.isApprovedSeller || currentUser.isAdmin) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Orders</h3>
              <button
                onClick={() => setShowOrders(v => !v)}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                {showOrders ? 'Hide orders' : 'Enter orders section'}
              </button>
            </div>

            {!showOrders ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Tap "Enter orders section" to view full order details.</p>
            ) : sellerOrders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {sellerOrders.map(order => {
                  const isPaid = ['success', 'shipped', 'delivered'].includes(order.status);
                  return (
                    <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.productTitle || 'Order item'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyerName || 'Unknown buyer'} • ₦{order.amount.toLocaleString()}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          {isPaid ? 'Payment successful' : order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Order time: {formatOrderTime(order.createdAt)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone: {order.buyerPhone || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address: {order.buyerAddress || '—'}</p>
                      <p className="text-[11px] text-gray-400 break-all">Order ID: {order.id}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}



        {(currentUser.isApprovedSeller || currentUser.isAdmin) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Paystack Payout Details</h3>
              <button onClick={() => setShowPayout(v => !v)} className="text-xs font-semibold text-orange-500 hover:text-orange-600">{showPayout ? 'Hide' : 'Expand'}</button>
            </div>
            {!showPayout ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Expand to connect Nigerian bank details for payout.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select your Nigerian bank and account details for Paystack payout.</p>
                <div className="space-y-2">
                  <select value={payoutDetails.bankName} onChange={e => setPayoutDetails(v => ({ ...v, bankName: e.target.value }))} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <option value="">Select bank</option>
                    {NIGERIAN_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                  <input value={payoutDetails.accountNumber} onChange={e => handleAccountNumberChange(e.target.value)} placeholder="Account number" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                  <input value={payoutDetails.accountName} onChange={e => setPayoutDetails(v => ({ ...v, accountName: e.target.value }))} placeholder="Account name (auto-filled)" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                  {payoutSaved && <span className="text-xs font-semibold text-emerald-500">Saved</span>}
                  <button onClick={handleSavePayoutDetails} className="w-full mt-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-lg">Save payout details</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">

          {/* Edit Profile */}
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

          
          {/* PIN - sellers & admins only */}
{(currentUser.isApprovedSeller || currentUser.isAdmin) && (
  <button
    onClick={onSetPin}
    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
  >
    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    </div>
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {currentUser.pin ? 'Change PIN' : 'Set PIN'}
      </span>
      <p className="text-xs text-gray-400 mt-0.5">
        {currentUser.pin ? 'Update your 4-digit login PIN' : 'Add a PIN to secure your account'}
      </p>
    </div>
    <Icon name="chevron-right" className="w-4 h-4 text-gray-300 dark:text-gray-600" />
  </button>
)}
          {/* Change Password */}
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Change Password</span>
              <p className="text-xs text-gray-400 mt-0.5">Update your login password</p>
            </div>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>

          {/* Theme */}
          <ThemeSelector theme={theme} setTheme={setTheme} />

          {/* Help & Support */}
          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Help & Support</span>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>
        </div>

        {/* Log Out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Log Out
        </button>

        {/* Privacy & Terms Footer */}
        <div className="flex items-center justify-center gap-4 pt-2 pb-4">
          <button
            onClick={() => setShowPrivacy(true)}
            className="text-xs text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <button
            onClick={() => setShowTerms(true)}
            className="text-xs text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* My Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">My Listings</h2>
        {userProducts.length > 0 ? (
          <ProductGrid
            products={userProducts}
            onMessageSeller={onMessageSeller}
            savedProductIds={savedProductIds}
            onToggleSave={onToggleSave}
            onSelectProduct={onSelectProduct}
          >
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onChangePassword={onChangePassword}
      />
    </div>
  );
};

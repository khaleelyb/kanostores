import React, { useState, useEffect } from 'react';
import { CartItem, Product, User } from '../types';
import { supabase } from '../services/supabase_client';
import { initiateCartPayment, verifyPayment } from '../services/paymentService';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? '';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: object) => { openIframe: () => void };
    };
  }
}

interface Order {
  id: string;
  productTitle: string;
  amount: number;
  currency: string;
  status: string;
  buyerName: string | null;
  buyerAddress: string | null;
  createdAt: string;
  productId: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  processing: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  success:    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  failed:     'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800',
  shipped:    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  delivered:  'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', success: 'Paid',
  failed: 'Failed', shipped: 'Shipped', delivered: 'Delivered',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  users: User[];
  onCartCheckoutSuccess?: () => void;
}

// ── Buyer details form ────────────────────────────────────────────────────────
interface BuyerFormProps {
  currentUser: User;
  onSubmit: (details: { name: string; email: string; phone: string; address: string }) => void;
  isLoading: boolean;
}
const BuyerForm: React.FC<BuyerFormProps> = ({ currentUser, onSubmit, isLoading }) => {
  const [name, setName]       = useState(currentUser.name ?? '');
  const [email, setEmail]     = useState(currentUser.email ?? '');
  const [phone, setPhone]     = useState(currentUser.phone ?? '');
  const [address, setAddress] = useState(currentUser.address ?? '');
  const [err, setErr]         = useState('');

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())                          { setErr('Please enter your name.'); return; }
    if (!phone.trim() || phone.length < 7)     { setErr('Please enter a valid phone number.'); return; }
    if (!email.trim() || !email.includes('@')) { setErr('Please enter a valid email.'); return; }
    if (!address.trim())                       { setErr('Please enter your delivery address.'); return; }
    setErr('');
    onSubmit({ name, email, phone, address });
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      {[
        { label: 'Full Name',          value: name,    set: setName,    type: 'text',  ph: 'Aminu Musa' },
        { label: 'Phone Number',       value: phone,   set: setPhone,   type: 'tel',   ph: '+234 800 000 0000' },
        { label: 'Email (for receipt)', value: email,  set: setEmail,   type: 'email', ph: 'you@example.com' },
      ].map(({ label, value, set, type, ph }) => (
        <div key={label}>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
          <input type={type} value={value} onChange={e => { set(e.target.value); setErr(''); }}
            placeholder={ph}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
          />
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Delivery Address</label>
        <textarea value={address} onChange={e => { setAddress(e.target.value); setErr(''); }}
          placeholder="House number, street, area, city…" rows={2}
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all resize-none"
        />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <button type="submit" disabled={isLoading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-200 dark:shadow-orange-900/30 text-sm">
        {isLoading ? 'Opening payment…' : 'Confirm & Pay'}
      </button>
    </form>
  );
};

// ── Main CartPage ─────────────────────────────────────────────────────────────
export const CartPage: React.FC<CartPageProps> = ({
  cartItems, onUpdateQuantity, onRemoveItem, onCheckout,
  onSelectProduct, currentUser, onLoginClick, users, onCartCheckoutSuccess,
}) => {
  const [activeTab, setActiveTab]         = useState<'cart' | 'orders'>('cart');
  const [orders, setOrders]               = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders]   = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [checkoutStep, setCheckoutStep]         = useState<'idle' | 'form' | 'processing' | 'done' | 'error'>('idle');
  const [pendingGroups, setPendingGroups]        = useState<SellerGroup[]>([]);
  const [currentGroupIdx, setCurrentGroupIdx]   = useState(0);
  const [completedCount, setCompletedCount]     = useState(0);
  const [buyerDetails, setBuyerDetails]         = useState<{ name: string; email: string; phone: string; address: string } | null>(null);

  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  type SellerGroup = {
    sellerId: string;
    sellerName: string;
    items: CartItem[];
    total: number;
  };

  const sellerGroups: SellerGroup[] = React.useMemo(() => {
    const map = new Map<string, CartItem[]>();
    cartItems.forEach(item => {
      const sid = item.product.sellerId;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(item);
    });
    return Array.from(map.entries()).map(([sellerId, items]) => {
      const seller = users.find(u => u.id === sellerId);
      return {
        sellerId,
        sellerName: seller?.name ?? 'Unknown Seller',
        items,
        total: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      };
    });
  }, [cartItems, users]);

  // Load Paystack script once
  useEffect(() => {
    if (document.querySelector('script[src*="paystack"]')) return;
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (activeTab === 'orders' && currentUser) {
      setOrdersLoading(true);
      Promise.all([
        supabase.from('orders').select('*').eq('buyer_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('seller_id', currentUser.id).order('created_at', { ascending: false }),
      ]).then(([buyerRes, sellerRes]) => {
          if (!buyerRes.error && buyerRes.data) {
            setOrders(buyerRes.data.map((o: any) => ({
              id: o.id, productTitle: o.product_title, amount: o.amount,
              currency: o.currency ?? 'NGN', status: o.status,
              buyerName: o.buyer_name ?? null, buyerAddress: o.buyer_address ?? null,
              createdAt: o.created_at, productId: o.product_id ?? null,
            })));
          }
          if (!sellerRes.error && sellerRes.data) {
            setSellerOrders(sellerRes.data.map((o: any) => ({
              id: o.id, productTitle: o.product_title, amount: o.amount,
              currency: o.currency ?? 'NGN', status: o.status,
              buyerName: o.buyer_name ?? null, buyerAddress: o.buyer_address ?? null,
              createdAt: o.created_at, productId: o.product_id ?? null,
            })));
          }
          setOrdersLoading(false);
        });
    }
  }, [activeTab, currentUser]);

  const handlePayAll = () => {
    if (!currentUser) { onLoginClick(); return; }
    setPendingGroups(sellerGroups);
    setCurrentGroupIdx(0);
    setCompletedCount(0);
    setBuyerDetails(null);
    setCheckoutStep('form');
  };

  const processGroup = async (
    group: SellerGroup,
    details: { name: string; email: string; phone: string; address: string },
    onDone: () => void,
    onFail: () => void,
  ) => {
    if (!currentUser) return;

    const result = await initiateCartPayment({
      sellerId: group.sellerId,
      items: group.items.map(i => ({
        productId: i.product.id,
        productTitle: i.product.title,
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
      totalAmount: group.total,
      buyerId: currentUser.id,
      buyerName: details.name,
      buyerEmail: details.email,
      buyerPhone: details.phone,
      buyerAddress: details.address,
    });

    if (!result) { onFail(); return; }

    let attempts = 0;
    while (!window.PaystackPop && attempts < 20) {
      await new Promise(r => setTimeout(r, 150));
      attempts++;
    }
    if (!window.PaystackPop) { onFail(); return; }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: result.email,
      amount: result.amount, // kobo
      currency: result.currency,
      ref: result.reference,
      metadata: {
        custom_fields: [
          { display_name: 'Seller', variable_name: 'seller', value: group.sellerName },
          { display_name: 'Phone', variable_name: 'phone', value: details.phone },
          { display_name: 'Address', variable_name: 'address', value: details.address },
        ],
      },
      onClose: () => { onFail(); },
      callback: async (response: { reference: string }) => {
        const v = await verifyPayment(response.reference);
        if (v?.status === 'success') onDone();
        else onFail();
      },
    });

    handler.openIframe();
  };

  const handleBuyerFormSubmit = async (details: { name: string; email: string; phone: string; address: string }) => {
    setBuyerDetails(details);
    setCheckoutStep('processing');
    await runNextGroup(0, details);
  };

  const runNextGroup = async (
    idx: number,
    details: { name: string; email: string; phone: string; address: string },
  ) => {
    if (idx >= pendingGroups.length) {
      setCheckoutStep('done');
      onCartCheckoutSuccess?.();
      return;
    }
    setCurrentGroupIdx(idx);
    const group = pendingGroups[idx];
    processGroup(
      group,
      details,
      () => { setCompletedCount(c => c + 1); runNextGroup(idx + 1, details); },
      () => { setCheckoutStep('error'); },
    );
  };

  const resetCheckout = () => {
    setCheckoutStep('idle');
    setPendingGroups([]);
    setCurrentGroupIdx(0);
    setCompletedCount(0);
    setBuyerDetails(null);
  };

  // ── Checkout overlay ──────────────────────────────────────────────────────
  const renderCheckoutOverlay = () => {
    if (checkoutStep === 'idle') return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 overflow-hidden">

          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {checkoutStep === 'form'       ? 'Delivery Details' :
                 checkoutStep === 'processing' ? 'Processing Payments' :
                 checkoutStep === 'done'       ? 'All Paid! 🎉' : 'Payment Issue'}
              </h2>
              {checkoutStep === 'processing' && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Payment {currentGroupIdx + 1} of {pendingGroups.length}
                  {pendingGroups.length > 1 && ` · ${pendingGroups[currentGroupIdx]?.sellerName}`}
                </p>
              )}
            </div>
            {(checkoutStep === 'form' || checkoutStep === 'done' || checkoutStep === 'error') && (
              <button onClick={resetCheckout}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">

            {checkoutStep === 'form' && (
              <div className="mb-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 space-y-1.5">
                {sellerGroups.map(g => (
                  <div key={g.sellerId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-[10px] font-bold text-orange-700 dark:text-orange-300">
                        {g.items.length}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[160px]">{g.sellerName}</span>
                    </div>
                    <span className="font-bold text-orange-600 dark:text-orange-400">₦{g.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-orange-100 dark:border-orange-800/40 pt-1.5 flex justify-between text-sm font-bold">
                  <span className="text-gray-800 dark:text-gray-200">Total</span>
                  <span className="text-orange-600 dark:text-orange-400">₦{total.toLocaleString()}</span>
                </div>
                {sellerGroups.length > 1 && (
                  <p className="text-[11px] text-gray-400 pt-0.5">
                    ℹ️ Items from {sellerGroups.length} sellers — you'll complete {sellerGroups.length} payments in sequence.
                  </p>
                )}
              </div>
            )}

            {checkoutStep === 'form' && currentUser && (
              <BuyerForm currentUser={currentUser} onSubmit={handleBuyerFormSubmit} isLoading={false} />
            )}

            {checkoutStep === 'processing' && (
              <div className="flex flex-col items-center py-8 gap-4">
                {pendingGroups.length > 1 && (
                  <div className="flex gap-2 mb-2">
                    {pendingGroups.map((g, i) => (
                      <div key={g.sellerId} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < completedCount  ? 'bg-green-500 text-white' :
                        i === currentGroupIdx ? 'bg-orange-500 text-white ring-4 ring-orange-200 dark:ring-orange-900/50' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        {i < completedCount
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                          : i + 1}
                      </div>
                    ))}
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {pendingGroups.length > 1
                      ? `Opening payment ${currentGroupIdx + 1} of ${pendingGroups.length}…`
                      : 'Opening payment window…'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Complete your payment in the Paystack window</p>
                  {pendingGroups.length > 1 && pendingGroups[currentGroupIdx] && (
                    <p className="text-xs text-orange-500 mt-1 font-medium">
                      Paying: {pendingGroups[currentGroupIdx].sellerName} · ₦{pendingGroups[currentGroupIdx].total.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {checkoutStep === 'done' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                    {completedCount === 1 ? 'Payment Successful!' : `All ${completedCount} Payments Done!`}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Your orders have been placed. Sellers will contact you shortly.</p>
                </div>
                <button onClick={resetCheckout}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-2.5 rounded-xl transition-colors">
                  Done
                </button>
              </div>
            )}

            {checkoutStep === 'error' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-lg">Payment Failed</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {completedCount > 0
                      ? `${completedCount} of ${pendingGroups.length} payments completed before failure.`
                      : 'Something went wrong. Please try again.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetCheckout}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => {
                    if (buyerDetails) { setCheckoutStep('processing'); runNextGroup(currentGroupIdx, buyerDetails); }
                  }}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <button onClick={() => setActiveTab('cart')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'cart' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.875-7.16a60.077 60.077 0 0 0-16.836-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Cart
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'orders' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
          Order History
        </button>
      </div>

      {/* ── CART TAB ── */}
      {activeTab === 'cart' && (
        <>
          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 dark:text-gray-400">Browse products and tap "Add to Cart" to get started.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {sellerGroups.map(group => (
                  <div key={group.sellerId} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                        </svg>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{group.sellerName}</span>
                        <span className="text-xs text-gray-400">· {group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-xs font-bold text-orange-500">₦{group.total.toLocaleString()}</span>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {group.items.map(({ product, quantity }) => (
                        <div key={product.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => onSelectProduct(product)} className="flex-shrink-0">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {product.images?.[0]
                                  ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                                }
                              </div>
                            </button>
                            <div className="flex-1 min-w-0">
                              <button onClick={() => onSelectProduct(product)} className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{product.title}</p>
                              </button>
                              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                ₦{(product.price * quantity).toLocaleString()}
                                {quantity > 1 && <span className="text-xs font-normal text-gray-400 ml-1">(₦{product.price.toLocaleString()} each)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                            <span className="text-xs text-gray-400 font-medium">Qty</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onUpdateQuantity(product.id, quantity - 1)} disabled={quantity <= 1}
                                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 disabled:opacity-30 transition-colors">−</button>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[20px] text-center">{quantity}</span>
                              <button onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 transition-colors">+</button>
                            </div>
                            <button onClick={() => onRemoveItem(product.id)}
                              className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100 dark:border-red-800">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary + Pay All */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {sellerGroups.map(g => (
                    <div key={g.sellerId} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{g.sellerName} ({g.items.reduce((s,i)=>s+i.quantity,0)} item{g.items.reduce((s,i)=>s+i.quantity,0)>1?'s':''})</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">₦{g.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between mb-5">
                  <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                  <span className="font-bold text-orange-500 text-xl">₦{total.toLocaleString()}</span>
                </div>

                <button onClick={handlePayAll}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-green-200 dark:shadow-green-900/30 text-base">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                  Pay All · ₦{total.toLocaleString()}
                  {sellerGroups.length > 1 && (
                    <span className="text-xs bg-green-400/30 px-2 py-0.5 rounded-full font-semibold">
                      {sellerGroups.length} payments
                    </span>
                  )}
                </button>

                {sellerGroups.length > 1 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Items from {sellerGroups.length} sellers — one payment per seller
                  </p>
                )}
                {sellerGroups.length === 1 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Secured by Paystack · Cards, Bank Transfer, USSD & More
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <>
          {sellerOrders.length > 0 && (
            <div className="mb-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Orders received on your products</h3>
              <div className="space-y-2">
                {sellerOrders.slice(0, 8).map(order => (
                  <div key={order.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order.productTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.buyerName || 'Buyer'} • {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">₦{order.amount.toLocaleString()}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ordersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No orders yet</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your completed purchases will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{order.productTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-orange-500 text-base">₦{order.amount.toLocaleString()}</p>
                      <div className="mt-1"><StatusBadge status={order.status} /></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3">
                    {['success', 'shipped', 'delivered'].map((s, i) => {
                      const statuses = ['success', 'shipped', 'delivered'];
                      const currentIdx = statuses.indexOf(order.status);
                      const isDone = currentIdx >= i;
                      const isCurrent = currentIdx === i;
                      const labels = ['Paid', 'Shipped', 'Delivered'];
                      return (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isDone ? isCurrent ? 'bg-orange-500 ring-2 ring-orange-200 dark:ring-orange-900/50' : 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {isDone && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                            </div>
                            <span className={`text-[10px] font-medium ${isDone ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>{labels[i]}</span>
                          </div>
                          {i < 2 && <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all ${currentIdx > i ? 'bg-green-400' : 'bg-gray-100 dark:bg-gray-800'}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {(order.status === 'failed' || order.status === 'pending' || order.status === 'processing') && (
                    <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium ${
                      order.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {order.status === 'failed' ? '⚠️ Payment failed — please try again' : '⏳ Awaiting payment confirmation'}
                    </div>
                  )}

                  {order.buyerAddress && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-start gap-1.5 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>{order.buyerAddress}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {renderCheckoutOverlay()}
    </div>
  );
};

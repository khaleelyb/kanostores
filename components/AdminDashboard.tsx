import React, { useState, useMemo } from 'react';
import { Product, User } from '../types';

// ── Import Order type from dbService ─────────────────────────────────────────
// Add this import at the top of your file:
// import { Order, updateOrderStatus } from '../services/dbService';
// For now the type is inlined below so the file is self-contained.

export interface Order {
  id: string;
  buyerId: string | null;
  sellerId: string | null;
  productId: string | null;
  productTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'shipped' | 'delivered';
  korapayReference: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  buyerPhone: string | null;    // NEW
  buyerAddress: string | null;  // NEW
  createdAt: string;
  updatedAt: string;
}

interface AdminDashboardProps {
  products: Product[];
  users: User[];
  orders: Order[];
  currentUser: User;
  onDeleteProduct: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onBack: () => void;
}

type AdminTab = 'overview' | 'orders' | 'products' | 'users';

// ── Small reusable pieces ─────────────────────────────────────────────────────

const VerifiedBadge = () => (
  <span title="Verified" className="inline-flex items-center justify-center">
    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  </span>
);

const BoostedBadge = () => (
  <span title="Boosted / Featured" className="inline-flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
    </svg>
    TOP
  </span>
);

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }> = ({ label, value, sub, color, icon }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Order Status Badge ────────────────────────────────────────────────────────
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

// ── Boost helpers ─────────────────────────────────────────────────────────────
const BOOST_OPTIONS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
];

const boostUntilDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const isStillBoosted = (user: User) => {
  if (!user.isBoosted) return false;
  if (!user.boostedUntil) return true;
  return new Date(user.boostedUntil) > new Date();
};

// ── Formatters ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

// ── Main component ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products, users, orders, currentUser,
  onDeleteProduct, onDeleteUser, onUpdateUser, onUpdateOrderStatus, onBack,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'user'; id: string; name: string } | null>(null);
  const [boostPickerUserId, setBoostPickerUserId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const s = productSearch.toLowerCase();
    return (productCategoryFilter === 'All' || p.category === productCategoryFilter) &&
      (s === '' || p.title.toLowerCase().includes(s));
  }), [products, productSearch, productCategoryFilter]);

  const filteredUsers = useMemo(() => users.filter(u => {
    const s = userSearch.toLowerCase();
    return s === '' || u.name.toLowerCase().includes(s) || u.username.toLowerCase().includes(s);
  }), [users, userSearch]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    const s = orderSearch.toLowerCase();
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch = s === '' ||
      o.productTitle.toLowerCase().includes(s) ||
      (o.buyerName ?? '').toLowerCase().includes(s) ||
      (o.buyerEmail ?? '').toLowerCase().includes(s) ||
      (o.korapayReference ?? '').toLowerCase().includes(s);
    return matchStatus && matchSearch;
  }), [orders, orderSearch, orderStatusFilter]);

  // Orders awaiting shipping (paid but not yet shipped/delivered)
  const pendingShipment = useMemo(() =>
    orders.filter(o => o.status === 'success'), [orders]);

  const totalRevenue = useMemo(() =>
    orders.filter(o => o.status === 'success' || o.status === 'shipped' || o.status === 'delivered')
      .reduce((s, o) => s + o.amount, 0), [orders]);

  const topSellers = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach(p => { c[p.sellerId] = (c[p.sellerId] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => ({ user: users.find(u => u.id === id), count }))
      .filter(x => x.user);
  }, [products, users]);

  const categoryBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach(p => { c[p.category] = (c[p.category] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [products]);

  const handleBoost = (userId: string, days: number) => {
    onUpdateUser(userId, { isBoosted: true, boostedUntil: boostUntilDate(days) });
    setBoostPickerUserId(null);
  };
  const handleRemoveBoost = (userId: string) => { onUpdateUser(userId, { isBoosted: false, boostedUntil: null }); };
  const handleToggleVerified = (user: User) => { onUpdateUser(user.id, { isVerified: !user.isVerified }); };
  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'product') onDeleteProduct(confirmDelete.id);
    else onDeleteUser(confirmDelete.id);
    setConfirmDelete(null);
  };

  const NEXT_STATUS: Record<string, Order['status'] | null> = {
    success: 'shipped',
    shipped: 'delivered',
    delivered: null,
    pending: null,
    processing: null,
    failed: null,
  };
  const NEXT_LABEL: Record<string, string> = {
    success: '📦 Mark as Shipped',
    shipped: '✅ Mark as Delivered',
  };

  const tabs: { id: AdminTab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', badge: pendingShipment.length },
    { id: 'products', label: 'Products' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                Back
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img src={currentUser.profilePicture} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover" />
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Listings" value={products.length} sub="All active ads" color="bg-blue-500 shadow-blue-200 dark:shadow-blue-900/40"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>} />
              <StatCard label="Registered Users" value={users.length} sub="Total accounts" color="bg-green-500 shadow-green-200 dark:shadow-green-900/40"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>} />
              <StatCard label="Total Orders" value={orders.length} sub={`${pendingShipment.length} need shipping`} color="bg-orange-500 shadow-orange-200 dark:shadow-orange-900/40"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.875-7.16a60.077 60.077 0 0 0-16.836-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>} />
              <StatCard label="Revenue" value={`₦${totalRevenue.toLocaleString()}`} sub="From paid orders" color="bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/40"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>} />
            </div>

            {/* Pending shipment alert */}
            {pendingShipment.length > 0 && (
              <div
                className="flex items-center justify-between gap-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-2xl px-5 py-4 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                onClick={() => setTab('orders')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-orange-700 dark:text-orange-400 text-sm">
                      {pendingShipment.length} order{pendingShipment.length !== 1 ? 's' : ''} need{pendingShipment.length === 1 ? 's' : ''} to be shipped
                    </p>
                    <p className="text-xs text-orange-500 dark:text-orange-500">Payment confirmed — tap to view and mark as shipped</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Sellers */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />Top Sellers
                </h3>
                <div className="space-y-3">
                  {topSellers.map(({ user, count }, i) => user && (
                    <div key={user.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">#{i + 1}</span>
                      <div className="relative flex-shrink-0">
                        <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        {isStillBoosted(user) && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                          {user.isVerified && <VerifiedBadge />}
                        </div>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                      <span className="text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">{count} listings</span>
                    </div>
                  ))}
                  {topSellers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No sellers yet</p>}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />Top Categories
                </h3>
                <div className="space-y-3">
                  {categoryBreakdown.map(([cat, count]) => {
                    const pct = products.length ? Math.round((count / products.length) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{cat}</p>
                          <span className="text-xs font-semibold text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />Recent Orders
                </h3>
                <button onClick={() => setTab('orders')} className="text-xs text-orange-500 hover:text-orange-600 font-semibold">View all →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Buyer</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {orders.slice(0, 6).map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{o.productTitle}</p>
                          <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                        </td>
                        <td className="py-2.5 hidden sm:table-cell text-gray-500 dark:text-gray-400 text-xs">{o.buyerName ?? '—'}</td>
                        <td className="py-2.5 text-right font-semibold text-orange-600 dark:text-orange-400">₦{o.amount.toLocaleString()}</td>
                        <td className="py-2.5 text-right"><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ORDERS ════════════════════════════════════════════════════════════ */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                <input type="text" placeholder="Search by product, buyer, or reference…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="all">All Statuses</option>
                <option value="success">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Quick-action banner for orders needing shipment */}
            {orderStatusFilter === 'all' && pendingShipment.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-orange-700 dark:text-orange-400 font-medium flex-1">
                  <strong>{pendingShipment.length}</strong> paid order{pendingShipment.length !== 1 ? 's' : ''} waiting for you to ship — mark them as Shipped once dispatched.
                </p>
                <button onClick={() => setOrderStatusFilter('success')} className="text-xs font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap">
                  Filter →
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{filteredOrders.length} orders</span>
                <span className="text-xs text-gray-400">Total: ₦{filteredOrders.reduce((s, o) => s + (o.status !== 'failed' ? o.amount : 0), 0).toLocaleString()}</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredOrders.map(o => {
                  const buyer = users.find(u => u.id === o.buyerId);
                  const seller = users.find(u => u.id === o.sellerId);
                  const product = products.find(p => p.id === o.productId);
                  const isExpanded = expandedOrderId === o.id;
                  const nextStatus = NEXT_STATUS[o.status];

                  return (
                    <div key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
  {/* Order row */}
  <div className="px-5 py-4">
    
      <div className="flex items-start gap-4">
  {/* Product thumbnail */}
<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
  {product?.images?.[0]
    ? <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
    : <div className="w-full h-full flex items-center justify-center text-gray-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
      </div>
  }
</div>

  {/* Details */}
  <div className="flex-1 min-w-0">
    <div className="flex items-start justify-between gap-2 flex-wrap">
      <div className="min-w-0 flex-1">
        {/* Product name — big and clear */}
        <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{o.productTitle}</p>
        {product && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
            <span className="text-xs text-gray-400">#{o.id.slice(0, 8)}</span>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">{formatDate(o.createdAt)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={o.status} />
        <p className="font-bold text-orange-600 dark:text-orange-400 text-base">₦{o.amount.toLocaleString()}</p>
      </div>
    </div>

    {/* Buyer info row */}
    <div className="flex items-center gap-4 mt-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span>{o.buyerName ?? buyer?.name ?? 'Unknown buyer'}</span>
      </div>

      {o.buyerEmail && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <a href={`mailto:${o.buyerEmail}`} className="hover:text-orange-500 transition-colors">{o.buyerEmail}</a>
        </div>
      )}

      {o.buyerPhone && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
          <a href={`tel:${o.buyerPhone}`} className="hover:text-orange-500 transition-colors">{o.buyerPhone}</a>
        </div>
      )}

      {o.buyerAddress && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span>{o.buyerAddress}</span>
        </div>
      )}
    </div>

    {/* Action row */}
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      {nextStatus && (
        <button
          onClick={() => onUpdateOrderStatus(o.id, nextStatus)}
          className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          {NEXT_LABEL[o.status]}
        </button>
      )}
      <button
  onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
  className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
>
  {isExpanded ? 'Hide details' : 'View details'}
</button>
<button
  onClick={() => {
    const text = [
      `📦 Order: ${o.productTitle}`,
      `💰 Amount: ₦${o.amount.toLocaleString()}`,
      `👤 Buyer: ${o.buyerName ?? '—'}`,
      o.buyerPhone ? `📞 Phone: ${o.buyerPhone}` : null,
      o.buyerEmail ? `📧 Email: ${o.buyerEmail}` : null,
      o.buyerAddress ? `📍 Address: ${o.buyerAddress}` : null,
      `🔖 Status: ${STATUS_LABELS[o.status] ?? o.status}`,
      o.korapayReference ? `🧾 Ref: ${o.korapayReference}` : null,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      // brief visual feedback via button text swap
    });
  }}
  className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
>
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </svg>
  Copy
</button>
    </div>
  </div>
</div>

                        {/* Expanded details */}
{isExpanded && (
  <div className="mt-4 ml-16 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-2 text-xs">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Order ID</p>
        <p className="font-mono text-gray-600 dark:text-gray-300 break-all">{o.id}</p>
      </div>
      
      {/* Buyer Phone Field */}
      {o.buyerPhone && (
        <div>
          <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Buyer Phone</p>
          <a href={`tel:${o.buyerPhone}`} className="text-orange-500 hover:text-orange-600 font-medium">{o.buyerPhone}</a>
        </div>
      )}
      
      {/* Delivery Address Field */}
      {o.buyerAddress && (
        <div className="sm:col-span-2">
          <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Delivery Address</p>
          <p className="text-gray-600 dark:text-gray-300">{o.buyerAddress}</p>
        </div>
      )}
      
      {o.korapayReference && (
        <div>
          <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Payment Reference</p>
          <p className="font-mono text-gray-600 dark:text-gray-300 break-all">{o.korapayReference}</p>
        </div>
      )}
      {seller && (
        <div>
          <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Seller</p>
          <div className="flex items-center gap-2">
            <img src={seller.profilePicture} alt={seller.name} className="w-5 h-5 rounded-full object-cover" />
            <p className="text-gray-600 dark:text-gray-300">{seller.name} (@{seller.username})</p>
            {seller.phone && (
              <a href={`tel:${seller.phone}`} className="text-orange-500 hover:text-orange-600">{seller.phone}</a>
            )}
          </div>
        </div>
      )}
      <div>
        <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Amount</p>
        <p className="text-gray-600 dark:text-gray-300 font-bold">₦{o.amount.toLocaleString()} {o.currency}</p>
      </div>
      <div>
        <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Last Updated</p>
        <p className="text-gray-600 dark:text-gray-300">{formatDate(o.updatedAt)}</p>
      </div>
    </div>

                            {/* All status progression buttons */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-gray-400 font-semibold uppercase tracking-wide mb-2">Update Status Manually</p>
                              <div className="flex flex-wrap gap-2">
                                {(['pending','processing','success','shipped','delivered','failed'] as Order['status'][]).map(s => (
                                  <button
                                    key={s}
                                    disabled={o.status === s}
                                    onClick={() => onUpdateOrderStatus(o.id, s)}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors text-xs ${
                                      o.status === s
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-default'
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-orange-500'
                                    }`}
                                  >
                                    {STATUS_LABELS[s]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.875-7.16a60.077 60.077 0 0 0-16.836-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                    No orders found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ══════════════════════════════════════════════════════════ */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{filteredProducts.length} products</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Seller</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Category</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredProducts.map(p => {
                      const seller = users.find(u => u.id === p.sellerId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">{p.title}</p>
                                <p className="text-xs text-gray-400">{p.date} · {p.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {seller && <img src={seller.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />}
                              <span className="text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{seller?.name ?? '—'}</span>
                              {seller?.isVerified && <VerifiedBadge />}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{p.category}</span>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">₦{p.price.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => setConfirmDelete({ type: 'product', id: p.id, name: p.title })}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1 rounded-lg transition-colors">
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && <div className="text-center py-12 text-gray-400">No products found</div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ USERS ════════════════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">Controls:</div>
              <div className="flex items-center gap-1.5"><VerifiedBadge /><span>= Verified (blue checkmark shown on their profile & listings)</span></div>
              <div className="flex items-center gap-1.5"><BoostedBadge /><span>= Boosted / Top seller (featured badge shown publicly)</span></div>
            </div>

            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{filteredUsers.length} users</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredUsers.map(u => {
                  const listingCount = products.filter(p => p.sellerId === u.id).length;
                  const isMe = u.id === currentUser.id;
                  const boosted = isStillBoosted(u);
                  const showBoostPicker = boostPickerUserId === u.id;

                  return (
                   <div key={u.id} className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="relative flex-shrink-0">
                          <img src={u.profilePicture} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                          {boosted && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                          </span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                            {u.isVerified && <VerifiedBadge />}
                            {boosted && <BoostedBadge />}
                            {isMe && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md font-medium">You</span>}
                          </div>
                          <p className="text-xs text-gray-400">@{u.username} · {listingCount} listing{listingCount !== 1 ? 's' : ''}</p>
                          {boosted && u.boostedUntil && (
                            <p className="text-xs text-amber-500 mt-0.5">
                              Boosted until {new Date(u.boostedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        {!isMe && (
                         <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => handleToggleVerified(u)} title={u.isVerified ? 'Remove verified badge' : 'Grant verified badge'}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${u.isVerified ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-300 hover:text-blue-500'}`}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" /></svg>
                              {u.isVerified ? 'Verified' : 'Verify'}
                            </button>
                            <button onClick={() => onUpdateUser(u.id, { isApprovedSeller: !u.isApprovedSeller })}
  title={u.isApprovedSeller ? 'Revoke seller access' : 'Approve as seller'}
  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
    u.isApprovedSeller
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100'
      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-300 hover:text-green-500'
  }`}>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
  </svg>
  {u.isApprovedSeller ? 'Seller' : 'Approve'}
</button>
                            {boosted ? (
                              <button onClick={() => handleRemoveBoost(u.id)} title="Remove boost"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-all">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                                Boosted
                              </button>
                            ) : (
                              <button onClick={() => setBoostPickerUserId(showBoostPicker ? null : u.id)} title="Boost this user"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-all">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                                Boost
                              </button>
                            )}
                            {/* Delete button - improved for mobile visibility */}
<button 
  onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.name })}
  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-white bg-red-50 dark:bg-red-900/20 hover:bg-red-500 dark:hover:bg-red-600 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200 shadow-sm hover:shadow-red-200 dark:hover:shadow-red-900/40"
  aria-label="Delete user"
>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
  <span className="hidden sm:inline">Delete</span>
  <span className="sm:hidden">Del</span>
</button>
                          </div>
                        )}
                      </div>
                      {showBoostPicker && (
                        <div className="mt-3 ml-14 flex flex-wrap gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                          <p className="w-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Select boost duration:</p>
                          {BOOST_OPTIONS.map(opt => (
                            <button key={opt.days} onClick={() => handleBoost(u.id, opt.days)}
                              className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm">
                              {opt.label}
                            </button>
                          ))}
                          <button onClick={() => setBoostPickerUserId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">Cancel</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {filteredUsers.length === 0 && <div className="text-center py-12 text-gray-400">No users found</div>}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Delete <span className="font-semibold text-gray-700 dark:text-gray-300">"{confirmDelete.name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-md shadow-red-200 dark:shadow-red-900/40">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

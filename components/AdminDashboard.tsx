import React, { useState, useMemo } from 'react';
import { Product, User } from '../types';

interface AdminDashboardProps {
  products: Product[];
  users: User[];
  currentUser: User;
  onDeleteProduct: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onBack: () => void;
}

type AdminTab = 'overview' | 'products' | 'users';

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

// ── Boost duration picker ─────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products, users, currentUser, onDeleteProduct, onDeleteUser, onUpdateUser, onBack,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'user'; id: string; name: string } | null>(null);
  const [boostPickerUserId, setBoostPickerUserId] = useState<string | null>(null);

  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price, 0), [products]);
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

  const handleRemoveBoost = (userId: string) => {
    onUpdateUser(userId, { isBoosted: false, boostedUntil: null });
  };

  const handleToggleVerified = (user: User) => {
    onUpdateUser(user.id, { isVerified: !user.isVerified });
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'product') onDeleteProduct(confirmDelete.id);
    else onDeleteUser(confirmDelete.id);
    setConfirmDelete(null);
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
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
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
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
              <StatCard label="Verified Users" value={users.filter(u => u.isVerified).length} sub="With blue badge" color="bg-blue-400 shadow-blue-200 dark:shadow-blue-900/40"
                icon={<svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" /></svg>} />
              <StatCard label="Boosted Users" value={users.filter(u => isStillBoosted(u)).length} sub="Currently featured" color="bg-amber-400 shadow-amber-200 dark:shadow-amber-900/40"
                icon={<svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>} />
            </div>

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

            {/* Recent listings */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />Recent Listings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Product', 'Seller', 'Category', 'Price'].map(h => (
                        <th key={h} className={`text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide ${h === 'Category' ? 'hidden md:table-cell' : h === 'Seller' ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                      ))}
                      <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {products.slice(0, 8).map(p => {
                      const seller = users.find(u => u.id === p.sellerId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{p.title}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <span>{seller?.name ?? '—'}</span>
                              {seller?.isVerified && <VerifiedBadge />}
                            </div>
                          </td>
                          <td className="py-2.5 hidden md:table-cell">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{p.category}</span>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-orange-600 dark:text-orange-400">₦{p.price.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
            {/* Legend */}
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
                    <div key={u.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Avatar + boost dot */}
                        <div className="relative flex-shrink-0">
                          <img src={u.profilePicture} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                          {boosted && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                          </span>}
                        </div>

                        {/* Name + badges */}
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

                        {/* Action buttons */}
                        {!isMe && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Verify toggle */}
                            <button
                              onClick={() => handleToggleVerified(u)}
                              title={u.isVerified ? 'Remove verified badge' : 'Grant verified badge'}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                u.isVerified
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-300 hover:text-blue-500'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                              </svg>
                              {u.isVerified ? 'Verified' : 'Verify'}
                            </button>

                            {/* Boost toggle */}
                            {boosted ? (
                              <button
                                onClick={() => handleRemoveBoost(u.id)}
                                title="Remove boost"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                                Boosted
                              </button>
                            ) : (
                              <button
                                onClick={() => setBoostPickerUserId(showBoostPicker ? null : u.id)}
                                title="Boost this user"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
                                Boost
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.name })}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Boost duration picker (inline dropdown) */}
                      {showBoostPicker && (
                        <div className="mt-3 ml-14 flex flex-wrap gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                          <p className="w-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Select boost duration:</p>
                          {BOOST_OPTIONS.map(opt => (
                            <button
                              key={opt.days}
                              onClick={() => handleBoost(u.id, opt.days)}
                              className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm"
                            >
                              {opt.label}
                            </button>
                          ))}
                          <button onClick={() => setBoostPickerUserId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
                            Cancel
                          </button>
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

      {/* ── Confirm Delete Modal ─────────────────────────────────────────────── */}
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
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-md shadow-red-200 dark:shadow-red-900/40">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

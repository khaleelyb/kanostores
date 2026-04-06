import React from 'react';
import { User, Product } from '../types';

const VerifiedBadge = () => (
  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Verified">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);
const BoostedBadge = () => (
  <span className="inline-flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
    TOP
  </span>
);
const isActiveBoosted = (u: any) => u.isBoosted && (!u.boostedUntil || new Date(u.boostedUntil) > new Date());

const CATEGORY_ICONS: Record<string, string> = {
  'Mobile Phones & Tablets': '📱', 'Computers': '💻', 'Women clothes': '👗',
  'Men clothes': '👔', 'Men shoes': '👞', 'Women shoes': '👠', 'Cars': '🚗',
  'Herbals and supplements': '🌿', 'Houses': '🏠', 'Accesories and chargers': '🔌',
  'Food stuffs': '🛒', 'Home, Furniture & Appliances': '🛋️', 'Electronics': '⚡',
  'Books': '📚', 'Beauty & Personal Care': '💄', 'Vehicles': '🚙', 'Property': '🏢',
  'Services': '🛠️', 'Babies & Kids': '👶', 'Animals & Pets': '🐾', 'Jobs': '💼',
};

interface ShopListPageProps {
  category: string;
  products: Product[];
  users: User[];
  onSelectShop: (seller: User) => void;
  onBack: () => void;
}

export const ShopListPage: React.FC<ShopListPageProps> = ({ category, products, users, onSelectShop, onBack }) => {
  const sellerIds = [...new Set(products.filter(p => p.category === category).map(p => p.sellerId))];
  const sellers = sellerIds
    .map(id => users.find(u => u.id === id))
    .filter((u): u is User => !!u)
    .sort((a, b) => {
      // Boosted sellers come first
      const aB = isActiveBoosted(a) ? 1 : 0;
      const bB = isActiveBoosted(b) ? 1 : 0;
      return bB - aB;
    });

  const getStats = (sellerId: string) => {
    const sp = products.filter(p => p.sellerId === sellerId && p.category === category);
    return {
      count: sp.length,
      minPrice: Math.min(...sp.map(p => p.price)),
      maxPrice: Math.max(...sp.map(p => p.price)),
      thumbnail: sp[0]?.images?.[0] ?? '',
    };
  };

  const emoji = CATEGORY_ICONS[category] || '🏷️';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={onBack} className="flex items-center gap-1.5 text-orange-100 hover:text-white mb-5 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            All Categories
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">{emoji}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{category}</h1>
              <p className="text-orange-100 mt-0.5 text-sm">
                {sellers.length} {sellers.length === 1 ? 'seller' : 'sellers'} · {products.filter(p => p.category === category).length} listings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {sellers.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">No sellers yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Be the first to list an item here!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">Select a seller to browse their listings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sellers.map(seller => {
                const stats = getStats(seller.id);
                return (
                  <button key={seller.id} onClick={() => onSelectShop(seller)}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800/60 overflow-hidden hover:shadow-xl hover:shadow-orange-50 dark:hover:shadow-orange-900/10 transition-all duration-300 hover:-translate-y-0.5 text-left"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                      {stats.thumbnail
                        ? <img src={stats.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                        : <div className="flex items-center justify-center h-full"><span className="text-4xl opacity-30">{emoji}</span></div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.count} {stats.count === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={seller.profilePicture} alt={seller.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 shadow-sm flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{seller.name}</p>
                              {seller.isVerified && <VerifiedBadge />}
                              {isActiveBoosted(seller) && <BoostedBadge />}
                            </div>
                          <p className="text-xs text-gray-400 truncate">@{seller.username}</p>
                          {seller.bio && (
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
    {seller.bio}
  </p>
)}
                        </div>
                        <div className="text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Price range</p>
                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                          ₦{stats.minPrice.toLocaleString()}{stats.maxPrice !== stats.minPrice && ` – ₦${stats.maxPrice.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { User, Product } from '../types';

interface ShopListPageProps {
  category: string;
  products: Product[];
  users: User[];
  onSelectShop: (seller: User) => void;
  onBack: () => void;
}

export const ShopListPage: React.FC<ShopListPageProps> = ({
  category,
  products,
  users,
  onSelectShop,
  onBack,
}) => {
  // Find unique sellers who have products in this category
  const sellerIds = [...new Set(
    products
      .filter(p => p.category === category)
      .map(p => p.sellerId)
  )];

  const sellers = sellerIds
    .map(id => users.find(u => u.id === id))
    .filter((u): u is User => !!u);

  const getSellerStats = (sellerId: string) => {
    const sellerProducts = products.filter(
      p => p.sellerId === sellerId && p.category === category
    );
    const minPrice = Math.min(...sellerProducts.map(p => p.price));
    return {
      count: sellerProducts.length,
      minPrice,
      thumbnail: sellerProducts[0]?.images?.[0] ?? '',
    };
  };

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8 gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span>All Categories</span>
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate">{category}</h1>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {sellers.length} {sellers.length === 1 ? 'shop' : 'shops'} selling in this category
        </p>

        {sellers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No shops yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to post in this category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sellers.map(seller => {
              const stats = getSellerStats(seller.id);
              return (
                <button
                  key={seller.id}
                  onClick={() => onSelectShop(seller)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-700/40 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 text-left flex flex-col"
                >
                  {/* Shop Banner / Product Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 overflow-hidden">
                    {stats.thumbnail ? (
                      <img
                        src={stats.thumbnail}
                        alt={`${seller.name}'s products`}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-orange-300 dark:text-orange-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                        </svg>
                      </div>
                    )}
                    {/* Item count badge */}
                    <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      {stats.count} {stats.count === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="p-4 flex items-center gap-3 flex-1">
                    <img
                      src={seller.profilePicture}
                      alt={seller.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-100 dark:ring-orange-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{seller.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{seller.username}</p>
                      <p className="text-xs text-orange-600 font-semibold mt-0.5">
                        From ₦{stats.minPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-orange-500 transition-colors flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { User, Product } from '../types';
import { ProductGrid } from './ProductGrid';

const VerifiedBadge = () => (
  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Verified">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);
const BoostedBadge = () => (
  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" /></svg>
    Top Seller
  </span>
);
const isActiveBoosted = (u: any) => u.isBoosted && (!u.boostedUntil || new Date(u.boostedUntil) > new Date());

interface ShopProductsPageProps {
  seller: User;
  category: string;
  products: Product[];
  savedProductIds: Set<string>;
  onToggleSave: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onMessageSeller: (product: Product) => void;
  onBack: () => void;
}

export const ShopProductsPage: React.FC<ShopProductsPageProps> = ({
  seller, category, products, savedProductIds, onToggleSave, onSelectProduct, onMessageSeller, onBack,
}) => {
  const shopProducts = products.filter(p => p.sellerId === seller.id && p.category === category);
  const allSellerProducts = products.filter(p => p.sellerId === seller.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shop Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Breadcrumb */}
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-orange-500 mb-5 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            Back to sellers
          </button>

          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <img src={seller.profilePicture} alt={seller.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md ring-4 ring-orange-50 dark:ring-orange-900/20" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" title="Active seller" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{seller.name}</h1>
                 
 {seller.bio && (
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
    {seller.bio}
  </p>
)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5..." />
  </svg>
  <span className="font-medium text-gray-700 dark:text-gray-300">
    {shopProducts.length}
  </span>
  <span>in {category}</span>
</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  {allSellerProducts.length} total listings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ProductGrid
          products={shopProducts}
          savedProductIds={savedProductIds}
          onToggleSave={onToggleSave}
          onSelectProduct={onSelectProduct}
          onMessageSeller={onMessageSeller}
        />
      </div>
    </div>
  );
};

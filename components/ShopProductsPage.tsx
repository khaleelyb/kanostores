import React from 'react';
import { User, Product } from '../types';
import { ProductGrid } from './ProductGrid';

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
  seller,
  category,
  products,
  savedProductIds,
  onToggleSave,
  onSelectProduct,
  onMessageSeller,
  onBack,
}) => {
  const shopProducts = products.filter(
    p => p.sellerId === seller.id && p.category === category
  );

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-semibold transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {category}
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-bold text-sm truncate">{seller.name}'s Shop</span>
        </div>

        {/* Shop Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8 flex items-center gap-5">
          <img
            src={seller.profilePicture}
            alt={seller.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-orange-100 dark:ring-orange-800 flex-shrink-0"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{seller.name}'s Shop</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">@{seller.username}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-orange-600 font-semibold bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
                {shopProducts.length} {shopProducts.length === 1 ? 'listing' : 'listings'} in {category}
              </span>
            </div>
          </div>
        </div>

        {/* Products */}
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


import React from 'react';
import { Product } from '../types';
import { ProductGrid } from './ProductGrid';

interface SavedPageProps {
  products: Product[];
  onMessageSeller: (product: Product) => void;
  savedProductIds: Set<string>;
  onToggleSave: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({ products, onMessageSeller, savedProductIds, onToggleSave, onSelectProduct }) => {
  return (
    <div className="container mx-auto px-4">
      <section className="py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Saved Products</h1>
        {products.length > 0 ? (
          <ProductGrid
            products={products}
            onMessageSeller={onMessageSeller}
            savedProductIds={savedProductIds}
            onToggleSave={onToggleSave}
            onSelectProduct={onSelectProduct}
          />
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No saved items yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Tap the heart icon on any product to save it here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

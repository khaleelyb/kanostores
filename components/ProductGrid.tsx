
import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

// Number of products to load per batch
const BATCH_SIZE = 8;

interface ProductGridProps {
  products: Product[];
  onMessageSeller: (product: Product) => void;
  savedProductIds: Set<string>;
  onToggleSave: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  children?: (props: { product: Product }) => React.ReactNode;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onMessageSeller, savedProductIds, onToggleSave, onSelectProduct, children }) => {
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Reset the view when the product list is filtered or changed
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [products]);

  const displayedProducts = products.slice(0, displayCount);
  const hasMore = displayCount < products.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore) {
          // Load next batch of products
          setDisplayCount(prevCount => prevCount + BATCH_SIZE);
        }
      },
      // Options: start loading when the loader is 200px away from the viewport
      { rootMargin: '200px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // Cleanup observer on component unmount
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore]); // Re-create the observer if `hasMore` changes

  return (
    <section className="pb-12">
      <div className="container mx-auto px-4">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProducts.map(product => (
                <div key={product.id}>
                  <ProductCard 
                    product={product} 
                    onMessageSeller={onMessageSeller}
                    isSaved={savedProductIds.has(product.id)}
                    onToggleSave={() => onToggleSave(product.id)}
                    onSelectProduct={onSelectProduct}
                  />
                  {/* For rendering additional controls like Edit/Delete */}
                  {children && children({ product })}
                </div>
              ))}
            </div>
            <div ref={loaderRef} className="h-20 flex justify-center items-center">
              {hasMore && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" aria-label="Loading more products"></div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or category filters.</p>
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

const BATCH_SIZE = 8;
const SCROLL_STORAGE_KEY = 'nairabulk-scroll-pos';
const DISPLAY_COUNT_PREFIX = 'nairabulk-display-count:';

const getStorageKey = (products: Product[]) =>
  DISPLAY_COUNT_PREFIX + products.slice(0, 8).map(p => p.id).join('|');

interface ProductGridProps {
  products: Product[];
  onMessageSeller: (product: Product) => void;
  savedProductIds: Set<string>;
  onToggleSave: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  children?: (props: { product: Product }) => React.ReactNode;
  // Pass true when navigating back so the grid restores its previous state
  restoreScroll?: boolean;
  // Called after restoration is complete so App can clear the flag
  onScrollRestored?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onMessageSeller,
  savedProductIds,
  onToggleSave,
  onSelectProduct,
  children,
  restoreScroll,
  onScrollRestored,
}) => {
  const storageKey = useMemo(() => getStorageKey(products), [products]);

  // Initialise displayCount from sessionStorage when restoring, otherwise start fresh
  const [displayCount, setDisplayCount] = useState(() => {
    if (restoreScroll) {
      const stored = sessionStorage.getItem(storageKey);
      const parsed = stored ? parseInt(stored, 10) : NaN;
      if (!isNaN(parsed) && parsed >= BATCH_SIZE) {
        return Math.min(parsed, Math.max(products.length, BATCH_SIZE));
      }
    }
    return BATCH_SIZE;
  });

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const didRestoreRef = useRef(false);

  // When restoreScroll becomes true (back-navigation), immediately bump displayCount
  // from sessionStorage so the grid is tall enough before the scroll fires.
  useEffect(() => {
    if (!restoreScroll || didRestoreRef.current) return;

    const stored = sessionStorage.getItem(storageKey);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    if (!isNaN(parsed) && parsed > displayCount) {
      setDisplayCount(Math.min(parsed, Math.max(products.length, BATCH_SIZE)));
    }
    didRestoreRef.current = true;
  }, [restoreScroll, storageKey, products.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // After the grid has rendered with the restored count, scroll to the saved position
  useEffect(() => {
    if (!restoreScroll || !didRestoreRef.current) return;

    const savedY = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!savedY) {
      onScrollRestored?.();
      return;
    }

    // Use requestAnimationFrame to wait one paint so the DOM is fully laid out
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
      onScrollRestored?.();
    });

    return () => cancelAnimationFrame(raf);
  }, [displayCount, restoreScroll]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when the product list changes (new filter/search) and we're NOT restoring
  useEffect(() => {
    if (!restoreScroll) {
      setDisplayCount(BATCH_SIZE);
      didRestoreRef.current = false;
    }
  }, [products, restoreScroll]);

  const updateDisplayCount = (count: number) => {
    const next = Math.min(Math.max(count, BATCH_SIZE), Math.max(products.length, BATCH_SIZE));
    setDisplayCount(next);
    sessionStorage.setItem(storageKey, String(next));
  };

  // Save scroll position whenever the user scrolls (while not restoring)
  useEffect(() => {
    if (restoreScroll) return;
    const onScroll = () =>
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(Math.round(window.scrollY)));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [restoreScroll]);

  const displayedProducts = products.slice(0, displayCount);
  const hasMore = displayCount < products.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          updateDisplayCount(displayCount + BATCH_SIZE);
        }
      },
      { rootMargin: '400px' }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, displayCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  {children && children({ product })}
                </div>
              ))}
            </div>
            <div ref={loaderRef} className="h-20 flex justify-center items-center">
              {hasMore && (
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"
                  aria-label="Loading more products"
                />
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Try adjusting your search or category filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onMessageSeller: (product: Product) => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onMessageSeller, isSaved, onToggleSave, onSelectProduct }) => {
  const thumbnail = (product.images && product.images.length > 0) ? product.images[0] : '';

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-xl hover:shadow-orange-50 dark:hover:shadow-orange-900/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Image */}
      <button onClick={() => onSelectProduct(product)} className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3] block">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleSave(); }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
            isSaved
              ? 'bg-orange-500 text-white shadow-orange-200 dark:shadow-orange-900/50'
              : 'bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400 hover:bg-white hover:text-orange-500 backdrop-blur-sm'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>

        {/* Image count */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {product.images.length}
          </div>
        )}
      </button>

      {/* Content */}
      <button onClick={() => onSelectProduct(product)} className="flex-1 p-3.5 text-left">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 flex-1">{product.title}</h3>
        </div>
        <span className="inline-block text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full font-medium mb-2">{product.category}</span>
        <p className="text-xl font-bold text-gray-900 dark:text-white">₦{product.price.toLocaleString()}</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {product.location} · {product.date}
        </div>
      </button>

      {/* CTA */}
      <div className="px-3.5 pb-3.5">
        <button
          onClick={e => { e.stopPropagation(); onMessageSeller(product); }}
          className="w-full py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-xl transition-colors"
        >
          Message Seller
        </button>
      </div>
    </div>
  );
};

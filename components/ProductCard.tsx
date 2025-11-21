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
  const thumbnail = (product.images && product.images.length > 0) ? product.images[0] : product.image ?? '';

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => onSelectProduct(product)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700/50 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 ease-in-out hover:shadow-xl group flex flex-col flex-grow text-left"
      >
        <div className="relative">
          <img src={thumbnail} alt={product.title} className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-full transition-colors ${isSaved ? 'text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'}`}
              aria-label={isSaved ? 'Unsave product' : 'Save product'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate" title={product.title}>{product.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
          <p className="text-xl font-bold text-orange-600 mb-3">₦{product.price.toLocaleString?.() ?? product.price}</p>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
            <span>{product.location}</span>
            <span>{product.date}</span>
          </div>
        </div>
      </button>
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button 
            onClick={(e) => { e.stopPropagation(); onMessageSeller(product); }}
            className="w-full bg-orange-600 text-white font-semibold py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
          >
            Message Seller
          </button>
        </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Product, User } from '../types';
import { Icon } from './Icon';

interface ProductDetailPageProps {
  product: Product;
  seller: User | null;
  onClose: () => void;
  onMessageSeller: (product: Product) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product, seller, onClose, onMessageSeller, isSaved, onToggleSave
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to results
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {/* ── IMAGE SECTION (always first / top) ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-4">
          {/* Main image */}
          <div
            className="relative cursor-zoom-in bg-gray-100 dark:bg-gray-800 overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setIsLightboxOpen(true)}
          >
            {images.length > 0 ? (
              <img
                src={images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
            )}

            {/* Expand hint */}
            <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              Tap to expand
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 p-4 overflow-x-auto bg-gray-50 dark:bg-gray-800/50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === idx
                      ? 'border-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/40 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-90 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── DETAILS SECTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: title + description */}
          <div className="md:col-span-2 space-y-4">
            {/* Title card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <span className="inline-block text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 rounded-full mb-3">
                {product.category}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">{product.title}</h1>
              <p className="text-3xl font-bold text-orange-500 mt-3">₦{product.price.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {product.location} · Posted {product.date}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>

          {/* Right: seller + actions */}
          <div className="space-y-4">
            {/* Action card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 md:sticky md:top-24">
              <div className="flex gap-3">
                <button
                  onClick={() => onMessageSeller(product)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-200 dark:shadow-orange-900/30 text-sm"
                >
                  Message Seller
                </button>
                <button
                  onClick={onToggleSave}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${
                    isSaved
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-orange-500 hover:border-orange-200'
                  }`}
                >
                  <svg viewBox="0 0 24 24" strokeWidth={2} className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
              </div>

              {/* Seller info */}
              {seller && (
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seller</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={seller.profilePicture}
                      alt={seller.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-50 dark:ring-orange-900/20 flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{seller.name}</p>
                      <p className="text-xs text-gray-400">@{seller.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setIsLightboxOpen(false)}
          >
            <Icon name="close" className="w-5 h-5" />
          </button>

          <img
            src={images[selectedImageIndex]}
            alt={product.title}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setSelectedImageIndex(i => i === 0 ? images.length - 1 : i - 1); }}
              >
                <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setSelectedImageIndex(i => i === images.length - 1 ? 0 : i + 1); }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={e => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

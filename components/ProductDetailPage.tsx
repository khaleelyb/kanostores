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
  product, seller, onClose, onMessageSeller, isSaved, onToggleSave,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [];

  const rawPhone = seller?.phone?.trim() ?? '';
  const dialPhone = rawPhone.replace(/[\s\-()]/g, '');
  const waPhone = dialPhone.startsWith('+') ? dialPhone.slice(1) : dialPhone;
  const hasPhone = dialPhone.length >= 7;

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in your "${product.title}" listed on Kano Market. Is it still available?`
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors group"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to results
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        
        {/* ── IMAGE GALLERY SECTION ── */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-6 shadow-sm">
          <div className="grid grid-cols-1">
            {/* Main Image Viewport */}
            <div 
              className="relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-zoom-in overflow-hidden"
              style={{ aspectRatio: '4/3', maxHeight: '550px' }} // 4:3 is better for products than 16:9
              onClick={() => images.length > 0 && setIsLightboxOpen(true)}
            >
              {images.length > 0 ? (
                <>
                  {/* Subtle blurred background for tall/wide images */}
                  <img 
                    src={images[selectedImageIndex]} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-110 pointer-events-none"
                  />
                  {/* Main Product Image */}
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    className="relative z-10 max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                  <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p className="mt-2 font-medium">No image available</p>
                </div>
              )}

              {/* Image Counter Badge */}
              {images.length > 0 && (
                <div className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails list */}
            {images.length > 1 && (
              <div className="flex gap-3 p-4 overflow-x-auto bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImageIndex === idx
                        ? 'border-orange-500 ring-4 ring-orange-500/10 scale-95 opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  Verified Listing
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {product.title}
              </h1>
              
              <p className="text-4xl font-black text-orange-500 mt-4 tracking-tight">
                ₦{product.price.toLocaleString()}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {product.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Posted {product.date}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>

          {/* Right Column: Seller & Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sticky top-6 shadow-sm">
              <div className="space-y-3">
                {/* Contact Buttons */}
                <button
                  onClick={() => onMessageSeller(product)}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200 dark:shadow-orange-950/20"
                >
                  <Icon name="message" className="w-5 h-5" />
                  Message on App
                </button>

                {hasPhone ? (
                  <>
                    <a
                      href={`https://wa.me/${waPhone}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 dark:shadow-green-950/20"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      WhatsApp Seller
                    </a>
                    <a
                      href={`tel:${dialPhone}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-blue-950/20"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      Call Seller
                    </a>
                  </>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500">Phone contact hidden by seller</p>
                  </div>
                )}

                <button
                  onClick={onToggleSave}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${
                    isSaved
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <svg viewBox="0 0 24 24" strokeWidth={2.5} className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {isSaved ? 'Listing Saved' : 'Save for Later'}
                </button>
              </div>

              {/* Seller Profile Card */}
              {seller && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">About the Seller</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={seller.profilePicture}
                      alt={seller.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-4 ring-gray-50 dark:ring-gray-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white truncate leading-tight">{seller.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">@{seller.username}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">5.0 Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox - Fullscreen View */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-[110]"
            onClick={() => setIsLightboxOpen(false)}
          >
            <Icon name="close" className="w-6 h-6" />
          </button>

          <img
            src={images[selectedImageIndex]}
            alt={product.title}
            className="max-w-full max-h-[90vh] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                onClick={e => { e.stopPropagation(); setSelectedImageIndex(i => i === 0 ? images.length - 1 : i - 1); }}
              >
                <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                onClick={e => { e.stopPropagation(); setSelectedImageIndex(i => i === images.length - 1 ? 0 : i + 1); }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={e => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                    className={`h-1.5 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-white w-8' : 'bg-white/30 w-2'}`}
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

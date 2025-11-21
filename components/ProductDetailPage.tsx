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

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, seller, onClose, onMessageSeller, isSaved, onToggleSave }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [product.image]; // Fallback for legacy data if needed, though type says string[]
  
  const handleImageClick = () => {
      setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
      setIsLightboxOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button onClick={onClose} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 font-semibold mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span>Back to results</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Image Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Main Image */}
              <div className="relative h-96 cursor-pointer group" onClick={handleImageClick}>
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Icon name="plus" className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                  <div className="flex p-4 space-x-4 overflow-x-auto">
                      {images.map((img: string, idx: number) => (
                          <button 
                            key={idx} 
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-orange-600 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          >
                              <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                      ))}
                  </div>
              )}
            </div>
          </div>

          {/* Details & Seller Column */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-24">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category}</p>
              <p className="text-4xl font-bold text-orange-600 my-4">₦{product.price.toLocaleString()}</p>
              
              <div className="flex space-x-2 my-6">
                <button 
                  onClick={() => onMessageSeller(product)}
                  className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Message Seller
                </button>
                <button
                  onClick={onToggleSave}
                  className={`p-3 rounded-lg transition-colors ${isSaved ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                  aria-label={isSaved ? 'Unsave product' : 'Save product'}
                >
                  <Icon name="heart" className="w-6 h-6" />
                </button>
              </div>

              {/* Seller Info */}
              {seller && (
                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Seller Information</h2>
                  <div className="flex items-center space-x-4">
                    <img src={seller.profilePicture} alt={seller.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{seller.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Member since 2024</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Description</h2>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {product.description}
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-6 pt-4 border-t dark:border-gray-700">
                <span>Location: {product.location}</span>
                <span>Posted: {product.date}</span>
            </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={closeLightbox}>
            <Icon name="close" className="w-8 h-8" />
          </button>
          <img 
            src={images[selectedImageIndex]} 
            alt={product.title} 
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()} 
          />
           {images.length > 1 && (
             <>
                <button 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full hover:bg-white/40 text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 rotate-180">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full hover:bg-white/40 text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
             </>
           )}
        </div>
      )}
    </div>
  );
};

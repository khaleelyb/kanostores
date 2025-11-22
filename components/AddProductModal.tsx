import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import { Icon } from './Icon';
import { compressImage } from '../utils/imageUtils';
import { CameraCapture } from './CameraCapture';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (productData: Omit<Product, 'id' | 'sellerId' | 'location' | 'date'>) => void;
  onUpdateProduct: (productData: Product) => void;
  productToEdit: Product | null;
}

type Mode = 'select-method' | 'form';

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct, onUpdateProduct, productToEdit }) => {
  const [mode, setMode] = useState<Mode>('select-method');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setMode('form');
        setTitle(productToEdit.title);
        setCategory(productToEdit.category);
        setPrice(String(productToEdit.price));
        setDescription(productToEdit.description);
        setImages(productToEdit.images || []);
      } else {
        setMode('select-method');
        resetForm();
      }
    }
  }, [isOpen, productToEdit]);

  const resetForm = () => {
    setTitle('');
    setCategory(CATEGORIES[0]);
    setPrice('');
    setDescription('');
    setImages([]);
    setIsProcessing(false);
    setIsCameraOpen(false);
  };

  const processFile = async (file: File) => {
    if (images.length >= 3) {
        alert('You can only upload up to 3 images.');
        return;
    }
    try {
        setIsProcessing(true);
        const compressedBase64 = await compressImage(file);
        setImages(prev => [...prev, compressedBase64]);
        setMode('form');
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try another one.');
    } finally {
        setIsProcessing(false);
        if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        processFile(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setIsCameraOpen(false);
    processFile(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    resetForm();
    setMode('select-method');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category || !description || images.length === 0) {
      alert('Please fill all fields and provide at least one image.');
      return;
    }
    
    if (isEditMode) {
        const updatedProduct: Product = {
            ...productToEdit,
            title,
            category,
            price: Number(price),
            description,
            images,
        };
        onUpdateProduct(updatedProduct);
    } else {
        const newProductData = {
            title,
            category,
            price: Number(price),
            description,
            images,
        };
        onAddProduct(newProductData);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex justify-center items-center p-4">
      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 relative">
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <Icon name="close" className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            {isEditMode ? 'Edit Your Ad' : 'Post a New Ad'}
          </h2>

          {mode === 'select-method' ? (
            <div className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors group disabled:opacity-50"
                >
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 text-orange-600 group-hover:scale-110 transition-transform">
                     <Icon name="camera" className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Take a Photo</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Use your camera to capture the product</p>
                </button>

                <button 
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group disabled:opacity-50"
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                     <Icon name="image" className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload from Gallery</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Choose an existing photo from your device</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    ref={uploadInputRef}
                    onChange={handleImageChange}
                  />
                </button>
              </div>

              {/* Back/Cancel Button for Select Method if images already exist */}
              {images.length > 0 && (
                  <div className="mt-6 flex justify-center">
                      <button 
                        onClick={() => setMode('form')}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                        Cancel adding photo
                      </button>
                  </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images ({images.length}/3)</label>
                
                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                            >
                                <Icon name="close" className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    
                    {images.length < 3 && (
                        <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => setMode('select-method')}>
                             {isProcessing ? (
                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                             ) : (
                                 <>
                                    <Icon name="plus" className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Add Photo</span>
                                 </>
                             )}
                        </div>
                    )}
                </div>

              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Title</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" required placeholder="What are you selling?" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (₦)</label>
                  <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" required placeholder="0.00" />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" placeholder="Describe your item..." required></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-orange-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                  {isEditMode ? 'Save Changes' : 'Post Ad'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

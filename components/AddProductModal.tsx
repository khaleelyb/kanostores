import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import { Icon } from './Icon';
import { compressImage } from '../utils/imageUtils';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (productData: Omit<Product, 'id' | 'sellerId' | 'location' | 'date'>) => void;
  onUpdateProduct: (productData: Product) => void;
  productToEdit: Product | null;
}

type Mode = 'select-method' | 'form';

// ── Category-specific spec templates ─────────────────────────────────────────
interface SpecChips {
  condition?: string[];
  ram?: string[];
  storage?: string[];
  brand?: string[];
  extra?: { label: string; values: string[] }[];
}

const CATEGORY_TEMPLATES: Record<string, { template: string; chips: SpecChips }> = {
  'Mobile Phones & Tablets': {
    template: `Brand: \nModel: \nRAM: \nStorage: \nCondition: \nBattery health: \nColor: \nAccessories included: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New'],
      ram: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'],
      storage: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
      brand: ['Samsung', 'iPhone', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'OnePlus', 'Huawei'],
    },
  },
  'Computers': {
    template: `Brand: \nModel: \nProcessor: \nRAM: \nStorage: \nScreen size: \nCondition: \nOS installed: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New'],
      ram: ['2GB', '4GB', '8GB', '16GB', '32GB'],
      storage: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB HDD', '1TB SSD', '2TB HDD'],
      brand: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Toshiba'],
    },
  },
  'Electronics': {
    template: `Brand: \nModel: \nCondition: \nAge: \nFaults (if any): \nAccessories included: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New'],
      brand: ['Samsung', 'LG', 'Sony', 'Hisense', 'Syinix', 'Polystar'],
    },
  },
  'Home, Furniture & Appliances': {
    template: `Item: \nBrand: \nCondition: \nDimensions: \nColor: \nFaults (if any): \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New'],
    },
  },
  'Cars': {
    template: `Make: \nModel: \nYear: \nCondition: \nMileage: \nColor: \nEngine size: \nTransmission: \nFuel type: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Nigerian Used', 'Foreign Used'],
      extra: [
        { label: 'Transmission', values: ['Manual', 'Automatic'] },
        { label: 'Fuel', values: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
      ],
    },
  },
  'Vehicles': {
    template: `Type: \nMake/Brand: \nYear: \nCondition: \nColor: \nFaults (if any): \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Nigerian Used', 'Foreign Used'],
    },
  },
  'Houses': {
    template: `Type: \nBedrooms: \nBathrooms: \nLocation: \nListing type: \nFurnished: \nFeatures: \nExtra notes: `,
    chips: {
      extra: [
        { label: 'Type', values: ['For Rent', 'For Sale', 'Short Let'] },
        { label: 'Furnished', values: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
      ],
    },
  },
  'Property': {
    template: `Property type: \nLocation: \nSize: \nListing type: \nTitle document: \nExtra notes: `,
    chips: {
      extra: [
        { label: 'Type', values: ['For Rent', 'For Sale', 'Joint Venture'] },
        { label: 'Title', values: ['C of O', 'R of O', 'Deed', 'Gazette'] },
      ],
    },
  },
  'Women clothes': {
    template: `Item type: \nBrand: \nSize: \nColor: \nCondition: \nMaterial: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
      extra: [{ label: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] }],
    },
  },
  'Men clothes': {
    template: `Item type: \nBrand: \nSize: \nColor: \nCondition: \nMaterial: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
      extra: [{ label: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] }],
    },
  },
  'Men shoes': {
    template: `Brand: \nSize: \nColor: \nCondition: \nStyle: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
      extra: [{ label: 'Size', values: ['39', '40', '41', '42', '43', '44', '45', '46'] }],
    },
  },
  'Women shoes': {
    template: `Brand: \nSize: \nColor: \nCondition: \nStyle: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
      extra: [{ label: 'Size', values: ['36', '37', '38', '39', '40', '41', '42'] }],
    },
  },
  'Herbals and supplements': {
    template: `Product name: \nBrand: \nQuantity/Weight: \nExpiry date: \nBenefits: \nUsage instructions: `,
    chips: {},
  },
  'Health & Medicine': {
    template: `Product name: \nBrand: \nQuantity: \nExpiry date: \nPrescription required: \nExtra notes: `,
    chips: {
      extra: [{ label: 'Prescription', values: ['No prescription needed', 'Prescription required'] }],
    },
  },
  'Beauty & Personal Care': {
    template: `Product name: \nBrand: \nQuantity/Size: \nSkin type: \nExpiry date: \nExtra notes: `,
    chips: {
      extra: [{ label: 'Skin type', values: ['All skin types', 'Oily skin', 'Dry skin', 'Sensitive'] }],
    },
  },
  'Body care, soaps and perfumes': {
    template: `Product name: \nBrand: \nScent/Type: \nSize/Weight: \nExpiry date: \nExtra notes: `,
    chips: {},
  },
  'Accesories and chargers': {
    template: `Item: \nCompatible with: \nCondition: \nBrand: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
    },
  },
  'vehicle parts and accesories': {
    template: `Part name: \nCompatible vehicle: \nBrand: \nCondition: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Nigerian Used', 'Foreign Used'],
    },
  },
  'Gym equipments': {
    template: `Equipment: \nBrand: \nCondition: \nWeight/Size: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
    },
  },
  'Babies & Kids': {
    template: `Item: \nAge range: \nBrand: \nCondition: \nColor: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
    },
  },
  'Books': {
    template: `Title: \nAuthor: \nCondition: \nEdition: \nExtra notes: `,
    chips: {
      condition: ['Brand New', 'Like New', 'Good Used'],
    },
  },
  'Services': {
    template: `Service offered: \nExperience: \nAvailability: \nLocation/Coverage area: \nExtra notes: `,
    chips: {},
  },
  'Jobs': {
    template: `Job title: \nCompany: \nLocation: \nJob type: \nSalary range: \nRequirements: `,
    chips: {
      extra: [{ label: 'Job type', values: ['Full-time', 'Part-time', 'Contract', 'Remote'] }],
    },
  },
  'Animals & Pets': {
    template: `Animal type: \nBreed: \nAge: \nGender: \nVaccinated: \nCondition: \nExtra notes: `,
    chips: {
      extra: [
        { label: 'Gender', values: ['Male', 'Female'] },
        { label: 'Vaccinated', values: ['Yes', 'No'] },
      ],
    },
  },
};

// ── Chip group component ──────────────────────────────────────────────────────
const ChipGroup: React.FC<{
  label: string;
  values: string[];
  onSelect: (val: string) => void;
}> = ({ label, values, onSelect }) => (
  <div className="mb-2">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {values.map(val => (
        <button
          key={val}
          type="button"
          onClick={() => onSelect(val)}
          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:border-orange-300 active:scale-95 transition-all duration-150"
        >
          {val}
        </button>
      ))}
    </div>
  </div>
);

// ── Insert chip value into description at the right field line ────────────────
const insertIntoDescription = (
  description: string,
  chipValue: string,
  fieldLabel: string
): string => {
  const lines = description.split('\n');
  const labelLower = fieldLabel.toLowerCase();

  // Map of chip group label → which description field lines to target
  const fieldMap: Record<string, string[]> = {
    condition: ['condition'],
    ram: ['ram'],
    storage: ['storage'],
    brand: ['brand', 'make'],
    transmission: ['transmission'],
    fuel: ['fuel type'],
    furnished: ['furnished'],
    type: ['listing type', 'property type', 'job type', 'type'],
    title: ['title document'],
    prescription: ['prescription required'],
    'skin type': ['skin type'],
    gender: ['gender'],
    vaccinated: ['vaccinated'],
    size: ['size'],
  };

  const targets = fieldMap[labelLower] || [labelLower];

  const updated = lines.map(line => {
    const lineLower = line.toLowerCase();
    const matchesTarget = targets.some(t => lineLower.startsWith(t + ':'));
    if (matchesTarget) {
      const colonIdx = line.indexOf(':');
      return line.slice(0, colonIdx + 1) + ' ' + chipValue;
    }
    return line;
  });

  return updated.join('\n');
};

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateProduct,
  productToEdit,
}) => {
  const [mode, setMode] = useState<Mode>('select-method');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(() => {
    const saved = localStorage.getItem('kano-last-category');
    return saved && CATEGORIES.includes(saved) ? saved : CATEGORIES[0];
  });
  const [price, setPrice] = useState('');
  const numericPrice = Number(price || 0);
  const gatewayCharge = numericPrice > 0 ? numericPrice * 0.04 : 0;
  const finalListingPrice = numericPrice > 0 ? Math.ceil(numericPrice + gatewayCharge) : 0;
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [stock, setStock] = useState<string>('');
const [deliveryAvailable, setDeliveryAvailable] = useState(false);
const [deliveryPrice, setDeliveryPrice] = useState('');
const [deliveryAreas, setDeliveryAreas] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = !!productToEdit;
  const templateData = CATEGORY_TEMPLATES[category];
  const hasChips = templateData && (
    templateData.chips.condition ||
    templateData.chips.ram ||
    templateData.chips.storage ||
    templateData.chips.brand ||
    templateData.chips.extra?.length
  );

  // ── When category changes, auto-fill description template (new ads only) ──
  useEffect(() => {
    if (!isEditMode && mode === 'form') {
      const tmpl = CATEGORY_TEMPLATES[category];
      if (tmpl) {
        // Only replace if description is empty or was a template (not custom text)
        const currentLines = description.split('\n');
        const looksLikeTemplate = currentLines.every(
          l => l === '' || l.includes(': ') || l.endsWith(':')
        );
        if (!description || looksLikeTemplate) {
          setDescription(tmpl.template);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode]);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setMode('form');
        setTitle(productToEdit.title);
        setCategory(productToEdit.category);
        setPrice(String(productToEdit.price));
        setDescription(productToEdit.description);
        setImages(productToEdit.images || []);
        setStock(productToEdit.stock != null ? String(productToEdit.stock) : '');
setDeliveryAvailable(productToEdit.deliveryAvailable ?? false);
setDeliveryPrice(productToEdit.deliveryPrice ? String(productToEdit.deliveryPrice) : '');
setDeliveryAreas(productToEdit.deliveryAreas ?? '');
      } else {
        setMode('select-method');
        resetForm();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productToEdit]);

  const resetForm = () => {
    const savedCategory = localStorage.getItem('kano-last-category');
    const cat = savedCategory && CATEGORIES.includes(savedCategory) ? savedCategory : CATEGORIES[0];
    setTitle('');
    setCategory(cat);
    setPrice('');
    setDescription(CATEGORY_TEMPLATES[cat]?.template || '');
    setImages([]);
    setIsProcessing(false);
    setShowChips(true);
    setStock('');
setDeliveryAvailable(false);
setDeliveryPrice('');
setDeliveryAreas('');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (uploadInputRef.current) uploadInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    resetForm();
    setMode('select-method');
    onClose();
  };

  // ── Chip tap handler ───────────────────────────────────────────────────────
  const handleChipSelect = (chipValue: string, fieldLabel: string) => {
    setDescription(prev => insertIntoDescription(prev, chipValue, fieldLabel));
    // Brief focus back to textarea
    setTimeout(() => descriptionRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category || !description || images.length === 0) {
      alert('Please fill all fields and provide at least one image.');
      return;
    }
    localStorage.setItem('kano-last-category', category);
    if (isEditMode) {
  onUpdateProduct({ 
    ...productToEdit, title, category, price: finalListingPrice, description, images,
    stock: stock !== '' ? Number(stock) : null,
    deliveryAvailable,
    deliveryPrice: Number(deliveryPrice) || 0,
    deliveryAreas,
  });
} else {
  onAddProduct({ 
    title, category, price: finalListingPrice, description, images,
    stock: stock !== '' ? Number(stock) : null,
    deliveryAvailable,
    deliveryPrice: Number(deliveryPrice) || 0,
    deliveryAreas,
  });
}
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            {isEditMode ? 'Edit Your Ad' : 'Post a New Ad'}
          </h2>

          {/* ── SELECT METHOD ── */}
          {mode === 'select-method' ? (
            <div className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors group disabled:opacity-50"
                >
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 text-orange-600 group-hover:scale-110 transition-transform">
                    <Icon name="camera" className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Take a Photo</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Use your camera to capture the product</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={cameraInputRef}
                    onChange={handleImageChange}
                  />
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
            /* ── FORM ── */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Images ({images.length}/3)
                </label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
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
                    <div
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => setMode('select-method')}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
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

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200"
                  required
                  placeholder="What are you selling?"
                />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200"
                    required
                    placeholder="0.00"
                  />
                  {numericPrice > 0 && (
                    <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-lg px-2.5 py-2 text-amber-700 dark:text-amber-300 space-y-0.5">
                      <p>You entered: ₦{numericPrice.toLocaleString()}</p>
                      <p>Gateway charge (5%): ₦{Math.ceil(gatewayCharge).toLocaleString()}</p>
                      <p className="font-semibold">Final listing price shown to buyers: ₦{finalListingPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock & Delivery */}
<div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock & Delivery</p>

  {/* Stock */}
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Stock quantity <span className="text-xs font-normal text-gray-400">(optional — leave blank for unlimited)</span>
    </label>
    <input
      type="number"
      min="0"
      value={stock}
      onChange={e => setStock(e.target.value)}
      placeholder="e.g. 10"
      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
    />
  </div>

  {/* Delivery toggle */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery available</p>
      <p className="text-xs text-gray-400">Can you deliver this item to buyers?</p>
    </div>
    <button
      type="button"
      onClick={() => setDeliveryAvailable(v => !v)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        deliveryAvailable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        deliveryAvailable ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>

  {/* Delivery details — only show if delivery is on */}
  {deliveryAvailable && (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Delivery fee (₦) <span className="text-xs font-normal text-gray-400">(enter 0 for free)</span>
        </label>
        <input
          type="number"
          min="0"
          value={deliveryPrice}
          onChange={e => setDeliveryPrice(e.target.value)}
          placeholder="e.g. 500"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Delivery areas
        </label>
        <input
          type="text"
          value={deliveryAreas}
          onChange={e => setDeliveryAreas(e.target.value)}
          placeholder="e.g. badawa area,farm center area ,kofar nassarawa"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
    </>
  )}
</div>
              {/* ── Quick-Tap Spec Chips ── */}
              {hasChips && (
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/40 rounded-xl p-3">
                  <button
                    type="button"
                    onClick={() => setShowChips(v => !v)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Quick fill — tap to add specs</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-orange-400 transition-transform duration-200 ${showChips ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showChips && (
                    <div className="space-y-1">
                      {templateData.chips.condition && (
                        <ChipGroup
                          label="Condition"
                          values={templateData.chips.condition}
                          onSelect={v => handleChipSelect(v, 'condition')}
                        />
                      )}
                      {templateData.chips.brand && (
                        <ChipGroup
                          label="Brand"
                          values={templateData.chips.brand}
                          onSelect={v => handleChipSelect(v, 'brand')}
                        />
                      )}
                      {templateData.chips.ram && (
                        <ChipGroup
                          label="RAM"
                          values={templateData.chips.ram}
                          onSelect={v => handleChipSelect(v, 'ram')}
                        />
                      )}
                      {templateData.chips.storage && (
                        <ChipGroup
                          label="Storage"
                          values={templateData.chips.storage}
                          onSelect={v => handleChipSelect(v, 'storage')}
                        />
                      )}
                      {templateData.chips.extra?.map(group => (
                        <ChipGroup
                          key={group.label}
                          label={group.label}
                          values={group.values}
                          onSelect={v => handleChipSelect(v, group.label)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  {templateData && !isEditMode && (
                    <button
                      type="button"
                      onClick={() => setDescription(templateData.template)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Reset template
                    </button>
                  )}
                </div>
                <textarea
                  id="description"
                  ref={descriptionRef}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={7}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200 font-mono text-sm leading-relaxed"
                  placeholder="Describe your item..."
                  required
                />
                {templateData && !isEditMode && (
                  <p className="mt-1 text-xs text-gray-400">
                    💡 Fill in the fields above, then tap chips to auto-fill specs
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
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

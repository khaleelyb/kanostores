import React from 'react';
import { CartItem, Product } from '../types';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  currentUser: import('../types').User | null;
  onLoginClick: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onSelectProduct, currentUser, onLoginClick,
}) => {
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400">Browse products and tap "Add to Cart" to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cart</h1>
        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {cartItems.map(({ product, quantity }) => (
          <div key={product.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onSelectProduct(product)} className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                  }
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => onSelectProduct(product)} className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{product.title}</p>
                  <span className="inline-block text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full font-medium mt-1">{product.category}</span>
                </button>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  ₦{(product.price * quantity).toLocaleString()}
                  {quantity > 1 && (
                    <span className="text-xs font-normal text-gray-400 ml-1">(₦{product.price.toLocaleString()} each)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
              <span className="text-xs text-gray-400 font-medium">Qty</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >−</button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[20px] text-center">{quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 transition-colors"
                >+</button>
              </div>
              <button
                onClick={() => onRemoveItem(product.id)}
                className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors border border-red-100 dark:border-red-800"
              >Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4">Order summary</h2>
        <div className="space-y-2 mb-4">
          {cartItems.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 truncate max-w-[240px]">{product.title} × {quantity}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium ml-2">₦{(product.price * quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
          <span className="font-bold text-orange-500 text-xl">₦{total.toLocaleString()}</span>
        </div>
        <div className="mt-4 space-y-2">
          {cartItems.map(({ product, quantity }) => (
            <button
              key={product.id}
              onClick={() => currentUser ? onCheckout(product) : onLoginClick()}
              className="w-full flex items-center justify-between gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-green-200 dark:shadow-green-900/30 text-sm"
            >
              <span className="truncate">{product.title}</span>
              <span className="flex-shrink-0">₦{(product.price * quantity).toLocaleString()} →</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">Each item is checked out separately via secure payment</p>
      </div>
    </div>
  );
};

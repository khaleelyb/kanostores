import React, { useState, useEffect } from 'react';
import { CartItem, Product, User } from '../types';
import { supabase } from '../services/supabase_client';

interface Order {
  id: string;
  productTitle: string;
  amount: number;
  currency: string;
  status: string;
  buyerName: string | null;
  buyerAddress: string | null;
  createdAt: string;
  productId: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  processing: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  success:    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  failed:     'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800',
  shipped:    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  delivered:  'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', success: 'Paid',
  failed: 'Failed', shipped: 'Shipped', delivered: 'Delivered',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  currentUser: User | null;
  onLoginClick: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onSelectProduct, currentUser, onLoginClick,
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (activeTab === 'orders' && currentUser) {
      setOrdersLoading(true);
      supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', currentUser.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setOrders(data.map((o: any) => ({
              id: o.id,
              productTitle: o.product_title,
              amount: o.amount,
              currency: o.currency ?? 'NGN',
              status: o.status,
              buyerName: o.buyer_name ?? null,
              buyerAddress: o.buyer_address ?? null,
              createdAt: o.created_at,
              productId: o.product_id ?? null,
            })));
          }
          setOrdersLoading(false);
        });
    }
  }, [activeTab, currentUser]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header + Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('cart')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'cart'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.875-7.16a60.077 60.077 0 0 0-16.836-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Cart
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
          Order History
        </button>
      </div>

      {/* ── CART TAB ── */}
      {activeTab === 'cart' && (
        <>
          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 dark:text-gray-400">Browse products and tap "Add to Cart" to get started.</p>
            </div>
          ) : (
            <>
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
                          {quantity > 1 && <span className="text-xs font-normal text-gray-400 ml-1">(₦{product.price.toLocaleString()} each)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                      <span className="text-xs text-gray-400 font-medium">Qty</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onUpdateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">−</button>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[20px] text-center">{quantity}</span>
                        <button onClick={() => onUpdateQuantity(product.id, quantity + 1)} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-base font-medium hover:bg-gray-100 transition-colors">+</button>
                      </div>
                      <button onClick={() => onRemoveItem(product.id)} className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors border border-red-100 dark:border-red-800">Remove</button>
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
            </>
          )}
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No orders yet</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your completed purchases will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{order.productTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-orange-500 text-base">₦{order.amount.toLocaleString()}</p>
                      <div className="mt-1">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="flex items-center gap-1 mt-3">
                    {['success', 'shipped', 'delivered'].map((s, i) => {
                      const statuses = ['success', 'shipped', 'delivered'];
                      const currentIdx = statuses.indexOf(order.status);
                      const stepIdx = i;
                      const isDone = currentIdx >= stepIdx;
                      const isCurrent = currentIdx === stepIdx;
                      const labels = ['Paid', 'Shipped', 'Delivered'];
                      return (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isDone
                                ? isCurrent
                                  ? 'bg-orange-500 ring-2 ring-orange-200 dark:ring-orange-900/50'
                                  : 'bg-green-500'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {isDone && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-[10px] font-medium ${isDone ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>{labels[i]}</span>
                          </div>
                          {i < 2 && (
                            <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all ${
                              currentIdx > stepIdx ? 'bg-green-400' : 'bg-gray-100 dark:bg-gray-800'
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Show failed/pending state */}
                  {(order.status === 'failed' || order.status === 'pending' || order.status === 'processing') && (
                    <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium ${
                      order.status === 'failed'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {order.status === 'failed' ? '⚠️ Payment failed — please try again' : '⏳ Awaiting payment confirmation'}
                    </div>
                  )}

                  {order.buyerAddress && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-start gap-1.5 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>{order.buyerAddress}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

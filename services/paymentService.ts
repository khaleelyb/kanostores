// services/paymentService.ts
import { supabase } from './supabase_client';

export interface InitiatePaymentParams {
  productId: string;
  productTitle: string;
  amount: number;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
}

// NEW: multi-item version
export interface InitiateCartPaymentParams {
  sellerId: string;
  items: { productId: string; productTitle: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
}

export interface PaymentInitResult {
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
  customer: { name: string; email: string };
  productTitle: string;
}

// Single product payment (used from ProductDetailPage)
export const initiatePayment = async (
  params: InitiatePaymentParams
): Promise<PaymentInitResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('korapay-charge', {
      body: params,
    });
    if (error) { console.error('initiatePayment error:', error); return null; }
    return data as PaymentInitResult;
  } catch (err) { console.error('initiatePayment unexpected error:', err); return null; }
};

// Multi-item cart payment grouped by seller
export const initiateCartPayment = async (
  params: InitiateCartPaymentParams
): Promise<PaymentInitResult | null> => {
  try {
    // Build a combined title like "3 items from seller"
    const productTitle = params.items.length === 1
      ? `${params.items[0].productTitle}${params.items[0].quantity > 1 ? ` ×${params.items[0].quantity}` : ''}`
      : `${params.items.length} items (cart order)`;

    // Re-use the same edge function — pass the first productId as the primary
    // and include itemsJson for the order record
    const { data, error } = await supabase.functions.invoke('korapay-charge', {
      body: {
        productId: params.items[0].productId,
        productTitle,
        amount: params.totalAmount,
        buyerId: params.buyerId,
        buyerName: params.buyerName,
        buyerEmail: params.buyerEmail,
        buyerPhone: params.buyerPhone,
        buyerAddress: params.buyerAddress,
        // extra metadata stored in the order
        sellerId: params.sellerId,
        cartItems: params.items,
      },
    });
    if (error) { console.error('initiateCartPayment error:', error); return null; }
    return data as PaymentInitResult;
  } catch (err) { console.error('initiateCartPayment unexpected error:', err); return null; }
};

export const verifyPayment = async (
  reference: string
): Promise<{ status: string; transactionRef?: string } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('korapay-verify', {
      body: { reference },
    });
    if (error) { console.error('verifyPayment error:', error); return null; }
    return data;
  } catch (err) { console.error('verifyPayment unexpected error:', err); return null; }
};

export const getBuyerOrders = async (buyerId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getBuyerOrders error:', error); return []; }
  return data ?? [];
};

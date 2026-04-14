// services/paymentService.ts
import { supabase } from './supabase_client';

export interface InitiatePaymentParams {
  productId: string;
  productTitle: string;
  amount: number;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;    // NEW
  buyerAddress: string;  // NEW
}

export interface PaymentInitResult {
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
  customer: { name: string; email: string };
  productTitle: string;
}

// Calls the Edge Function to create a pending order + get a KoraPay reference
export const initiatePayment = async (
  params: InitiatePaymentParams
): Promise<PaymentInitResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('korapay-charge', {
      body: params,
    });
    if (error) {
      console.error('initiatePayment error:', error);
      return null;
    }
    return data as PaymentInitResult;
  } catch (err) {
    console.error('initiatePayment unexpected error:', err);
    return null;
  }
};

// Calls the Edge Function to verify payment status after KoraPay completes
export const verifyPayment = async (
  reference: string
): Promise<{ status: string; transactionRef?: string } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('korapay-verify', {
      body: { reference },
    });
    if (error) {
      console.error('verifyPayment error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('verifyPayment unexpected error:', err);
    return null;
  }
};

// Fetch all orders for a buyer from Supabase directly
export const getBuyerOrders = async (buyerId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getBuyerOrders error:', error);
    return [];
  }
  return data ?? [];
};

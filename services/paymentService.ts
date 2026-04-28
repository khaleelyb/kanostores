// services/paymentService.ts
import { supabase } from './supabase_client';

export interface InitiatePaymentParams {
  productId: string;
  productTitle: string;
  amount: number; // in NGN
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerId?: string;
}

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
  amount: number;       // in kobo (× 100)
  currency: string;
  email: string;
  productTitle: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique payment reference */
const makeReference = () =>
  `KS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/** Create an order row and return the Paystack-ready payload */
const createOrderAndBuildPayload = async (
  params: {
    productId: string;
    productTitle: string;
    amount: number;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    buyerAddress: string;
    sellerId?: string;
  }
): Promise<PaymentInitResult | null> => {
  try {
    const reference = makeReference();

    const { data, error } = await supabase.from('orders').insert({
      buyer_id: params.buyerId,
      seller_id: params.sellerId ?? null,
      product_id: params.productId,
      product_title: params.productTitle,
      amount: params.amount,
      currency: 'NGN',
      status: 'pending',
      korapay_reference: reference, // reusing column name — just stores payment ref
      buyer_email: params.buyerEmail,
      buyer_name: params.buyerName,
      buyer_phone: params.buyerPhone,
      buyer_address: params.buyerAddress,
    }).select().single();

    if (error) throw error;

    return {
      reference,
      orderId: data.id,
      amount: params.amount * 100, // Paystack expects kobo
      currency: 'NGN',
      email: params.buyerEmail,
      productTitle: params.productTitle,
    };
  } catch (e) {
    console.error('createOrderAndBuildPayload:', e);
    return null;
  }
};

// ── Single product payment ────────────────────────────────────────────────────
export const initiatePayment = async (
  params: InitiatePaymentParams
): Promise<PaymentInitResult | null> => {
  // Look up sellerId from the product if not provided
  let sellerId = params.sellerId;
  if (!sellerId) {
    const { data } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', params.productId)
      .single();
    sellerId = data?.seller_id ?? undefined;
  }

  return createOrderAndBuildPayload({ ...params, sellerId });
};

// ── Cart payment (grouped by seller) ─────────────────────────────────────────
export const initiateCartPayment = async (
  params: InitiateCartPaymentParams
): Promise<PaymentInitResult | null> => {
  const productTitle =
    params.items.length === 1
      ? `${params.items[0].productTitle}${params.items[0].quantity > 1 ? ` ×${params.items[0].quantity}` : ''}`
      : `${params.items.length} items (cart order)`;

  return createOrderAndBuildPayload({
    productId: params.items[0].productId,
    productTitle,
    amount: params.totalAmount,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerPhone: params.buyerPhone,
    buyerAddress: params.buyerAddress,
    sellerId: params.sellerId,
  });
};

// ── Verify payment (mark order as success) ───────────────────────────────────
export const verifyPayment = async (reference: string): Promise<{ status: string } | null> => {
  try {
    // Get order to find product
    const { data: order } = await supabase
      .from('orders')
      .select('product_id')
      .eq('korapay_reference', reference)
      .single();

    // Mark paid
    const { error } = await supabase
      .from('orders')
      .update({ status: 'success' })
      .eq('korapay_reference', reference);
    if (error) throw error;

    // Decrement stock if product has stock tracking
    if (order?.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', order.product_id)
        .single();

      if (product?.stock != null && product.stock > 0) {
        await supabase
          .from('products')
          .update({ stock: product.stock - 1 })
          .eq('id', order.product_id);
      }
    }

    return { status: 'success' };
  } catch (e) {
    console.error('verifyPayment:', e);
    return null;
  }
};



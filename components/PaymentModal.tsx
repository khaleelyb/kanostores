// components/PaymentModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Product, User } from '../types';
import { initiatePayment, verifyPayment } from '../services/paymentService';
import { Icon } from './Icon';

// KoraPay public key — safe to expose on frontend (test key shown here)
// Replace with your real test/live public key from your KoraPay dashboard
const KORAPAY_PUBLIC_KEY = import.meta.env.VITE_KORAPAY_PUBLIC_KEY ?? 'pk_test_xxxxxxxxxxxx';

// Declare KoraPay on window so TypeScript doesn't complain
declare global {
  interface Window {
    Korapay?: {
      initialize: (config: object) => void;
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  currentUser: User;
  onPaymentSuccess: (reference: string) => void;
}

type Step = 'email' | 'processing' | 'success' | 'failed';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  product,
  currentUser,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successRef, setSuccessRef] = useState('');
  const scriptLoaded = useRef(false);

  // Load KoraPay script once
  useEffect(() => {
    if (scriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
    script.async = true;
    script.onload = () => { scriptLoaded.current = true; };
    document.body.appendChild(script);
    return () => { /* leave script in DOM — safe to reuse */ };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => { setStep('email'); setErrorMsg(''); setEmail(''); }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStep('processing');
    setErrorMsg('');

    // Step 1: Create a pending order via Edge Function
    const result = await initiatePayment({
      productId: product.id,
      productTitle: product.title,
      amount: product.price,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerEmail: email,
    });

    if (!result) {
      setErrorMsg('Could not initialize payment. Please try again.');
      setStep('email');
      return;
    }

    // Step 2: Wait for KoraPay script to be available
    let attempts = 0;
    while (!window.Korapay && attempts < 20) {
      await new Promise(r => setTimeout(r, 150));
      attempts++;
    }

    if (!window.Korapay) {
      setErrorMsg('Payment script failed to load. Please refresh and try again.');
      setStep('email');
      return;
    }

    setStep('processing');

    // Step 3: Open KoraPay Checkout Standard
    window.Korapay.initialize({
      key: KORAPAY_PUBLIC_KEY,
      reference: result.reference,
      amount: result.amount,
      currency: result.currency,
      customer: result.customer,
      narration: `Payment for "${result.productTitle}" on Kano Market`,
      onClose: () => {
        // User dismissed the modal — go back to email step
        setStep('email');
      },
      onSuccess: async (data: { reference: string }) => {
        // Step 4: Verify on server
        const verification = await verifyPayment(data.reference);
        if (verification?.status === 'success') {
          setSuccessRef(data.reference);
          setStep('success');
          onPaymentSuccess(data.reference);
        } else {
          setStep('failed');
        }
      },
      onFailed: () => {
        setStep('failed');
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Complete Purchase</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'processing'}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary strip */}
        <div className="flex items-center gap-3 px-6 py-3 bg-orange-50 dark:bg-orange-900/10">
          {product.images?.[0] && (
            <img src={product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.title}</p>
            <p className="text-xs text-gray-400">{product.location}</p>
          </div>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400 flex-shrink-0">
            ₦{product.price.toLocaleString()}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Email step ── */}
          {step === 'email' && (
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Your Email
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(for payment receipt)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  required
                  autoFocus
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-orange-200 dark:shadow-orange-900/30"
              >
                Pay ₦{product.price.toLocaleString()}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Secured by{' '}
                <span className="font-semibold text-gray-600 dark:text-gray-400">KoraPay</span>
                {' '}· Cards, Bank Transfer & More
              </p>
            </form>
          )}

          {/* ── Processing step ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Opening payment window…</p>
                <p className="text-sm text-gray-400 mt-1">Complete your payment in the KoraPay window</p>
              </div>
            </div>
          )}

          {/* ── Success step ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white text-lg">Payment Successful!</p>
                <p className="text-sm text-gray-400 mt-1">Your order has been placed.</p>
                {successRef && (
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-2 font-mono break-all">{successRef}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-2.5 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Failed step ── */}
          {step === 'failed' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white text-lg">Payment Failed</p>
                <p className="text-sm text-gray-400 mt-1">Something went wrong. Please try again.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('email')}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';

interface HelpSupportPageProps {
  onClose: () => void;
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
}

const ADMIN_EMAIL = 'kanostoreng@gmail.com';
const ADMIN_WHATSAPP = '+2347067703769';
const ADMIN_WHATSAPP_DISPLAY = '+2347067703769';

const FAQ = [
  {
    q: 'How do I post an ad?',
    a: 'Tap the "+" button at the bottom of the screen or "Post Ad" at the top. You need to be an approved seller — contact admin if you need access.',
  },
  {
    q: 'How do I become a seller?',
    a: 'Register an account and contact the admin via WhatsApp or email below to request seller approval. Once approved, you can start posting listings.',
  },
  {
    q: 'How does payment work?',
    a: 'Payments are processed securely through Payment Gateway. After paying, the seller will be notified and will arrange delivery to your provided address.',
  },
  {
    q: 'Best camera settings for product upload',
    a: 'Square (1:1) is the standard, ensuring consistency across product grids. Use the same aspect ratio and background for all products in a collection.',
  },
  {
    q: 'How do I add my phone number and shop bio?',
    a: 'Go to your profile page and tap on Edit Profile and add your number and shop information.',
  },
  {
    q: 'How do I save items?',
    a: 'Tap the heart icon on any product card or listing to save it. View all saved items in the Saved tab.',
  },
];

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ onClose, onShowPrivacy, onShowTerms }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const waMessage = encodeURIComponent('Hi, I need help with Kano Market.');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Help & Support</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-6 text-white">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">We're here to help</h2>
          <p className="text-orange-100 text-sm leading-relaxed">
            Browse the FAQs below or reach out to our admin team directly. We typically respond within a few hours.
          </p>
        </div>

        {/* Contact Admin */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Admin</p>
          </div>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP.replace('+', '')}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp Admin</p>
              <p className="text-xs text-gray-400 mt-0.5">{ADMIN_WHATSAPP_DISPLAY}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>

          {/* Email */}
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Kano Market Support`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Email Support</p>
              <p className="text-xs text-gray-400 mt-0.5">{ADMIN_EMAIL}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Frequently Asked Questions</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {FAQ.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.q}</p>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal links */}
        {(onShowPrivacy || onShowTerms) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legal</p>
            </div>
            {onShowPrivacy && (
              <button
                onClick={onShowPrivacy}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-gray-900 dark:text-white">Privacy Policy</span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
            {onShowTerms && (
              <button
                onClick={onShowTerms}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-gray-900 dark:text-white">Terms of Service</span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          Kano Stores · © {new Date().getFullYear()} · All rights reserved
        </p>
      </div>
    </div>
  );
};

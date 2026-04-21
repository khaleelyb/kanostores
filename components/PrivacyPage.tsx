import React from 'react';

interface PrivacyPageProps {
  onClose: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onClose }) => {
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
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Privacy Policy</h2>
          <p className="text-blue-100 text-sm">Last updated: April 2026</p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Who we are',
            content: 'KanoStores ("we", "our", "us") is a marketplace platform for buying and selling goods and services in Kano, Nigeria. Contact: kanostoreng@gmail.com',
          },
          {
            title: '2. Information we collect',
            content: 'Account info: name, username, profile photo, phone number, bio\nTransaction info: email, delivery address, phone number (entered during checkout)\nListings you post: title, description, price, category, product photos\nMessages exchanged between buyers and sellers\nPayment references processed via KoraPay (we do not store card numbers)\nDevice and usage data collected automatically (browser type, pages visited)',
          },
          {
            title: '3. How we use your information',
            content: 'To display your listings and profile to other users\nTo process payments and fulfill orders\nTo enable messaging between buyers and sellers\nTo send order status updates to sellers via WhatsApp\nTo improve platform features and prevent abuse',
          },
          {
            title: '4. Data sharing',
            content: 'KoraPay: payment processing (buyer email, name, phone, amount)\nSupabase: database and file storage provider (data stored in their infrastructure)\nWe do not sell your personal data to third parties\nWe do not display ads or share data with advertisers',
          },
          {
            title: '5. Your rights',
            content: 'You may request deletion of your account and associated data by contacting us at kanostoreng@gmail.com. Admins can delete accounts from the admin panel. Saved products and message threads are removed when an account is deleted.',
          },
          {
            title: '6. Data retention',
            content: 'Account data is retained until you request deletion. Order records may be kept for up to 5 years for legal and financial compliance.',
          },
          {
            title: '7. Children',
            content: 'KanoStores is not directed at children under 13. We do not knowingly collect data from children.',
          },
          {
            title: '8. Changes',
            content: 'We may update this policy. Continued use of the app after changes means you accept the updated policy.',
          },
          {
            title: '9. Contact',
            content: 'Email: kanostoreng@gmail.com\nWhatsApp: +2347067703769',
          },
        ].map((section) => (
          <div key={section.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{section.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          Kano Stores · © {new Date().getFullYear()} · All rights reserved
        </p>
      </div>
    </div>
  );
};

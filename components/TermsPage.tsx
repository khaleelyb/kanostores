import React from 'react';

interface TermsPageProps {
  onClose: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onClose }) => {
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
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-6 text-white">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Terms of Service</h2>
          <p className="text-orange-100 text-sm">Last updated: April 2026</p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Acceptance',
            content: 'By creating an account or using KanoStores, you agree to these terms. If you do not agree, do not use the platform.',
          },
          {
            title: '2. Eligibility',
            content: 'You must be at least 13 years old to use KanoStores. By registering, you confirm you meet this requirement.',
          },
          {
            title: '3. Accounts',
            content: 'You are responsible for keeping your account credentials secure\nOne account per person. Creating multiple accounts to evade bans is prohibited\nSeller accounts require admin approval before posting listings',
          },
          {
            title: '4. Listings',
            content: 'You may only list items you legally own or have authority to sell\nProhibited listings include: counterfeit goods, stolen property, weapons, illegal substances, adult content, or anything that violates Nigerian law\nListing prices must be in Nigerian Naira (NGN)\nAdmins may remove any listing at their discretion without notice',
          },
          {
            title: '5. Payments',
            content: 'Payments are processed by KoraPay, a third-party provider\nKanoStores is a facilitator. Disputes about product quality or delivery are between buyer and seller\nRefund requests must be directed to the seller. KanoStores will assist in good faith but is not liable for seller non-performance',
          },
          {
            title: '6. Prohibited conduct',
            content: 'Fraud, misrepresentation, or scamming other users\nHarassment, threats, or abusive messaging\nAttempting to circumvent payment processing\nPosting false reviews or manipulating search rankings',
          },
          {
            title: '7. Content ownership',
            content: 'You retain ownership of content you post. By posting, you grant KanoStores a license to display it on the platform. You may delete your listings at any time.',
          },
          {
            title: '8. Limitation of liability',
            content: 'KanoStores is provided "as is." We are not liable for losses arising from transactions between users, third-party service outages, or platform downtime.',
          },
          {
            title: '9. Termination',
            content: 'We may suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us.',
          },
          {
            title: '10. Governing law',
            content: 'These terms are governed by the laws of the Federal Republic of Nigeria.',
          },
          {
            title: '11. Contact',
            content: 'Email: kanostoreng@gmail.com',
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

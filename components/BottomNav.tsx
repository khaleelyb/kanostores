import React from 'react';
import { Page } from '../types';

interface BottomNavProps {
  onPostAdClick: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  cartCount: number;
  unreadMessageCount?: number;
}

const NavBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  page: Page;
  activePage: Page;
  setActivePage: (p: Page) => void;
}> = ({ icon, label, page, activePage, setActivePage }) => {
  const active = activePage === page;
  return (
    <button
      onClick={() => setActivePage(page)}
      className={`flex flex-col items-center justify-center gap-0.5 w-full h-full pt-2 pb-1 transition-all ${
        active ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      <div className={`relative p-1 rounded-lg transition-all ${active ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
        {icon}
        {active && <span className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-orange-500 rounded-full" />}
      </div>
      <span className="text-[10px] font-medium tracking-tight">{label}</span>
    </button>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({
  onPostAdClick, activePage, setActivePage, cartCount, unreadMessageCount = 0
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-xl shadow-black/10">
      <div className="flex h-16 items-stretch">

        {/* Home */}
        <div className="w-1/5">
          <NavBtn
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={activePage === 'home' ? 2.5 : 1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>}
            label="Home" page="home" activePage={activePage} setActivePage={setActivePage}
          />
        </div>

        {/* Saved */}
        <div className="w-1/5">
          <NavBtn
            icon={<svg className="w-5 h-5" fill={activePage === 'saved' ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>}
            label="Saved" page="saved" activePage={activePage} setActivePage={setActivePage}
          />
        </div>

        {/* Post button center */}
        <div className="w-1/5 flex items-center justify-center">
          <button
            onClick={onPostAdClick}
            className="absolute -top-5 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl shadow-lg shadow-orange-300 dark:shadow-orange-900/50 hover:shadow-orange-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-white dark:border-gray-950"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Combined Inbox + Cart toggle */}
        <div className="w-1/5">
          <button
            onClick={() => setActivePage(activePage === 'messages' ? 'cart' : 'messages')}
            className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full pt-2 pb-1 transition-all ${
              activePage === 'messages' || activePage === 'cart'
                ? 'text-orange-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-all ${
              activePage === 'messages' || activePage === 'cart' ? 'bg-orange-50 dark:bg-orange-900/20' : ''
            }`}>
              {/* Icon swaps based on active page */}
              {activePage === 'cart' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.875-7.16a60.077 60.077 0 0 0-16.836-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={activePage === 'messages' ? 2.5 : 1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-3.75l-3.75 2.25v-2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25" />
                </svg>
              )}

              {/* Unread badge — hidden when already on messages */}
              {unreadMessageCount > 0 && activePage !== 'messages' && (
                <span className="absolute -top-0.5 -left-1 min-w-[16px] h-4 px-1 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-gray-950">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}

              {/* Cart badge — hidden when already on cart */}
              {cartCount > 0 && activePage !== 'cart' && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}

              {(activePage === 'messages' || activePage === 'cart') && (
                <span className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-orange-500 rounded-full" />
              )}
            </div>

            {/* Toggle pill — shows which tab is active */}
            {activePage === 'messages' || activePage === 'cart' ? (
              <div className="flex items-center gap-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-full px-1.5 py-0.5">
                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full transition-all ${
                  activePage === 'messages'
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-400 dark:text-orange-500'
                }`}>
                  MSG
                </span>
                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full transition-all ${
                  activePage === 'cart'
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-400 dark:text-orange-500'
                }`}>
                  CART
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-medium tracking-tight">Inbox</span>
            )}
          </button>
        </div>

        {/* Profile */}
        <div className="w-1/5">
          <NavBtn
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={activePage === 'profile' ? 2.5 : 1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
            label="Profile" page="profile" activePage={activePage} setActivePage={setActivePage}
          />
        </div>

      </div>
    </nav>
  );
};

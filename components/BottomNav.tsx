import React from 'react';
import { Icon } from './Icon';
import { Page } from '../types';

interface BottomNavProps {
  onPostAdClick: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavLink: React.FC<{ iconName: 'home' | 'heart' | 'message' | 'user'; label: string; page: Page; activePage: Page; setActivePage: (page: Page) => void; }> = ({ iconName, label, page, activePage, setActivePage }) => {
  const isActive = page === activePage;
  return (
    <button onClick={() => setActivePage(page)} className={`flex flex-col items-center justify-center w-full h-full transition-colors pt-2 pb-1 ${isActive ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400 hover:text-orange-600'}`}>
      <Icon name={iconName} className="w-6 h-6 mb-1" />
      <span className="text-xs tracking-tight">{label}</span>
    </button>
  );
};


export const BottomNav: React.FC<BottomNavProps> = ({ onPostAdClick, activePage, setActivePage }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-40 border-t border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-stretch justify-around">
        <div className="w-1/5"><NavLink iconName="home" label="Home" page="home" activePage={activePage} setActivePage={setActivePage} /></div>
        <div className="w-1/5"><NavLink iconName="heart" label="Saved" page="saved" activePage={activePage} setActivePage={setActivePage} /></div>
        
        <div className="w-1/5 flex justify-center">
            <button
              onClick={onPostAdClick}
              className="absolute -top-6 flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-transform duration-200 ease-in-out hover:scale-105 border-4 border-white dark:border-gray-800"
              aria-label="Post a new Ad"
            >
              <Icon name="plus" className="w-8 h-8" />
            </button>
        </div>

        <div className="w-1/5"><NavLink iconName="message" label="Messages" page="messages" activePage={activePage} setActivePage={setActivePage} /></div>
        <div className="w-1/5"><NavLink iconName="user" label="Profile" page="profile" activePage={activePage} setActivePage={setActivePage} /></div>
      </div>
    </nav>
  );
};

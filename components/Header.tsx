
import React from 'react';
import { Icon } from './Icon';
import { User } from '../types';
import { Page } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPostAdClick: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUser: User | null;
  onLoginClick: () => void;
}

const NavLink: React.FC<{ iconName: 'home' | 'heart' | 'user'; label: string; page: Page; activePage: Page; setActivePage: (page: Page) => void; }> = ({ iconName, label, page, activePage, setActivePage }) => {
  const isActive = activePage === page;
  return (
    <button onClick={() => setActivePage(page)} className={`flex flex-col items-center transition-colors ${isActive ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-500'}`}>
      <Icon name={iconName} className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};


export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, onPostAdClick, activePage, setActivePage, currentUser, onLoginClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
             <button onClick={() => setActivePage('home')} aria-label="Back to homepage">
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">Kano Marketplace</span>
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-4 pr-12 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon name="search" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <NavLink iconName="home" label="Home" page="home" activePage={activePage} setActivePage={setActivePage} />
              {currentUser ? (
                <>
                  <NavLink iconName="heart" label="Saved" page="saved" activePage={activePage} setActivePage={setActivePage} />
                  <NavLink iconName="user" label="Profile" page="profile" activePage={activePage} setActivePage={setActivePage} />
                </>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                >
                  Login / Register
                </button>
              )}
            </nav>
            <button
              onClick={onPostAdClick}
              className="hidden md:flex items-center space-x-2 bg-orange-600 text-white font-semibold px-4 py-2 rounded-full hover:bg-orange-700 transition-transform duration-200 ease-in-out hover:scale-105"
            >
              <Icon name="sparkles" className="w-5 h-5" />
              <span>Post Ad</span>
            </button>
          </div>
        </div>
         <div className="md:hidden pb-3 px-1">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-4 pr-12 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon name="search" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
      </div>
    </header>
  );
};

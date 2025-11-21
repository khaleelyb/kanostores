
import React from 'react';
import { Page } from '../types';

interface AuthPromptProps {
  page: Page;
  onLoginClick: () => void;
}

const pageInfo = {
    saved: {
        title: "See Your Saved Items",
        message: "Log in to view the products you've saved. Don't miss out on a great deal!"
    },
    messages: {
        title: "Access Your Messages",
        message: "Log in to read and send messages to buyers and sellers on the platform."
    },
    profile: {
        title: "View Your Profile",
        message: "Log in to manage your ads, edit your profile, and view your account details."
    },
    'edit-profile': {
        title: "Edit Your Profile",
        message: "Log in to update your name, email, and other account details."
    },
    home: { // Added a fallback for home, although not currently used
        title: 'Please Log In', 
        message: 'You need to be logged in to access this page.'
    }
};

export const AuthPrompt: React.FC<AuthPromptProps> = ({ page, onLoginClick }) => {
    const info = pageInfo[page] || { title: 'Please Log In', message: 'You need to be logged in to access this page.'};

    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{info.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{info.message}</p>
                <button
                    onClick={onLoginClick}
                    className="bg-orange-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-orange-700 transition-transform duration-200 ease-in-out hover:scale-105"
                >
                    Login / Register
                </button>
            </div>
        </div>
    );
};

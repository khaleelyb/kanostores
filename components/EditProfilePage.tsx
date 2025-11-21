import React, { useState } from 'react';
import { User } from '../types';

interface EditProfilePageProps {
    currentUser: User;
    onSaveChanges: (name: string, username: string) => void;
    onClose: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ currentUser, onSaveChanges, onClose }) => {
    const [name, setName] = useState(currentUser.name);
    const [username, setUsername] = useState(currentUser.username);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '' || username.trim() === '') {
            alert('Name and username cannot be empty.');
            return;
        }
        onSaveChanges(name, username);
    };

    return (
        <div className="animate-fade-in">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <button onClick={onClose} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        <span>Back to Profile</span>
                    </button>
                </div>
                
                <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Edit Profile</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200"
                                required
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

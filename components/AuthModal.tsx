import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { generateAvatar } from '../utils/avatar';

export interface AuthData {
    username: string;
    name?: string;
    profilePicture?: string;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (data: AuthData) => void;
    onRegister: (data: AuthData) => void;
    initialView?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister, initialView = 'login' }) => {
    const [view, setView] = useState(initialView);
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setUsername('');
            setName('');
            setImagePreview(null);
        }
    }, [isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (username.trim() === '') {
            alert('Please enter a username.');
            return;
        }
        
        if (view === 'register' && name.trim() === '') {
            alert('Please enter your full name.');
            return;
        }
        
        if (view === 'login') {
            onLogin({ username });
        } else {
            onRegister({ username, name, profilePicture: imagePreview || generateAvatar(name) });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <Icon name="close" className="w-6 h-6" />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-2">
                        {view === 'login' ? 'Welcome Back!' : 'Create Account'}
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                        {view === 'login' ? 'Log in to continue.' : 'Get started with Kano Marketplace.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === 'register' && (
                            <>
                                <div className="flex flex-col items-center space-y-2">
                                    <label htmlFor="profile-picture-upload" className="cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed hover:border-orange-500 transition-colors">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon name="camera" className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                    </label>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Profile Picture (Optional)</span>
                                    <input id="profile-picture-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" required />
                                </div>
                            </>
                        )}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-200" 
                                placeholder="Enter your username"
                                required 
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-colors">
                                {view === 'login' ? 'Log In' : 'Register'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            <button 
                                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                                className="font-semibold text-orange-600 hover:text-orange-700 ml-1"
                            >
                                {view === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

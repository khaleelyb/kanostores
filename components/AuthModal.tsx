// components/AuthModal.tsx
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { generateAvatar } from '../utils/avatar';

export interface AuthData {
    username: string;
    password?: string;
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
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => { setView(initialView); }, [initialView]);

    useEffect(() => {
        if (!isOpen) {
            setUsername(''); setPassword(''); setName('');
            setImagePreview(null); setShowPassword(false);
        }
    }, [isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) { alert('Please enter a username.'); return; }
        if (view === 'register') {
            if (!name.trim()) { alert('Please enter your full name.'); return; }
            if (!password.trim() || password.length < 4) { alert('Password must be at least 4 characters.'); return; }
            onRegister({ username, password, name, profilePicture: imagePreview || generateAvatar(name) });
        } else {
            onLogin({ username, password });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <Icon name="close" className="w-6 h-6" />
                    </button>

                    {/* Logo + heading */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mb-3 shadow-md shadow-orange-200 dark:shadow-orange-900/40">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" fill="white"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            {view === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {view === 'login' ? 'Log in to your account' : 'Get started with Kano Stores'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">

                        {/* Register-only fields */}
                        {view === 'register' && (
                            <>
                                {/* Profile picture */}
                                <div className="flex flex-col items-center space-y-1.5 mb-1">
                                    <label htmlFor="profile-picture-upload" className="cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 transition-colors">
                                            {imagePreview
                                                ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                : <Icon name="camera" className="w-7 h-7 text-gray-400" />
                                            }
                                        </div>
                                    </label>
                                    <span className="text-xs text-gray-400">Profile photo (optional)</span>
                                    <input id="profile-picture-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                                </div>

                                {/* Full name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text" id="name" value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Aminu Musa"
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input
                                type="text" id="username" value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                                {view === 'register' && (
                                    <span className="ml-1.5 text-xs font-normal text-gray-400">(used for PIN recovery)</span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password" value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword
                                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* PIN hint on login */}
                        {view === 'login' && (
                            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/40 rounded-xl px-3 py-2.5">
                                <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <p className="text-xs text-orange-700 dark:text-orange-400">If you have a PIN set, you'll be asked for it after logging in</p>
                            </div>
                        )}

                        <div className="pt-1">
                            <button
                                type="submit"
                                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md shadow-orange-200 dark:shadow-orange-900/30"
                            >
                                {view === 'login' ? 'Log In' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                onClick={() => { setView(view === 'login' ? 'register' : 'login'); setPassword(''); }}
                                className="font-semibold text-orange-500 hover:text-orange-600 ml-1"
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

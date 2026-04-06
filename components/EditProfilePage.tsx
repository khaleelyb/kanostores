import React, { useState } from 'react';
import { User } from '../types';

interface EditProfilePageProps {
    currentUser: User;
    onSaveChanges: (name: string, username: string, phone: string, bio: string) => void;
    onClose: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ currentUser, onSaveChanges, onClose }) => {
    const [name, setName] = useState(currentUser.name);
    const [username, setUsername] = useState(currentUser.username);
    const [phone, setPhone] = useState(currentUser.phone ?? '');
const [bio, setBio] = useState(currentUser.bio ?? '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '' || username.trim() === '') {
            alert('Name and username cannot be empty.');
            return;
        }
        onSaveChanges(name, username, phone, bio);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium text-sm transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back
                    </button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h1>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                    placeholder="yourhandle"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Phone / WhatsApp Number
                                <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                    </svg>
                                </span>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                                    placeholder="+234 800 000 0000"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                Buyers will be able to call or WhatsApp you directly on this number.
                            </p>
                        </div>
{/* Bio */}
<div>
    <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        Shop Bio
        <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
    </label>
    <textarea
        id="bio"
        value={bio}
        onChange={e => setBio(e.target.value)}
        rows={3}
        maxLength={200}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none"
        placeholder="Tell buyers about your shop…"
    />
    <p className="mt-1 text-xs text-right text-gray-400">{bio.length}/200</p>
</div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-200 dark:shadow-orange-900/30"
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

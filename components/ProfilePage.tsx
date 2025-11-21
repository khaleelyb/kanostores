
import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { User, Product, Theme, Page } from '../types';
import { ProductGrid } from './ProductGrid';

interface ProfilePageProps {
    currentUser: User | null;
    onLogout: () => void;
    onUpdateProfilePicture: (newPictureUrl: string) => void;
    setActivePage: (page: Page) => void;
    userProducts: Product[];
    onMessageSeller: (product: Product) => void;
    savedProductIds: Set<string>;
    onToggleSave: (productId: string) => void;
    onSelectProduct: (product: Product) => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ProfileMenuItem = ({ iconName, text, onClick }: { iconName: React.ComponentProps<typeof Icon>['name'], text: string, onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center p-4 space-x-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
        <div className="text-gray-500 dark:text-gray-400">
            <Icon name={iconName} className="w-6 h-6" />
        </div>
        <span className="text-gray-800 dark:text-gray-300 font-medium">{text}</span>
        <div className="ml-auto text-gray-400">
           <Icon name="chevron-right" className="w-5 h-5" />
        </div>
    </button>
);

const ThemeSelector: React.FC<{ theme: Theme, setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => (
    <div className="p-4">
        <label className="block text-gray-800 dark:text-gray-300 font-medium mb-3">Theme</label>
        <div className="flex space-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            {(['light', 'dark', 'system'] as Theme[]).map(t => (
                <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`w-full py-1.5 text-sm font-semibold rounded-md capitalize transition-colors ${
                        theme === t ? 'bg-white dark:bg-gray-800 text-orange-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                >
                    {t}
                </button>
            ))}
        </div>
    </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
    currentUser, onLogout, onUpdateProfilePicture, setActivePage, 
    userProducts, onMessageSeller, savedProductIds, onToggleSave, 
    onSelectProduct, onEditProduct, onDeleteProduct, theme, setTheme
}) => {
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!currentUser) {
        return (
            <div className="text-center py-20">
                <p>Please log in to see your profile.</p>
            </div>
        );
    }
    
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (newImagePreview) {
            onUpdateProfilePicture(newImagePreview);
            setNewImagePreview(null);
        }
    };

    const handleCancel = () => {
        setNewImagePreview(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8 text-center">Profile</h1>
            
            <div className="max-w-2xl mx-auto">
                {/* Profile Header */}
                <div className="flex flex-col items-center space-y-4 mb-10">
                    <div className="relative group">
                        <img className="h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-orange-100 dark:ring-orange-500/20" src={newImagePreview || currentUser.profilePicture} alt="User Avatar" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-all duration-300"
                            aria-label="Change profile picture"
                        >
                            <Icon name="pencil" className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentUser.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center">Joined in 2024</p>
                    </div>

                    {newImagePreview && (
                        <div className="flex items-center space-x-4 pt-2">
                            <button onClick={handleSave} className="bg-orange-600 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                                Save Changes
                            </button>
                            <button onClick={handleCancel} className="bg-gray-200 text-gray-800 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 sm:p-4 divide-y divide-gray-200 dark:divide-gray-700">
                    <ProfileMenuItem iconName="user" text="Edit Profile" onClick={() => setActivePage('edit-profile')} />
                    <ThemeSelector theme={theme} setTheme={setTheme} />
                    <ProfileMenuItem iconName="home" text="Help & Support" onClick={() => alert('Feature coming soon!')} />
                </div>
                
                <div className="mt-8 text-center">
                    <button onClick={onLogout} className="font-semibold text-red-500 hover:text-red-700 transition-colors py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                        Log Out
                    </button>
                </div>
            </div>

            {/* My Ads Section */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">My Ads</h2>
                {userProducts.length > 0 ? (
                    <ProductGrid
                        products={userProducts}
                        onMessageSeller={onMessageSeller}
                        savedProductIds={savedProductIds}
                        onToggleSave={onToggleSave}
                        onSelectProduct={onSelectProduct}
                    >
                      {/* children with product prop passed to them */}
                      {({ product }: { product: Product }) => (
                          <div className="flex justify-end space-x-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                              <button
                                  onClick={() => onEditProduct(product)}
                                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              >
                                  Edit
                              </button>
                              <button
                                  onClick={() => onDeleteProduct(product.id)}
                                  className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              >
                                  Delete
                              </button>
                          </div>
                      )}
                  </ProductGrid>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">You haven't posted any ads yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Click the "Post Ad" button to list your first item.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

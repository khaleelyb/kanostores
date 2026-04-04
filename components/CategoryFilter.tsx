import React from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  'Mobile Phones & Tablets': '📱',
  'Computers': '💻',
  'Women clothes': '👗',
  'Men clothes': '👔',
  'Men shoes': '👞',
  'Women shoes': '👠',
  'Cars': '🚗',
  'Herbals and supplements': '🌿',
  'Houses': '🏠',
  'Accesories and chargers': '🔌',
  'Food stuffs': '🛒',
  'Home, Furniture & Appliances': '🛋️',
  'Body care, soaps and perfumes': '🧴',
  'Electronics': '⚡',
  'vehicle parts and accesories': '🔧',
  'Books': '📚',
  'Gym equipments': '🏋️',
  'Beauty & Personal Care': '💄',
  'Health & Medicine': '💊',
  'Vehicles': '🚙',
  'Property': '🏢',
  'Food, Agriculture & Farming': '🌾',
  'Services': '🛠️',
  'Repair & Construction': '🏗️',
  'Commercial Equipment & Tools': '⚙️',
  'Babies & Kids': '👶',
  'Animals & Pets': '🐾',
  'Jobs': '💼',
};

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <section className="py-6 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Categories</h2>
          <span className="text-xs text-gray-400">{categories.length} categories</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map(category => {
            const isActive = selectedCategory === category;
            const emoji = CATEGORY_ICONS[category] || '🏷️';
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/40'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>{category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

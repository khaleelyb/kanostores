
import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, setSelectedCategory }) => {
  const allCategories = ['All', ...categories];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Browse Categories</h2>
        <div className="flex space-x-3 overflow-x-auto pb-4 -mx-4 px-4">
          {allCategories.map(category => (
            <button
              key={category}
              className={`
                px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200
                ${selectedCategory === category
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700 hover:text-orange-700 dark:hover:text-orange-500 border border-gray-200 dark:border-gray-700'
                }
              `}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

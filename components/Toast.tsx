
import React, { useEffect, useState } from 'react';

interface ToastProps {
  toast: { message: string; id: number } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-white font-semibold shadow-lg transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0 bg-gray-800 dark:bg-gray-200 dark:text-gray-800' : 'opacity-0 -translate-y-10'}`}
      role="alert"
      aria-live="assertive"
    >
      {toast.message}
    </div>
  );
};

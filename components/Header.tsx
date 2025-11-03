import React from 'react';
import { NavigationItem } from '../types';
import { NAV_ITEMS } from '../constants';

interface HeaderProps {
  activeView: NavigationItem;
  setActiveView: (view: NavigationItem) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Branding Section */}
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
             <h1 className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">ระบบจัดการข้อมูล</h1>
          </div>
        </div>
      </div>
      {/* Navigation Bar Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item)}
                  className={`flex-shrink-0 flex items-center space-x-2 py-3 px-4 border-b-2 transition-colors duration-200
                    ${
                      activeView.id === item.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className="h-5 w-5">{item.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                </button>
              ))}
            </nav>
        </div>
      </div>
    </header>
  );
};
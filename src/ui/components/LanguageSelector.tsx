import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
      <Languages className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      <button
        onClick={() => setLanguage('es')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          language === 'es'
            ? 'bg-white dark:bg-gray-700 shadow-xs text-blue-700 dark:text-blue-300 font-bold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
      >
        ES
      </button>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <button
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          language === 'en'
            ? 'bg-white dark:bg-gray-700 shadow-xs text-blue-700 dark:text-blue-300 font-bold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
      >
        EN
      </button>
    </div>
  );
};

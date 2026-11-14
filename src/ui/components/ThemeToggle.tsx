import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === 'dark';
  // The button displays the OTHER possible state to switch to
  const targetLabel = isDark ? t('theme.toLight') : t('theme.toDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={targetLabel}
      aria-label={targetLabel}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs bg-gray-100 hover:bg-gray-200/90 text-gray-700 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700 hover:text-blue-700 dark:hover:text-blue-400"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300" />
          <span className="hidden sm:inline font-medium">{targetLabel}</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300" />
          <span className="hidden sm:inline font-medium">{targetLabel}</span>
        </>
      )}
    </button>
  );
};

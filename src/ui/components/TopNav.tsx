import React from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface TopNavProps {
  activePhase: number;
  onSelectPhase: (phase: number) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activePhase, onSelectPhase }) => {
  const { t } = useI18n();

  return (
    <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl overflow-hidden shadow-sm sticky top-0 z-50">
      <button
        onClick={() => onSelectPhase(0)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${
          activePhase === 0 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t('nav.configuration')}
      </button>
      <button
        onClick={() => onSelectPhase(1)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${
          activePhase === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t('nav.characteristicAnalysis')}
      </button>
      <button
        onClick={() => onSelectPhase(2)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${
          activePhase === 2 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t('nav.aggregationAnalysis')}
      </button>
    </div>
  );
};

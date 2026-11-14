import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AppMenuView, FLAVOUR_LIST, FlavourId, isFlavourId } from '../../logic/flavours';
import { FlavourIllustration } from './FlavourWatermark';
import { useI18n } from '../i18n/I18nContext';
import { TranslationKey } from '../i18n/translations';

export interface MainNavMenuProps {
  activeView: AppMenuView;
  onSelectView: (view: AppMenuView) => void;
}

const FLAVOUR_MENU_META: Record<
  FlavourId,
  {
    labelKey: TranslationKey;
    descKey: TranslationKey;
  }
> = {
  'match-soccer-mvp': {
    labelKey: 'header.menu.matchSoccerMvp',
    descKey: 'header.menu.matchSoccerMvpDesc'
  },
  'race-driver': {
    labelKey: 'header.menu.raceDriver',
    descKey: 'header.menu.raceDriverDesc'
  }
};

/**
 * Top navigation menu bar rendered next to the application title.
 * Hosts the main Ordomachine workspace link and the Flavours dropdown submenu.
 */
export const MainNavMenu: React.FC<MainNavMenuProps> = ({ activeView, onSelectView }) => {
  const { t } = useI18n();
  const [isFlavoursOpen, setIsFlavoursOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOrdomachineActive = activeView === 'ordomachine';
  const activeFlavour = isFlavourId(activeView) ? activeView : null;

  useEffect(() => {
    if (!isFlavoursOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFlavoursOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFlavoursOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFlavoursOpen]);

  const handleSelectMain = () => {
    setIsFlavoursOpen(false);
    onSelectView('ordomachine');
  };

  const handleSelectFlavour = (flavourId: FlavourId) => {
    setIsFlavoursOpen(false);
    onSelectView(flavourId);
  };

  const navItemBaseClass =
    'relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none whitespace-nowrap';

  return (
    <nav aria-label={t('header.mainNav')} className="flex items-center gap-1 sm:gap-2">
      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2" />

      {/* Main Ordomachine view */}
      <button
        type="button"
        onClick={handleSelectMain}
        aria-current={isOrdomachineActive ? 'page' : undefined}
        className={`${navItemBaseClass} ${
          isOrdomachineActive
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/35'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/75 dark:hover:bg-gray-800/70'
        }`}
      >
        <span>{t('header.menu.ordomachine')}</span>
        {isOrdomachineActive && (
          <span
            aria-hidden="true"
            className="absolute left-2.5 right-2.5 -bottom-1 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
          />
        )}
      </button>

      {/* Flavours dropdown trigger + submenu */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsFlavoursOpen(prev => !prev)}
          aria-haspopup="menu"
          aria-expanded={isFlavoursOpen}
          className={`${navItemBaseClass} ${
            activeFlavour || isFlavoursOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/35'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/75 dark:hover:bg-gray-800/70'
          }`}
        >
          <span>{t('header.menu.flavours')}</span>
          {activeFlavour && (
            <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-100/75 dark:bg-blue-900/45 text-blue-700 dark:text-blue-300">
              {t(FLAVOUR_MENU_META[activeFlavour].labelKey)}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isFlavoursOpen ? 'rotate-180' : ''
            }`}
          />
          {activeFlavour && (
            <span
              aria-hidden="true"
              className="absolute left-2.5 right-2.5 -bottom-1 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>

        {isFlavoursOpen && (
          <div
            role="menu"
            aria-label={t('header.menu.flavours')}
            className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg shadow-gray-900/10 dark:shadow-black/40 p-1.5 z-50"
          >
            <div className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t('header.menu.flavoursDesc')}
            </div>
            <div className="space-y-0.5">
              {FLAVOUR_LIST.map(flavour => {
                const { labelKey, descKey } = FLAVOUR_MENU_META[flavour.id];
                const isSelected = activeView === flavour.id;
                return (
                  <button
                    key={flavour.id}
                    type="button"
                    role="menuitem"
                    aria-current={isSelected ? 'page' : undefined}
                    onClick={() => handleSelectFlavour(flavour.id)}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/75'
                    }`}
                  >
                    <FlavourIllustration
                      variant={flavour.watermarkVariant}
                      strokeWidth={28}
                      className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold leading-tight">{t(labelKey)}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                        {t(descKey)}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

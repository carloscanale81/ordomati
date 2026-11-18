import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Code2, Cpu, FileText, FolderOpen } from 'lucide-react';
import { AppMenuView, FLAVOUR_LIST, FlavourId, isFlavourId } from '../../logic/flavours';
import { FlavourIllustration } from './FlavourWatermark';
import { getCaseExamples, getAllFlavourExamples } from '../../logic/examples';
import { useI18n } from '../i18n/I18nContext';
import { TranslationKey } from '../i18n/translations';

export interface MainNavMenuProps {
  activeView: AppMenuView;
  onSelectView: (view: AppMenuView) => void;
  onImportExample?: (exampleData: any) => void;
  onImportFlavourExample?: (flavourId: FlavourId, exampleData: any) => void;
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
  }
};

/**
 * Top navigation menu bar rendered next to the application title.
 * Hosts the main Ordomachine workspace link and the Flavours dropdown submenu.
 */
export const MainNavMenu: React.FC<MainNavMenuProps> = ({
  activeView,
  onSelectView,
  onImportExample,
  onImportFlavourExample
}) => {
  const { t } = useI18n();
  const [isFlavoursOpen, setIsFlavoursOpen] = useState(false);
  const [isOrdomachineOpen, setIsOrdomachineOpen] = useState(false);
  const flavoursDropdownRef = useRef<HTMLDivElement>(null);
  const ordomachineDropdownRef = useRef<HTMLDivElement>(null);
  const ordomachineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flavoursTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearOrdomachineTimeout = () => {
    if (ordomachineTimeoutRef.current) {
      clearTimeout(ordomachineTimeoutRef.current);
      ordomachineTimeoutRef.current = null;
    }
  };

  const clearFlavoursTimeout = () => {
    if (flavoursTimeoutRef.current) {
      clearTimeout(flavoursTimeoutRef.current);
      flavoursTimeoutRef.current = null;
    }
  };

  const handleOrdomachineMouseEnter = () => {
    clearOrdomachineTimeout();
    if (caseExamples.length > 0) {
      setIsOrdomachineOpen(true);
    }
  };

  const handleOrdomachineMouseLeave = () => {
    clearOrdomachineTimeout();
    ordomachineTimeoutRef.current = setTimeout(() => {
      setIsOrdomachineOpen(false);
    }, 200);
  };

  const handleFlavoursMouseEnter = () => {
    clearFlavoursTimeout();
    setIsFlavoursOpen(true);
  };

  const handleFlavoursMouseLeave = () => {
    clearFlavoursTimeout();
    flavoursTimeoutRef.current = setTimeout(() => {
      setIsFlavoursOpen(false);
    }, 200);
  };

  const caseExamples = useMemo(() => getCaseExamples(), []);
  const flavourExamples = useMemo(() => getAllFlavourExamples(), []);

  const isOrdomachineActive = activeView === 'ordomachine';
  const activeFlavour = isFlavourId(activeView) ? activeView : null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isFlavoursOpen &&
        flavoursDropdownRef.current &&
        !flavoursDropdownRef.current.contains(target)
      ) {
        clearFlavoursTimeout();
        setIsFlavoursOpen(false);
      }
      if (
        isOrdomachineOpen &&
        ordomachineDropdownRef.current &&
        !ordomachineDropdownRef.current.contains(target)
      ) {
        clearOrdomachineTimeout();
        setIsOrdomachineOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearFlavoursTimeout();
        clearOrdomachineTimeout();
        setIsFlavoursOpen(false);
        setIsOrdomachineOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearFlavoursTimeout();
      clearOrdomachineTimeout();
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFlavoursOpen, isOrdomachineOpen]);

  const handleSelectMain = () => {
    clearFlavoursTimeout();
    clearOrdomachineTimeout();
    setIsFlavoursOpen(false);
    setIsOrdomachineOpen(false);
    onSelectView('ordomachine');
  };

  const handleSelectFlavour = (flavourId: FlavourId) => {
    clearFlavoursTimeout();
    clearOrdomachineTimeout();
    setIsFlavoursOpen(false);
    setIsOrdomachineOpen(false);
    onSelectView(flavourId);
  };

  const handleOrdomachineClick = () => {
    clearFlavoursTimeout();
    clearOrdomachineTimeout();
    setIsFlavoursOpen(false);
    if (!isOrdomachineActive) {
      onSelectView('ordomachine');
      setIsOrdomachineOpen(true);
    } else {
      setIsOrdomachineOpen(prev => !prev);
    }
  };

  const handleFlavoursClick = () => {
    clearFlavoursTimeout();
    clearOrdomachineTimeout();
    setIsFlavoursOpen(prev => !prev);
  };

  const navItemBaseClass =
    'relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none whitespace-nowrap';

  return (
    <nav aria-label={t('header.mainNav')} className="flex items-center gap-1 sm:gap-2">
      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2" />

      {/* Main Ordomachine view + Examples Submenu */}
      <div
        ref={ordomachineDropdownRef}
        className="relative"
        onMouseEnter={handleOrdomachineMouseEnter}
        onMouseLeave={handleOrdomachineMouseLeave}
      >
        <button
          type="button"
          onClick={handleOrdomachineClick}
          aria-current={isOrdomachineActive ? 'page' : undefined}
          aria-haspopup="menu"
          aria-expanded={isOrdomachineOpen}
          className={`${navItemBaseClass} ${
            isOrdomachineActive || isOrdomachineOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/35'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/75 dark:hover:bg-gray-800/70'
          }`}
        >
          <span>{t('header.menu.ordomachine')}</span>
          {caseExamples.length > 0 && (
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOrdomachineOpen ? 'rotate-180' : ''
              }`}
            />
          )}
          {isOrdomachineActive && (
            <span
              aria-hidden="true"
              className="absolute left-2.5 right-2.5 -bottom-1 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>

        {caseExamples.length > 0 && isOrdomachineOpen && (
          <div
            role="menu"
            aria-label={t('header.menu.examples')}
            className="absolute left-0 top-full pt-1.5 w-80 z-50 animate-in fade-in duration-150"
          >
            <div className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-900/10 dark:shadow-black/40 p-1.5">
              <div className="space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSelectMain}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isOrdomachineActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/75'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold leading-tight">{t('header.menu.ordomachine')}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                      {t('header.menu.currentWorkspace')}
                    </div>
                  </div>
                  {isOrdomachineActive && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <FolderOpen className="w-3 h-3 text-amber-500" />
                  <span>{t('header.menu.examples')}</span>
                </div>

                {caseExamples.map(example => (
                  <button
                    key={example.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      clearOrdomachineTimeout();
                      setIsOrdomachineOpen(false);
                      onImportExample?.(example.data);
                      onSelectView('ordomachine');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-700 dark:text-gray-200 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer group"
                    title={`Importar ${example.fileName}`}
                  >
                    <FileText className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="text-xs font-mono font-semibold truncate leading-tight group-hover:underline">
                          {example.fileName}
                        </div>
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono font-bold shrink-0">
                          JSON
                        </span>
                      </div>
                      {(example.data?.name || example.data?.description) && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-sans">
                          {example.data?.name || example.data?.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flavours dropdown trigger + submenu with Ordoexpertos examples */}
      <div
        ref={flavoursDropdownRef}
        className="relative"
        onMouseEnter={handleFlavoursMouseEnter}
        onMouseLeave={handleFlavoursMouseLeave}
      >
        <button
          type="button"
          onClick={handleFlavoursClick}
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
            className="absolute left-0 top-full pt-1.5 w-80 z-50 animate-in fade-in duration-150"
          >
            <div className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-900/10 dark:shadow-black/40 p-1.5">
              <div className="space-y-1">
                {FLAVOUR_LIST.map(flavour => {
                  const { labelKey, descKey } = FLAVOUR_MENU_META[flavour.id];
                  const isSelected = activeView === flavour.id;
                  const exs = flavourExamples[flavour.id] || [];
                  return (
                    <div key={flavour.id} className="space-y-1">
                      {/* Main Ordoexperto Access Item */}
                      <button
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

                      {/* Submenu of examples hanging directly from this Ordoexperto menuitem */}
                      {exs.length > 0 && (
                        <div className="ml-3 pl-3 border-l-2 border-amber-200/60 dark:border-amber-800/40 space-y-0.5 pt-0.5 pb-1">
                          <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <FolderOpen className="w-3 h-3 text-amber-500" />
                            <span>{t('header.menu.examples')}</span>
                          </div>
                          {exs.map(example => (
                            <button
                              key={example.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                clearFlavoursTimeout();
                                setIsFlavoursOpen(false);
                                onImportFlavourExample?.(flavour.id, example.data);
                                onSelectView(flavour.id);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-gray-700 dark:text-gray-200 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer group"
                              title={`Importar ejemplo: ${example.fileName}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[11px] font-mono font-medium truncate leading-tight group-hover:underline">
                                    {example.fileName}
                                  </span>
                                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono font-bold shrink-0">
                                    JSON
                                  </span>
                                </div>
                                {(example.data?.description || example.data?.name) && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-sans">
                                    {example.data?.description || example.data?.name}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Function Syntax Documentation view */}
      <button
        type="button"
        onClick={() => {
          setIsFlavoursOpen(false);
          onSelectView('function-syntax');
        }}
        aria-current={activeView === 'function-syntax' ? 'page' : undefined}
        className={`${navItemBaseClass} ${
          activeView === 'function-syntax'
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/35'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/75 dark:hover:bg-gray-800/70'
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>{t('header.menu.functionSyntax')}</span>
        {activeView === 'function-syntax' && (
          <span
            aria-hidden="true"
            className="absolute left-2.5 right-2.5 -bottom-1 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
          />
        )}
      </button>
    </nav>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Activity, Download, Upload, CheckCircle, X, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  createDefaultDataset,
  calculateOrdomatica,
  OrdomaticaDataset,
  AppMenuView,
  FlavourAnalysisCase,
  FlavourId,
  createInitialFlavourState,
  isFlavourId
} from '../logic';
import { serializeFullCase, deserializeFullCase } from '../io/serializer';
import { downloadJsonFile, readJsonFile } from '../io/browserIO';
import { PhaseStepper } from './components/PhaseStepper';
import { LanguageSelector } from './components/LanguageSelector';
import { ThemeToggle } from './components/ThemeToggle';
import { MainNavMenu } from './components/MainNavMenu';
import { FlavourPage } from './components/FlavourPage';
import { AppFooter } from './components/AppFooter';
import { ThemeProvider } from './theme/ThemeContext';
import { ConfigPhase } from './phases/ConfigPhase';
import { CharacteristicPhase } from './phases/CharacteristicPhase';
import { AggregationPhase } from './phases/AggregationPhase';
import { I18nProvider, useI18n } from './i18n/I18nContext';

function AppContent() {
  const { t, language } = useI18n();
  const [dataset, setDataset] = useState<OrdomaticaDataset>(createDefaultDataset);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.title');
  }, [language, t]);
  const [activePhase, setActivePhase] = useState<number>(0);
  const [activeCharIdx, setActiveCharIdx] = useState<number>(0);
  const [activeView, setActiveView] = useState<AppMenuView>('ordomachine');
  const [flavourCases, setFlavourCases] = useState<Record<FlavourId, FlavourAnalysisCase>>(() => ({
    'match-soccer-mvp': createInitialFlavourState('match-soccer-mvp'),
    'race-driver': createInitialFlavourState('race-driver')
  }));
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleCollapsePhase = (phaseIndex: number) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseIndex]: !prev[phaseIndex]
    }));
  };

  // Import state
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main scroll container reference
  const mainScrollRef = useRef<HTMLElement>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // Pure algorithmic calculation invoked reactively
  const calculation = useMemo(() => calculateOrdomatica(dataset), [dataset]);

  // Handle Full Case Export
  const handleExportCase = () => {
    const jsonStr = serializeFullCase(dataset);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`ordomatics_case_${dateStr}.json`, jsonStr);
  };

  // Handle File Selection for Import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await readJsonFile(file);
      setPendingImportData(parsedData);
    } catch (err: any) {
      const msg =
        err?.message === 'INVALID_JSON'
          ? t('header.importInvalidJson')
          : err?.message === 'FILE_READ_ERROR'
          ? t('header.importReadError')
          : err?.message || t('header.importReadError');
      alert(msg);
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  // Confirm and Apply Import
  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    const restored = deserializeFullCase(pendingImportData);
    setDataset(restored);
    setPendingImportData(null);
  };

  // Navigate to phase with smooth scrolling
  const scrollToPhase = (phaseIndex: number) => {
    // If target phase is collapsed, auto-expand it
    setCollapsedPhases(prev => ({ ...prev, [phaseIndex]: false }));
    setActivePhase(phaseIndex);
    isProgrammaticScrollRef.current = true;
    const targetElement = document.getElementById(`phase-section-${phaseIndex}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset programmatic flag after smooth scroll finishes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 800);
    }
  };

  // ScrollSpy: observe sections to update active phase dynamically while scrolling
  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;

      const phaseElements = [0, 1, 2].map(i => document.getElementById(`phase-section-${i}`));
      const containerTop = container.getBoundingClientRect().top;

      let currentPhase = 0;
      for (let i = 0; i < phaseElements.length; i++) {
        const el = phaseElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the section is near or above the upper third of the viewport
          if (rect.top - containerTop <= 220) {
            currentPhase = i;
          }
        }
      }
      setActivePhase(currentPhase);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeView]);

  const pendingMeta = pendingImportData
    ? {
        elements: (pendingImportData.dataset?.elements || pendingImportData.elements || []).length,
        characteristics: (pendingImportData.dataset?.characteristics || pendingImportData.characteristics || []).length,
        date: pendingImportData.exportedAt
          ? new Date(pendingImportData.exportedAt).toLocaleDateString(language)
          : 'N/A'
      }
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">
      {/* HEADER */}
      <header className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shrink-0 shadow-sm z-30 transition-colors duration-200">
        {/* Left: Sidebar Toggle (main view), App Title & Top Menu */}
        <div className="flex items-center gap-2.5">
          {activeView === 'ordomachine' && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? t('header.collapseSidebar') : t('header.expandSidebar')}
              aria-label={isSidebarOpen ? t('header.collapseSidebar') : t('header.expandSidebar')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer mr-0.5"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
          )}
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
          <h1 className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100">{t('app.title')}</h1>

          <MainNavMenu activeView={activeView} onSelectView={setActiveView} />
        </div>

        {/* Right: Theme Toggle & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle (Day / Night mode switcher) */}
          <ThemeToggle />

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1"></div>

          {/* Language Selector */}
          <LanguageSelector />
        </div>
      </header>

      {/* Hidden File Input (kept mounted regardless of sidebar state) */}
      <input
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Confirmation Modal when an import file is selected */}
      {pendingImportData && pendingMeta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                  {t('header.confirmRestoreTitle')}
                </h3>
              </div>
              <button
                onClick={() => setPendingImportData(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {t('header.confirmRestoreDesc', {
                elements: pendingMeta.elements,
                characteristics: pendingMeta.characteristics,
                date: pendingMeta.date
              })}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPendingImportData(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                {t('header.cancel')}
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {t('header.confirmRestoreBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE: LEFT VERTICAL PHASE STEPPER + RIGHT SCROLLABLE PHASES */}
      {activeView === 'ordomachine' && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* LEFT VERTICAL STEPPER SIDEBAR */}
          <aside
            className={`transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 hidden md:flex flex-col justify-between overflow-y-auto ${
              isSidebarOpen ? 'w-72 lg:w-80 p-5' : 'w-0 p-0 overflow-hidden border-r-0 opacity-0 pointer-events-none'
            }`}
          >
            <div>
              {/* Case Actions (Export / Import) */}
              <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleExportCase}
                  title={t('header.exportCase')}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/90 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{t('header.exportCase')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={t('header.importCase')}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/90 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{t('header.importCase')}</span>
                </button>
              </div>

              <PhaseStepper
                activePhase={activePhase}
                onSelectPhase={scrollToPhase}
                characteristics={dataset.characteristics}
                activeCharIdx={activeCharIdx}
                onSelectCharIdx={(idx) => {
                  setActiveCharIdx(idx);
                  scrollToPhase(1);
                }}
              />
            </div>
          </aside>

        {/* RIGHT MAIN SCROLLABLE CONTAINER */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 scroll-smooth transition-colors duration-200"
        >
          <div className="max-w-[1360px] mx-auto space-y-8 pb-16">
            
            {/* --- PHASE 1 SECTION --- */}
            <section id="phase-section-0" className="scroll-mt-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                    {t('nav.phase')} 01
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('nav.configuration')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCollapsePhase(0)}
                  title={collapsedPhases[0] ? t('nav.expandPhase', { num: '01' }) : t('nav.collapsePhase', { num: '01' })}
                  aria-label={collapsedPhases[0] ? t('nav.expandPhase', { num: '01' }) : t('nav.collapsePhase', { num: '01' })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  {collapsedPhases[0] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              {!collapsedPhases[0] && (
                <ConfigPhase dataset={dataset} onUpdateDataset={setDataset} />
              )}
            </section>

            {/* --- PHASE 2 SECTION --- */}
            <section id="phase-section-1" className="scroll-mt-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                    {t('nav.phase')} 02
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('nav.characteristicAnalysis')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCollapsePhase(1)}
                  title={collapsedPhases[1] ? t('nav.expandPhase', { num: '02' }) : t('nav.collapsePhase', { num: '02' })}
                  aria-label={collapsedPhases[1] ? t('nav.expandPhase', { num: '02' }) : t('nav.collapsePhase', { num: '02' })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  {collapsedPhases[1] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              {!collapsedPhases[1] && (
                <CharacteristicPhase
                  dataset={dataset}
                  activeCharIdx={activeCharIdx}
                  onSelectCharIdx={setActiveCharIdx}
                  processedChars={calculation.chars}
                  onUpdateDataset={setDataset}
                />
              )}
            </section>

            {/* --- PHASE 3 SECTION --- */}
            <section id="phase-section-2" className="scroll-mt-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                    {t('nav.phase')} 03
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('nav.aggregationAnalysis')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCollapsePhase(2)}
                  title={collapsedPhases[2] ? t('nav.expandPhase', { num: '03' }) : t('nav.collapsePhase', { num: '03' })}
                  aria-label={collapsedPhases[2] ? t('nav.expandPhase', { num: '03' }) : t('nav.collapsePhase', { num: '03' })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  {collapsedPhases[2] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              {!collapsedPhases[2] && (
                <AggregationPhase
                  dataset={dataset}
                  agg={calculation.agg}
                  onUpdateDataset={setDataset}
                />
              )}
            </section>

            {/* Persistent Author & Intellectual Property Footer */}
            <AppFooter />
          </div>
        </main>
        </div>
      )}

      {/* FLAVOUR WORKSPACE VIEWS (FULL WIDTH, NO LEFT SIDEBAR) */}
      {isFlavourId(activeView) && (
        <FlavourPage
          key={activeView}
          flavourCase={flavourCases[activeView]}
          onUpdateFlavourCase={updater =>
            setFlavourCases(prev => ({
              ...prev,
              [activeView]: updater(prev[activeView])
            }))
          }
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider defaultLanguage="es">
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Sliders,
  BarChart2,
  Network,
  Table,
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Card } from '../components/Card';
import { MatrixEditor } from '../components/MatrixEditor';
import { MatrixGraph } from '../components/MatrixGraph';
import { AggregationCalculationPlayer } from '../components/AggregationCalculationPlayer';
import { OrbBadge } from '../components/OrbBadge';
import { VectorBarChart } from '../components/VectorBarChart';
import { MathText } from '../components/Formula';
import { OrdomaticaDataset, AggregationResult } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';

export interface AggregationPhaseProps {
  dataset: OrdomaticaDataset;
  agg: AggregationResult;
  onUpdateDataset: (updater: (prev: OrdomaticaDataset) => OrdomaticaDataset) => void;
}

type AggDetailType = 'rwa' | 'final';
type FinalSortOrder = 'analysis' | 'rank-desc' | 'rank-asc';

const FlowConnector: React.FC<{ label?: React.ReactNode }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center my-0 select-none py-1">
    <div className="w-0.5 h-3.5 bg-indigo-300 dark:bg-indigo-600 transition-colors" />
    {label && (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-bold shadow-2xs">
        {typeof label === 'string' ? <MathText text={label} /> : label}
      </span>
    )}
    <div className="w-0.5 h-3.5 bg-indigo-300 dark:bg-indigo-600 transition-colors" />
  </div>
);

export const AggregationPhase: React.FC<AggregationPhaseProps> = ({ dataset, agg, onUpdateDataset }) => {
  const { t } = useI18n();
  const { elements, characteristics, cMatrix, owa } = dataset;
  const precision = dataset.decimalPrecision ?? 4;
  const maxScore = Math.max(...agg.A_final, 1);

  // Configuration Card collapse state
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Active detail modal/section: 'rwa' | 'final' | null
  const [activeDetail, setActiveDetail] = useState<AggDetailType | null>(null);

  // Sorting order for Final Aggregated Value: 'analysis' | 'rank-desc' | 'rank-asc'
  const [sortOrder, setSortOrder] = useState<FinalSortOrder>('analysis');

  // Toggle view modes (normal table/list vs graph) for the 3 main cards
  const [viewModes, setViewModes] = useState<Record<string, boolean>>({});

  const toggleViewMode = (key: string) => {
    setViewModes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isGraphMode = (key: string) => Boolean(viewModes[key]);

  const toggleDetail = (key: AggDetailType) => {
    setActiveDetail(prev => (prev === key ? null : key));
  };

  const cycleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === 'analysis') return 'rank-desc';
      if (prev === 'rank-desc') return 'rank-asc';
      return 'analysis';
    });
  };

  const handleUpdateCMatrix = (i: number, j: number, val: number | null) => {
    onUpdateDataset(prev => {
      const nextC = prev.cMatrix.map(row => [...row]);
      nextC[i][j] = val ?? 0;
      return { ...prev, cMatrix: nextC };
    });
  };

  const handleUpdateOwa = (_: number, j: number, val: number | null) => {
    onUpdateDataset(prev => {
      const nextOwa = [...prev.owa];
      nextOwa[j] = val ?? 0;
      return { ...prev, owa: nextOwa };
    });
  };

  // Determine element ordering for Final Aggregated Value
  const displayedIndices =
    sortOrder === 'analysis'
      ? elements.map((_, i) => i)
      : sortOrder === 'rank-desc'
      ? agg.ranking
      : [...agg.ranking].reverse();

  // Mode toggle button helper
  const renderModeToggle = (modeKey: string, isMatrix: boolean) => {
    const isGraph = isGraphMode(modeKey);
    return (
      <button
        type="button"
        onClick={() => toggleViewMode(modeKey)}
        title={isGraph ? t('agg.view.toTable') : isMatrix ? t('agg.view.toGraph') : t('agg.view.toChart')}
        aria-label={isGraph ? t('agg.view.toTable') : isMatrix ? t('agg.view.toGraph') : t('agg.view.toChart')}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer"
      >
        {isGraph ? (
          <Table className="w-3.5 h-3.5" />
        ) : isMatrix ? (
          <Network className="w-3.5 h-3.5" />
        ) : (
          <BarChart2 className="w-3.5 h-3.5" />
        )}
      </button>
    );
  };

  // Sort order button details
  const sortOrderConfig = {
    analysis: {
      icon: <ArrowDownUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />,
      tooltip: t('agg.sort.analysis'),
      classes: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
    },
    'rank-desc': {
      icon: <ArrowDownWideNarrow className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      tooltip: t('agg.sort.rankDesc'),
      classes: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60 ring-2 ring-amber-400/20'
    },
    'rank-asc': {
      icon: <ArrowUpNarrowWide className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      tooltip: t('agg.sort.rankAsc'),
      classes: 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 ring-2 ring-purple-400/20'
    }
  }[sortOrder];

  const charNames = characteristics.map(c => c.name);
  const owaSum = owa.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* 1. TOP CONFIGURATION CARD (Collapsible) */}
      <Card
        title={
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {t('agg.config.title')}
            </span>
          </div>
        }
        action={
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            title={isConfigOpen ? t('agg.config.collapse') : t('agg.config.expand')}
            aria-label={isConfigOpen ? t('agg.config.collapse') : t('agg.config.expand')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer"
          >
            {isConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        }
        className="w-full shadow-sm border-gray-200 dark:border-gray-800"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1 mb-4">
          {t('agg.config.desc')}
        </p>

        {isConfigOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-1">
            {/* 1. Matriz de Afinidad entre Dimensiones (C) */}
            <div className="p-4 bg-gray-50/60 dark:bg-gray-800/50 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('agg.cMatrix.title')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('agg.cMatrix.desc', { m: characteristics.length })}
                  </p>
                </div>
              </div>
              <MatrixEditor
                data={cMatrix}
                rows={charNames}
                cols={charNames}
                onChange={handleUpdateCMatrix}
                decimalPrecision={precision}
              />
            </div>

            {/* 2. Pesos OWA (Ordered Weighted Averaging) */}
            <div className="p-4 bg-gray-50/60 dark:bg-gray-800/50 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    {t('agg.owa.title')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('agg.owa.desc', { m: characteristics.length })}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                    Math.abs(owaSum - 1) < 1e-4
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  Σ w = {owaSum.toFixed(precision)}
                </span>
              </div>
              <MatrixEditor
                data={[owa]}
                rows={['w']}
                cols={characteristics.map((_, i) => `Pos ${i + 1}`)}
                onChange={handleUpdateOwa}
                decimalPrecision={precision}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('agg.owa.note')}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 2. DETAIL VIEW SECTION (when an active detail is selected) */}
      {activeDetail && (
        <div
          className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-4 ${
            activeDetail === 'rwa'
              ? 'border-2 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
          }`}
        >
          {/* Header of the Detail Container */}
          <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-gray-200/80 dark:border-gray-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${
                  activeDetail === 'rwa' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}
              />
              <h3 className="font-bold text-base tracking-tight truncate">
                <span
                  className={`font-black ${
                    activeDetail === 'rwa'
                      ? 'text-indigo-700 dark:text-indigo-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {activeDetail === 'rwa' && <MathText text={t('agg.detail.rwaTitle')} />}
                  {activeDetail === 'final' && t('agg.detail.finalTitle')}
                </span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setActiveDetail(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span>{t('char.detail.close')}</span>
            </button>
          </div>

          {/* DETAIL CONTENT: CARD 2 - PESOS REDISTRIBUIDOS (RWA) */}
          {activeDetail === 'rwa' && (
            <div className="flex flex-col space-y-2 w-full max-w-5xl mx-auto">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {t('agg.detail.rwaIntro')}
              </p>

              {/* Step 1: Matriz de Afinidad entre Dimensiones Normalizada (Cn) */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <span><MathText text={t('agg.detail.cnTitle')} /></span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      m × m
                    </span>
                  </div>
                }
                action={renderModeToggle('det-cn', true)}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <MathText text={t('agg.detail.cnDesc')} />
                </p>
                {isGraphMode('det-cn') ? (
                  <MatrixGraph
                    elements={charNames}
                    elementImages={characteristics.map(c => c.image || '')}
                    matrix={agg.Cn}
                    theme="indigo"
                    isDimension={true}
                    decimalPrecision={precision}
                  />
                ) : (
                  <MatrixEditor
                    data={agg.Cn}
                    rows={charNames}
                    cols={charNames}
                    readOnly
                    decimalPrecision={precision}
                  />
                )}
              </Card>

              {/* Flow Connector */}
              <FlowConnector label={t('agg.detail.flowOwap')} />

              {/* Step 2: Matriz de Pesos OWA Reordenados (OWAp) */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <span><MathText text={t('agg.detail.owapTitle')} /></span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      n × m
                    </span>
                  </div>
                }
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {t('agg.detail.owapDesc')}
                </p>
                <MatrixEditor
                  data={agg.OWAp}
                  rows={elements}
                  cols={charNames}
                  readOnly
                  decimalPrecision={precision}
                />
              </Card>

              {/* Flow Connector */}
              <FlowConnector label="OWA_p · C_n = RWA" />

              {/* Step 3: Matriz Resultante de Pesos Redistribuidos (RWA) */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <span>{t('agg.detail.rwaCardTitle')}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      n × m
                    </span>
                  </div>
                }
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {t('agg.detail.rwaCardDesc')}
                </p>
                <MatrixEditor
                  data={agg.RWA}
                  rows={elements}
                  cols={charNames}
                  readOnly
                  decimalPrecision={precision}
                />
              </Card>
            </div>
          )}

          {/* DETAIL CONTENT: CARD 3 - VALOR AGREGADO FINAL (A_final) */}
          {activeDetail === 'final' && (
            <div className="w-full max-w-5xl mx-auto">
              <AggregationCalculationPlayer
                elements={elements}
                elementImages={dataset.elementImages}
                characteristics={characteristics}
                V={agg.V}
                RWA={agg.RWA}
                A_final={agg.A_final}
                ranking={agg.ranking}
                decimalPrecision={precision}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN HORIZONTAL ROW: THE 3 PRINCIPAL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch pt-2">
        {/* CARD 1: MATRIZ DE VALORES AGREGABLES AJUSTADOS (V) */}
        <div className="relative pt-7 flex flex-col">
          <Card
            title={t('agg.card.vTitle')}
            className="flex-1 flex flex-col"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('agg.card.vDesc', { n: elements.length, m: characteristics.length })}
            </p>

            <div className="flex-1 overflow-x-auto no-scrollbar">
              <MatrixEditor
                data={agg.V}
                rows={elements}
                cols={charNames}
                readOnly
                decimalPrecision={precision}
              />
            </div>
          </Card>
        </div>

        {/* CARD 2: MATRIZ DE PESOS REDISTRIBUIDOS (RWA) */}
        <div className="relative pt-7 flex flex-col">
          {/* Centered Magnifying Glass Button (overlapping card top by 25%) */}
          <button
            type="button"
            onClick={() => toggleDetail('rwa')}
            title={activeDetail === 'rwa' ? t('agg.card.rwaHideDetail') : t('agg.card.rwaViewDetail')}
            aria-label={activeDetail === 'rwa' ? t('agg.card.rwaHideDetail') : t('agg.card.rwaViewDetail')}
            className={`absolute top-7 left-1/2 -translate-x-1/2 -translate-y-[75%] z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${
              activeDetail === 'rwa'
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-md border-2 border-white dark:border-gray-900 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <Card
            title={t('agg.card.rwaTitle')}
            action={renderModeToggle('rwa', false)}
            className="flex-1 flex flex-col"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('agg.card.rwaDesc', { n: elements.length, m: characteristics.length })}
            </p>

            {isGraphMode('rwa') ? (
              <div className="space-y-3 py-2 flex-1">
                {elements.map((el, i) => {
                  const rowValues = agg.RWA[i] || [];
                  const rowSum = rowValues.reduce((a, b) => a + b, 0);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <OrbBadge name={el} image={dataset.elementImages?.[i]} size="xs" color="indigo" />
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{el}</span>
                        </div>
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                          Σ: {rowSum.toFixed(precision)}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                        {rowValues.map((v, j) => (
                          <div
                            key={j}
                            style={{ width: `${(1 / rowValues.length) * 100}%` }}
                            className="h-full border-r border-white/40 dark:border-gray-900/40 last:border-r-0 transition-all"
                            title={`${characteristics[j]?.name}: ${v.toFixed(precision)}`}
                          >
                            <div
                              className="h-full bg-indigo-500"
                              style={{ width: `${Math.min(100, Math.max(0, v * 100))}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto no-scrollbar">
                <MatrixEditor
                  data={agg.RWA}
                  rows={elements}
                  cols={charNames}
                  readOnly
                  decimalPrecision={precision}
                />
              </div>
            )}
          </Card>
        </div>

        {/* CARD 3: VALOR AGREGADO FINAL (A_final) */}
        <div className="relative pt-7 flex flex-col">
          {/* Centered Magnifying Glass Button (overlapping card top by 25%) */}
          <button
            type="button"
            onClick={() => toggleDetail('final')}
            title={activeDetail === 'final' ? t('agg.card.finalHideDetail') : t('agg.card.finalViewDetail')}
            aria-label={activeDetail === 'final' ? t('agg.card.finalHideDetail') : t('agg.card.finalViewDetail')}
            className={`absolute top-7 left-1/2 -translate-x-1/2 -translate-y-[75%] z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${
              activeDetail === 'final'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40 shadow-md border-2 border-white dark:border-gray-900 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <Card
            title={t('agg.card.finalTitle')}
            action={
              <div className="flex items-center gap-1.5">
                {/* 3-State Order Cycle Button */}
                <button
                  type="button"
                  onClick={cycleSortOrder}
                  title={sortOrderConfig.tooltip}
                  aria-label={sortOrderConfig.tooltip}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${sortOrderConfig.classes}`}
                >
                  {sortOrderConfig.icon}
                </button>

                {/* View Mode Toggle Button */}
                {renderModeToggle('final', false)}
              </div>
            }
            className="flex-1 flex flex-col"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('agg.card.finalDesc')}
            </p>

            {isGraphMode('final') ? (
              <div className="py-2 flex-1">
                <VectorBarChart
                  elements={displayedIndices.map(i => elements[i])}
                  elementImages={dataset.elementImages ? displayedIndices.map(i => dataset.elementImages?.[i] || '') : undefined}
                  values={displayedIndices.map(i => agg.A_final[i] ?? 0)}
                  color="emerald"
                  decimalPrecision={precision}
                />
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {displayedIndices.map(i => {
                  const el = elements[i];
                  const val = agg.A_final[i] ?? 0;
                  const rank = agg.ranking.indexOf(i) + 1;
                  const isTop = rank === 1;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isTop
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 shadow-xs'
                          : 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-900/40 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                            isTop
                              ? 'bg-amber-500 text-white font-black shadow-2xs'
                              : rank <= 3
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold'
                              : 'text-gray-400 dark:text-gray-500 text-[11px]'
                          }`}
                          title={t('agg.card.rankTooltip', { rank })}
                        >
                          #{rank}
                        </span>

                        {/* Element Badge */}
                        <OrbBadge
                          name={el}
                          image={dataset.elementImages?.[i]}
                          size="xs"
                          color={isTop ? 'amber' : 'emerald'}
                        />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {el}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Score progress bar */}
                        <div className="w-14 sm:w-20 h-2 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isTop ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${maxScore > 0 ? (val / maxScore) * 100 : 0}%` }}
                          />
                        </div>

                        {/* Value Box */}
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md tabular-nums shadow-2xs">
                          {val.toFixed(precision)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

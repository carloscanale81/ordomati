import React, { useState } from 'react';
import {
  Sliders,
  Lock,
  Table,
  Network,
  ChevronDown,
  ChevronUp,
  Database,
  Scale,
  GitFork,
  SlidersHorizontal
} from 'lucide-react';
import {
  MatchPlayer,
  TimelineSegment,
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig
} from '../../logic/soccerAnalysis';
import { SynergyConfig } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';
import { SoccerPitchGraph } from './SoccerPitchGraph';

export interface SoccerContextualAffinityPanelProps {
  segment: TimelineSegment;
  players: MatchPlayer[];
  AC: number[][];
  passCounts?: number[][];
  teamKey?: 'home' | 'away';
  propagationConfig?: SoccerPropagationConfig;
  onUpdatePropagation?: (next: SoccerPropagationConfig) => void;
  blockingConfig?: SoccerBlockingConfig;
  onUpdateBlocking?: (next: SoccerBlockingConfig) => void;
  synergyConfig: SynergyConfig;
  onUpdateSynergy: (next: SynergyConfig) => void;
  relativeConfig?: SoccerRelativeAdjustmentConfig;
  onUpdateRelativeAdjustment?: (next: SoccerRelativeAdjustmentConfig) => void;
  equalizationConfig?: SoccerEqualizationConfig;
  onUpdateEqualization?: (next: SoccerEqualizationConfig) => void;
  crestUrl?: string;
  className?: string;
}

export const SoccerContextualAffinityPanel: React.FC<SoccerContextualAffinityPanelProps> = ({
  segment,
  players,
  AC,
  passCounts,
  teamKey = 'home',
  propagationConfig = { type: 'maxRatio' },
  onUpdatePropagation,
  blockingConfig = { type: 'none' },
  onUpdateBlocking,
  synergyConfig = { type: 'none', k: 1.0 },
  onUpdateSynergy,
  relativeConfig = { type: 'none' },
  onUpdateRelativeAdjustment,
  equalizationConfig = { type: 'max' },
  onUpdateEqualization,
  crestUrl,
  className = ''
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'matrix' | 'graph'>('graph');
  const [showDistanceDebug, setShowDistanceDebug] = useState(false);

  return (
    <div
      className={`rounded-2xl p-4 bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 space-y-4 ${className}`}
    >
      {/* 1. Configuration of the 5 Functions: Propagación, Bloqueo, Sinergia, Ajuste Relativo, Ajuste por Equiparación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Box 1: Función de Propagación F_P (Default: maxRatio) */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-purple-200 dark:border-purple-900/60 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2">
            <GitFork className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.affinity.propagationTitle')}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <select
              value={propagationConfig.type || 'maxRatio'}
              onChange={e => onUpdatePropagation?.({ ...propagationConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer font-medium"
            >
              <option value="maxRatio">{t('soccer.affinity.propagationTypeMaxRatio')}</option>
              <option value="triangular">{t('soccer.affinity.propagationTypeTriangular')}</option>
              <option value="rectangular">{t('soccer.affinity.propagationTypeRectangular')}</option>
              <option value="sinusoidal">{t('soccer.affinity.propagationTypeSinusoidal')}</option>
              <option value="inhibited">{t('soccer.affinity.propagationTypeInhibited')}</option>
              <option value="custom">{t('soccer.affinity.propagationTypeCustom')}</option>
            </select>

            {propagationConfig.type === 'custom' && (
              <input
                type="text"
                value={propagationConfig.customExpr || 'd / L'}
                onChange={e => onUpdatePropagation?.({ ...propagationConfig, customExpr: e.target.value })}
                placeholder="d / L"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {propagationConfig.type === 'triangular'
                ? t('soccer.affinity.propagationDescTriangular')
                : propagationConfig.type === 'rectangular'
                ? t('soccer.affinity.propagationDescRectangular')
                : propagationConfig.type === 'sinusoidal'
                ? t('soccer.affinity.propagationDescSinusoidal')
                : propagationConfig.type === 'inhibited'
                ? t('soccer.affinity.propagationDescInhibited')
                : propagationConfig.type === 'custom'
                ? t('soccer.affinity.propagationDescCustom')
                : t('soccer.affinity.propagationDescMaxRatio')}
            </p>
          </div>
        </div>

        {/* Box 2: Función de Bloqueo F_B (Default: none) */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.affinity.blockingTitle')}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <select
              value={blockingConfig.type || 'none'}
              onChange={e => onUpdateBlocking?.({ ...blockingConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
            >
              <option value="none">{t('soccer.affinity.blockingTypeNone')}</option>
              <option value="threshold">{t('soccer.affinity.blockingTypeThreshold')}</option>
            </select>

            {blockingConfig.type === 'threshold' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">θ =</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={blockingConfig.threshold ?? 0.15}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    onUpdateBlocking?.({ ...blockingConfig, threshold: isNaN(parsed) ? 0.15 : parsed });
                  }}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {blockingConfig.type === 'threshold'
                ? t('soccer.affinity.blockingDescThreshold')
                : t('soccer.affinity.blockingDescNone')}
            </p>
          </div>
        </div>

        {/* Box 3: Función de Sinergia F_S (Default: none) */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.dimension.synergyTitle')}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <select
              value={synergyConfig?.type || 'none'}
              onChange={e => onUpdateSynergy({ ...synergyConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="none">{t('soccer.dimension.synergyTypeNone')}</option>
              <option value="factor">{t('soccer.dimension.synergyTypeFactor')}</option>
              <option value="custom">{t('soccer.dimension.synergyTypeCustom')}</option>
            </select>

            {synergyConfig?.type === 'factor' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">k =</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  value={synergyConfig.k ?? 1.0}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    onUpdateSynergy({ ...synergyConfig, k: isNaN(parsed) ? 1.0 : parsed });
                  }}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                />
              </div>
            )}

            {synergyConfig?.type === 'custom' && (
              <input
                type="text"
                value={synergyConfig.customExpr || 'a * k'}
                onChange={e => onUpdateSynergy({ ...synergyConfig, customExpr: e.target.value })}
                placeholder="a * k"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {synergyConfig?.type === 'factor'
                ? 'Modula afinidad según factor k'
                : synergyConfig?.type === 'custom'
                ? 'Modula según fórmula personalizada'
                : 'A^C = A^AI (sin sinergia)'}
            </p>
          </div>
        </div>

        {/* Box 4: Ajuste Relativo c_a (Default: none) */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.affinity.relativeTitle')}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <select
              value={relativeConfig.type || 'none'}
              onChange={e => onUpdateRelativeAdjustment?.({ ...relativeConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="none">{t('soccer.affinity.relativeTypeNone')}</option>
              <option value="byMinutes">{t('soccer.affinity.relativeTypeMinutes')}</option>
              <option value="byTouches">{t('soccer.affinity.relativeTypeTouches')}</option>
              <option value="byMean">{t('soccer.affinity.relativeTypeMean')}</option>
            </select>

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {relativeConfig.type === 'byMinutes'
                ? t('soccer.affinity.relativeDescMinutes')
                : relativeConfig.type === 'byTouches'
                ? t('soccer.affinity.relativeDescTouches')
                : relativeConfig.type === 'byMean'
                ? t('soccer.affinity.relativeDescMean')
                : t('soccer.affinity.relativeDescNone')}
            </p>
          </div>
        </div>

        {/* Box 5: Ajuste por Equiparación c_n (Default: max) */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2">
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.affinity.equalizationTitle')}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <select
              value={equalizationConfig.type || 'max'}
              onChange={e => onUpdateEqualization?.({ ...equalizationConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <option value="max">{t('soccer.affinity.equalizationTypeMax')}</option>
              <option value="sum">{t('soccer.affinity.equalizationTypeSum')}</option>
              <option value="none">{t('soccer.affinity.equalizationTypeNone')}</option>
            </select>

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {equalizationConfig.type === 'sum'
                ? t('soccer.affinity.equalizationDescSum')
                : equalizationConfig.type === 'none'
                ? t('soccer.affinity.equalizationDescNone')
                : t('soccer.affinity.equalizationDescMax')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Contextual Affinity Matrix Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.dimension.acTitle')} ({segment.startMinute}' - {segment.endMinute}')
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
            {segment.team === 'home' ? t('soccer.timeline.homeTeam') : t('soccer.timeline.awayTeam')}
          </span>
        </div>

        {/* Mode Toggle: Matrix Table vs Pitch Graph */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            title={t('soccer.dimension.modeMatrix')}
            aria-label={t('soccer.dimension.modeMatrix')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{t('soccer.dimension.modeMatrix')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('graph')}
            title={t('soccer.dimension.modeGraph')}
            aria-label={t('soccer.dimension.modeGraph')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{t('soccer.dimension.modeGraph')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Affinity Content: Horizontal Soccer Pitch Graph OR Matrix Table */}
      {viewMode === 'graph' ? (
        <div className="py-2">
          <SoccerPitchGraph
            players={players}
            matrix={AC}
            teamKey={teamKey || segment.team}
            teamName={segment.teamName}
            crestUrl={crestUrl}
            decimalPrecision={2}
          />
        </div>
      ) : (
        /* Matrix View Mode (Clean, uncolored table) */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-2 text-left text-[11px] text-gray-500 dark:text-gray-400 font-bold w-28">
                  #
                </th>
                {players.map((colP, j) => (
                  <th
                    key={j}
                    className="p-1.5 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 min-w-[34px]"
                    title={`#${colP.shirtNo} ${colP.name}`}
                  >
                    #{colP.shirtNo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((rowP, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td
                    className="p-1.5 text-left font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                    title={`#${rowP.shirtNo} ${rowP.name}`}
                  >
                    <span className="font-mono text-gray-500 dark:text-gray-400 mr-1.5 font-bold">
                      #{rowP.shirtNo}
                    </span>
                    {rowP.name}
                  </td>
                  {players.map((colP, j) => {
                    const val = AC[i]?.[j] ?? 0;
                    const isDiag = i === j;

                    return (
                      <td
                        key={j}
                        title={`${rowP.name} → ${colP.name}: ${isDiag ? '1.00' : val.toFixed(2)}`}
                        className="p-1.5 font-mono text-[11px] text-gray-800 dark:text-gray-200"
                      >
                        {isDiag ? '1.00' : val > 0 ? val.toFixed(2) : '0'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Collapsible Debug Section: Raw Base Pass / Distance Matrix */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowDistanceDebug(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs transition-all cursor-pointer select-none"
        >
          <Database className="w-3.5 h-3.5 text-gray-500" />
          <span>
            {showDistanceDebug
              ? t('soccer.affinity.hideDistanceDebug') || 'Ocultar depuración de pases / distancia'
              : t('soccer.affinity.distanceMatrixDebug') || 'Depuración: Matriz de pases / distancia (conteo base)'}
          </span>
          {showDistanceDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDistanceDebug && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Conteo de pases puros completados entre jugadores en este segmento (base de afinidad sinérgica):
            </div>
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2 text-left text-[11px] text-gray-500 dark:text-gray-400 font-bold w-28">
                    #
                  </th>
                  {players.map((colP, j) => (
                    <th
                      key={j}
                      className="p-1.5 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 min-w-[34px]"
                      title={`#${colP.shirtNo} ${colP.name}`}
                    >
                      #{colP.shirtNo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((rowP, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td
                      className="p-1.5 text-left font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                      title={`#${rowP.shirtNo} ${rowP.name}`}
                    >
                      <span className="font-mono text-gray-500 dark:text-gray-400 mr-1.5 font-bold">
                        #{rowP.shirtNo}
                      </span>
                      {rowP.name}
                    </td>
                    {players.map((colP, j) => {
                      const count = passCounts?.[i]?.[j] ?? 0;
                      const isDiag = i === j;

                      return (
                        <td
                          key={j}
                          title={`${rowP.name} → ${colP.name}: ${isDiag ? '-' : count}`}
                          className="p-1.5 font-mono text-[11px] text-gray-800 dark:text-gray-200"
                        >
                          {isDiag ? '-' : count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

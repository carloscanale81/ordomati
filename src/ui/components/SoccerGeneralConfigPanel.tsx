import React, { useState } from 'react';
import { Sliders, Grid, Table, Network } from 'lucide-react';
import {
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig,
  SoccerOwaConfig,
  SoccerOwaType,
  SOCCER_OWA_PRESETS,
  SOCCER_CONCEPTS
} from '../../logic/soccerAnalysis';
import { SynergyConfig } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';
import { DecimalInput } from './DecimalInput';
import {
  SoccerPipelineFunctionsConfig,
  PipelineFunctionKey
} from './SoccerPipelineFunctionsConfig';
import { SoccerDimensionGraph } from './SoccerDimensionGraph';

export interface SoccerGeneralConfigPanelProps {
  propagationConfig: SoccerPropagationConfig;
  onUpdatePropagation: (next: SoccerPropagationConfig) => void;
  blockingConfig: SoccerBlockingConfig;
  onUpdateBlocking: (next: SoccerBlockingConfig) => void;
  synergyConfig: SynergyConfig;
  onUpdateSynergy: (next: SynergyConfig) => void;
  relativeConfig: SoccerRelativeAdjustmentConfig;
  onUpdateRelativeAdjustment: (next: SoccerRelativeAdjustmentConfig) => void;
  equalizationConfig: SoccerEqualizationConfig;
  onUpdateEqualization: (next: SoccerEqualizationConfig) => void;
  disabledKeys?: Partial<Record<PipelineFunctionKey, boolean>>;
  disabledNotes?: Partial<Record<PipelineFunctionKey, string>>;
  owaConfig: SoccerOwaConfig;
  onUpdateOwa: (next: SoccerOwaConfig) => void;
  dimAffinityMatrix: number[][];
  onUpdateDimAffinity: (next: number[][]) => void;
  className?: string;
}

export const SoccerGeneralConfigPanel: React.FC<SoccerGeneralConfigPanelProps> = ({
  propagationConfig,
  onUpdatePropagation,
  blockingConfig,
  onUpdateBlocking,
  synergyConfig,
  onUpdateSynergy,
  relativeConfig,
  onUpdateRelativeAdjustment,
  equalizationConfig,
  onUpdateEqualization,
  disabledKeys,
  disabledNotes,
  owaConfig,
  onUpdateOwa,
  dimAffinityMatrix,
  onUpdateDimAffinity,
  className = ''
}) => {
  const { t } = useI18n();
  const [dimAffinityViewMode, setDimAffinityViewMode] = useState<'table' | 'graph'>('table');

  const handleOwaPresetChange = (type: SoccerOwaType) => {
    onUpdateOwa({
      type,
      weights: [...SOCCER_OWA_PRESETS[type]]
    });
  };

  const handleOwaWeightChange = (index: number, val: number) => {
    const nextWeights = [...owaConfig.weights];
    nextWeights[index] = Math.max(0, Math.min(1, val));
    onUpdateOwa({
      type: 'custom',
      weights: nextWeights
    });
  };

  const handleDimCellChange = (r: number, c: number, val: number) => {
    if (r === c) return;
    const clamped = Math.max(0, Math.min(1, val));
    const next = dimAffinityMatrix.map((row, i) =>
      row.map((cell, j) => {
        if (i === r && j === c) return clamped;
        // Keep symmetric by default for dimension correlation
        if (i === c && j === r) return clamped;
        return cell;
      })
    );
    onUpdateDimAffinity(next);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Funciones del Pipeline de Cálculo */}
      <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 w-full shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.generalConfig.functionsTitle') || 'Funciones del Pipeline de Cálculo'}
            </h3>
          </div>
        </div>

        <SoccerPipelineFunctionsConfig
          propagationConfig={propagationConfig}
          onUpdatePropagation={onUpdatePropagation}
          blockingConfig={blockingConfig}
          onUpdateBlocking={onUpdateBlocking}
          synergyConfig={synergyConfig}
          onUpdateSynergy={onUpdateSynergy}
          relativeConfig={relativeConfig}
          onUpdateRelativeAdjustment={onUpdateRelativeAdjustment}
          equalizationConfig={equalizationConfig}
          onUpdateEqualization={onUpdateEqualization}
          disabledKeys={disabledKeys}
          disabledNotes={disabledNotes}
        />
      </div>

      {/* 2. Operador OWA (Ancho completo) */}
      <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 w-full shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-baseline gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 self-center" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.aggregate.owaTitle')}
            </h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
              Ordered Weighted Averaging Operator
            </span>
          </div>

          {/* OWA Preset Selector (Clean buttons without parentheses) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['average', 'specialist', 'balanced'] as SoccerOwaType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleOwaPresetChange(type)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  owaConfig.type === type
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {t(`soccer.aggregate.owaPresets.${type}`)}
              </button>
            ))}
            {owaConfig.type === 'custom' && (
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {t('soccer.aggregate.owaPresets.custom')}
              </span>
            )}
          </div>
        </div>

        {/* 12 Individual OWA Weights Inputs (Pos. 1 .. 12) Full Width */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 pt-1">
          {owaConfig.weights.map((weight, idx) => (
            <div key={idx} className="space-y-1">
              <label
                className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate"
                title={`w${idx + 1} (Posición ${idx + 1})`}
              >
                w{idx + 1} (Pos. {idx + 1})
              </label>
              <DecimalInput
                min={0}
                max={1}
                value={weight !== undefined ? Math.round(weight * 10000) / 10000 : 0.0833}
                onChange={val => handleOwaWeightChange(idx, val)}
                className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Matriz de Afinidad entre Dimensiones C (Ancho completo, Modo Tabla y Modo Gráfico) */}
      <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 w-full shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-baseline gap-2">
            <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 self-center" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {t('soccer.aggregate.dimAffinityTitle')}
            </h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
              {t('soccer.aggregate.dimAffinitySubtitle')}
            </span>
          </div>

          {/* Table Mode / Graph Mode Toggle (Tabla / Grafo) */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDimAffinityViewMode('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                dimAffinityViewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t('soccer.aggregate.dimAffinityModeTable')}</span>
            </button>
            <button
              type="button"
              onClick={() => setDimAffinityViewMode('graph')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                dimAffinityViewMode === 'graph'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('soccer.aggregate.dimAffinityModeGraph')}</span>
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {dimAffinityViewMode === 'table' ? (
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10 shadow-2xs">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-1.5 text-[10px] text-gray-500 font-sans text-left sticky left-0 bg-white dark:bg-gray-800 z-20">
                    Dim
                  </th>
                  {SOCCER_CONCEPTS.map(c => (
                    <th
                      key={c.key}
                      className="p-1.5 text-[10px] text-gray-600 dark:text-gray-400 font-semibold"
                      title={c.name}
                    >
                      {c.name.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOCCER_CONCEPTS.map((rowC, r) => (
                  <tr key={rowC.key} className="border-b border-gray-100 dark:border-gray-800">
                    <td
                      className="p-1.5 text-[10px] text-gray-600 dark:text-gray-400 font-sans font-semibold text-left sticky left-0 bg-white dark:bg-gray-800 z-10"
                      title={rowC.name}
                    >
                      {rowC.name.slice(0, 3)}
                    </td>
                    {SOCCER_CONCEPTS.map((colC, c) => {
                      const isDiag = r === c;
                      const val = dimAffinityMatrix[r]?.[c] ?? (isDiag ? 1.0 : 0.5);
                      return (
                        <td key={colC.key} className="p-0.5">
                          {isDiag ? (
                            <span className="inline-block w-10 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-[10px]">
                              1.00
                            </span>
                          ) : (
                            <DecimalInput
                              min={0}
                              max={1}
                              value={val}
                              onChange={newV => handleDimCellChange(r, c, newV)}
                              className="w-10 py-0.5 text-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-2">
            <SoccerDimensionGraph
              matrix={dimAffinityMatrix}
              decimalPrecision={2}
            />
          </div>
        )}
      </div>
    </div>
  );
};

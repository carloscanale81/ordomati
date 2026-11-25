import React, { useState, useMemo } from 'react';
import { Sliders, Grid } from 'lucide-react';
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

  // Hover state for interactive matrix row/column/cell crosshair zoom
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  // Editing state for direct numeric input in hovered cell
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editingText, setEditingText] = useState<string>('');

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

  // Determine min and max across all cells to calculate heat-map gradient
  const { minVal, maxVal } = useMemo(() => {
    let min = 1;
    let max = 0;
    const n = SOCCER_CONCEPTS.length;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = dimAffinityMatrix[r]?.[c] ?? (r === c ? 1.0 : 0.5);
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    return { minVal: min, maxVal: max > min ? max : 1.0 };
  }, [dimAffinityMatrix]);

  // Color gradient function between minVal and maxVal: more pronounced within the indigo/blue spectrum
  const getHeatmapColor = (val: number, isDiag: boolean) => {
    if (isDiag) {
      return {
        bg: 'rgba(67, 56, 202, 0.40)', // Strong indigo-700 tint for diagonal
        color: '#312e81',
        border: 'rgba(67, 56, 202, 0.7)'
      };
    }
    const range = maxVal - minVal;
    const ratio = range > 0.0001 ? Math.max(0, Math.min(1, (val - minVal) / range)) : 0.5;

    // Pronounced gradient:
    // Low values: light translucent blue (opacity ~0.15)
    // High values: intense indigo (opacity up to 0.85) with high contrast text
    if (ratio < 0.5) {
      const subRatio = ratio / 0.5;
      const opacity = 0.12 + subRatio * 0.30;
      return {
        bg: `rgba(96, 165, 250, ${opacity.toFixed(3)})`, // blue-400 base
        color: subRatio > 0.4 ? '#1e3a8a' : '#2563eb',
        border: `rgba(96, 165, 250, ${(opacity * 1.4).toFixed(3)})`
      };
    } else {
      const subRatio = (ratio - 0.5) / 0.5;
      const opacity = 0.42 + subRatio * 0.46;
      return {
        bg: `rgba(79, 70, 229, ${opacity.toFixed(3)})`, // indigo-600 base
        color: subRatio > 0.35 ? '#ffffff' : '#1e1b4b',
        border: `rgba(79, 70, 229, ${(opacity * 1.2).toFixed(3)})`
      };
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 items-start ${className}`}>
      {/* Columna Izquierda (2 tercios): Funciones del Pipeline y Operador OWA */}
      <div className="lg:col-span-2 space-y-4">
        {/* 1. Funciones del Pipeline de Cálculo */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-2xs">
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

        {/* 2. Operador OWA */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap items-baseline gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 self-center" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.aggregate.owaTitle')}
              </h3>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                Ordered Weighted Averaging
              </span>
            </div>

            {/* OWA Preset Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['average', 'specialist', 'balanced'] as SoccerOwaType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleOwaPresetChange(type)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    owaConfig.type === type
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {t(`soccer.aggregate.owaPresets.${type}`)}
                </button>
              ))}
              {owaConfig.type === 'custom' && (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {t('soccer.aggregate.owaPresets.custom')}
                </span>
              )}
            </div>
          </div>

          {/* 12 Individual OWA Weights Inputs (Pos. 1 .. 12) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-1.5 pt-1">
            {owaConfig.weights.map((weight, idx) => (
              <div key={idx} className="space-y-1">
                <label
                  className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate"
                  title={`w${idx + 1} (Posición ${idx + 1})`}
                >
                  w{idx + 1}
                </label>
                <DecimalInput
                  min={0}
                  max={1}
                  value={weight !== undefined ? Math.round(weight * 10000) / 10000 : 0.0833}
                  onChange={val => handleOwaWeightChange(idx, val)}
                  className="w-full h-7 px-1 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha (1 tercio): Matriz de Afinidad Interdimensional con Gradiente Marcado y Capa de Foco */}
      <div className="lg:col-span-1 p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-2.5 shadow-2xs self-start">
        {/* Subtarjeta Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
              {t('soccer.aggregate.dimAffinityTitle')}
            </h3>
          </div>

          {/* Gradient Legend / Range Pill */}
          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono shrink-0">
            <span>{minVal.toFixed(2)}</span>
            <div className="w-12 h-2 rounded-full bg-gradient-to-r from-blue-300 via-indigo-500 to-indigo-800 opacity-90 border border-gray-300/60 dark:border-gray-750" />
            <span>{maxVal.toFixed(2)}</span>
          </div>
        </div>

        {/* Compact Responsive Heat-map Matrix with Full Column and Row Headers */}
        <div
          className="w-full select-none"
          onMouseLeave={() => {
            setHoveredCell(null);
            setEditingCell(null);
          }}
        >
          <div className="w-full max-w-full overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-[1.5px] text-center font-mono">
              <thead>
                <tr>
                  <th className="w-16 p-0 text-[8px] text-gray-400 font-normal text-left"></th>
                  {SOCCER_CONCEPTS.map((c, colIdx) => {
                    const isColHovered = hoveredCell?.c === colIdx;
                    return (
                      <th
                        key={c.key}
                        className={`p-0 text-[8.5px] transition-all duration-150 truncate cursor-default pb-1 ${
                          isColHovered
                            ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110 z-10'
                            : 'text-gray-700 dark:text-gray-300 font-bold'
                        }`}
                        title={c.name}
                      >
                        {c.name.slice(0, 3)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SOCCER_CONCEPTS.map((rowC, r) => {
                  const isRowHovered = hoveredCell?.r === r;
                  return (
                    <tr key={rowC.key} className={isRowHovered ? 'z-10' : ''}>
                      {/* Full Row Header (Visible directly) */}
                      <td
                        className={`p-0 pr-1 text-[8px] text-left transition-all duration-150 truncate cursor-default font-mono ${
                          isRowHovered
                            ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105 z-10'
                            : 'text-gray-700 dark:text-gray-300 font-semibold'
                        }`}
                        title={rowC.name}
                      >
                        {rowC.name}
                      </td>

                      {/* Matrix Heatmap Cells */}
                      {SOCCER_CONCEPTS.map((colC, c) => {
                        const isDiag = r === c;
                        const val = dimAffinityMatrix[r]?.[c] ?? (isDiag ? 1.0 : 0.5);
                        const isCurrentCell = hoveredCell?.r === r && hoveredCell?.c === c;
                        const isInCrosshair = hoveredCell && (hoveredCell.r === r || hoveredCell.c === c);
                        const isEditing = editingCell?.r === r && editingCell?.c === c;
                        const heat = getHeatmapColor(val, isDiag);

                        return (
                          <td
                            key={colC.key}
                            onMouseEnter={() => setHoveredCell({ r, c })}
                            onClick={() => {
                              if (!isDiag) {
                                setEditingCell({ r, c });
                                setEditingText(String(val));
                              }
                            }}
                            className={`p-0 relative transition-transform duration-150 ${
                              isCurrentCell
                                ? 'scale-130 z-30 shadow-lg rounded-md'
                                : isInCrosshair
                                ? 'scale-108 z-20 shadow-2xs rounded-sm'
                                : 'rounded-[2px]'
                            }`}
                            style={{
                              backgroundColor: isCurrentCell
                                ? '#4338ca'
                                : heat.bg,
                              boxShadow: isCurrentCell ? '0 4px 12px rgba(67, 56, 202, 0.5)' : undefined
                            }}
                            title={`${rowC.name} ↔ ${colC.name}: ${val.toFixed(2)}`}
                          >
                            <div className="h-5 flex items-center justify-center cursor-pointer">
                              {isEditing ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={editingText}
                                  autoFocus
                                  onBlur={() => {
                                    const parsed = parseFloat(editingText.replace(',', '.'));
                                    if (!isNaN(parsed)) {
                                      handleDimCellChange(r, c, parsed);
                                    }
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      const parsed = parseFloat(editingText.replace(',', '.'));
                                      if (!isNaN(parsed)) {
                                        handleDimCellChange(r, c, parsed);
                                      }
                                      setEditingCell(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  onChange={e => {
                                    const clean = e.target.value.replace(',', '.');
                                    if (/^-?\d*\.?\d*$/.test(clean) || clean === '') {
                                      setEditingText(clean);
                                    }
                                  }}
                                  className="w-full h-full text-center text-[10px] font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded outline-none ring-2 ring-indigo-500 font-mono p-0 border-0"
                                />
                              ) : (
                                <span
                                  className={`block w-full text-center font-mono leading-none transition-all text-white ${
                                    isCurrentCell
                                      ? 'text-[11px] font-black'
                                      : isInCrosshair
                                      ? 'text-[9.5px] font-bold'
                                      : 'text-[7.5px] font-medium opacity-95'
                                  }`}
                                >
                                  {isCurrentCell ? val.toFixed(2) : isDiag ? '1' : val.toFixed(2).replace(/^0/, '')}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

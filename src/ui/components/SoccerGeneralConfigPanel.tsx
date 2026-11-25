import React, { useState, useMemo } from 'react';
import { Sliders, Grid, CheckSquare, Square, Layers } from 'lucide-react';
import {
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig,
  SoccerOwaConfig,
  SoccerOwaType,
  SoccerConcept,
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
  activeDimensions?: SoccerConcept[];
  onToggleDimension?: (concept: SoccerConcept, active: boolean) => void;
  onToggleAllDimensions?: (active: boolean) => void;
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
  activeDimensions,
  onToggleDimension,
  onToggleAllDimensions,
  className = ''
}) => {
  const { t } = useI18n();

  // Set of active dimension keys (default to all active if not passed)
  const activeDimSet = useMemo(() => {
    if (!activeDimensions) return new Set(SOCCER_CONCEPTS.map(c => c.key));
    return new Set(activeDimensions);
  }, [activeDimensions]);

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
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 items-start ${className}`}>
      {/* Columna Izquierda (50%): Funciones del Pipeline y Perfil de Pesos OWA */}
      <div className="space-y-4">
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

        {/* 2. Operador OWA / Pesos */}
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

          {/* Individual OWA Weights Inputs */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 gap-1.5 pt-1">
            {owaConfig.weights.slice(0, SOCCER_CONCEPTS.length).map((weight, idx) => (
              <div key={idx} className="space-y-1">
                <label
                  className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate text-center"
                  title={`w${idx + 1} (Posición ${idx + 1})`}
                >
                  w{idx + 1}
                </label>
                <DecimalInput
                  min={0}
                  max={1}
                  value={weight !== undefined ? Math.round(weight * 10000) / 10000 : 0.1}
                  onChange={val => handleOwaWeightChange(idx, val)}
                  className="w-full h-7 px-1 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha (50%): Matriz de Afinidad Interdimensional y Subtarjeta de Dimensiones Activas */}
      <div className="space-y-4">
        {/* 3. Matriz de Afinidad Interdimensional */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-2xs">
          {/* Subtarjeta Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                {t('soccer.aggregate.dimAffinityTitle')}
              </h3>
            </div>

            {/* Gradient Legend / Range Pill */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-mono shrink-0">
              <span>{minVal.toFixed(2)}</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-blue-300 via-indigo-500 to-indigo-800 opacity-90 border border-gray-300/60 dark:border-gray-750" />
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
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full table-fixed border-separate border-spacing-[2px] text-center font-mono">
                <thead>
                  <tr>
                    <th className="w-24 p-0 text-[8.5px] text-gray-400 font-normal text-left"></th>
                    {SOCCER_CONCEPTS.map((c, colIdx) => {
                      const isColHovered = hoveredCell?.c === colIdx;
                      const isActiveDim = activeDimSet.has(c.key);
                      return (
                        <th
                          key={c.key}
                          className={`p-0 text-[9px] transition-all duration-150 truncate cursor-default pb-1 ${
                            !isActiveDim
                              ? 'opacity-35 line-through text-gray-400 dark:text-gray-600'
                              : isColHovered
                              ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110 z-10'
                              : 'text-gray-700 dark:text-gray-300 font-bold'
                          }`}
                          title={`${c.name} ${!isActiveDim ? '(Desactivada)' : ''}`}
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
                    const isRowActive = activeDimSet.has(rowC.key);
                    return (
                      <tr key={rowC.key} className={isRowHovered ? 'z-10' : ''}>
                        {/* Row Header */}
                        <td
                          className={`p-0 pr-1.5 text-[9px] text-left transition-all duration-150 truncate cursor-default font-mono ${
                            !isRowActive
                              ? 'opacity-35 line-through text-gray-400 dark:text-gray-600'
                              : isRowHovered
                              ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105 z-10'
                              : 'text-gray-700 dark:text-gray-300 font-semibold'
                          }`}
                          title={`${rowC.name} ${!isRowActive ? '(Desactivada)' : ''}`}
                        >
                          {rowC.name}
                        </td>

                        {/* Matrix Heatmap Cells */}
                        {SOCCER_CONCEPTS.map((colC, c) => {
                          const isColActive = activeDimSet.has(colC.key);
                          const isCellDimActive = isRowActive && isColActive;
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
                                !isCellDimActive
                                  ? 'opacity-30'
                                  : isCurrentCell
                                  ? 'scale-125 z-30 shadow-lg rounded-md'
                                  : isInCrosshair
                                  ? 'scale-105 z-20 shadow-2xs rounded-sm'
                                  : 'rounded-[3px]'
                              }`}
                              style={{
                                backgroundColor: isCurrentCell
                                  ? '#4338ca'
                                  : heat.bg,
                                boxShadow: isCurrentCell ? '0 4px 12px rgba(67, 56, 202, 0.5)' : undefined
                              }}
                              title={`${rowC.name} ↔ ${colC.name}: ${val.toFixed(2)}`}
                            >
                              <div className="h-6 flex items-center justify-center cursor-pointer">
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
                                        ? 'text-[10px] font-bold'
                                        : 'text-[8.5px] font-medium opacity-95'
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

        {/* 4. Subtarjeta de Dimensiones Activas (Activar / Desactivar Dimensiones) */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                  {t('soccer.generalConfig.activeDimensionsTitle') || 'Dimensiones Activas en el Análisis'}
                </h3>
                <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                  {t('soccer.generalConfig.activeDimensionsSubtitle') || 'Selecciona qué dimensiones participan en la evaluación'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons (Activar todas / Desactivar todas) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleAllDimensions?.(true)}
                className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                {t('soccer.generalConfig.enableAllDimensions') || 'Activar todas'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAllDimensions?.(false)}
                className="px-2 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
              >
                {t('soccer.generalConfig.disableAllDimensions') || 'Desactivar todas'}
              </button>
            </div>
          </div>

          {/* Grid of Dimension Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {SOCCER_CONCEPTS.map(concept => {
              const isActive = activeDimSet.has(concept.key);
              return (
                <button
                  key={concept.key}
                  type="button"
                  onClick={() => onToggleDimension?.(concept.key, !isActive)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs'
                      : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isActive ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
                    )}
                    <span className="truncate">{concept.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  }`}>
                    {concept.unit}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  GitFork,
  Lock,
  Sliders,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import {
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig
} from '../../logic/soccerAnalysis';
import { SynergyConfig } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';
import { DecimalInput } from './DecimalInput';
import { FormulaCodeDisplay } from './FormulaCodeDisplay';

export type PipelineFunctionKey = 'propagation' | 'blocking' | 'synergy' | 'relative' | 'equalization';

export interface SoccerPipelineFunctionsConfigProps {
  propagationConfig?: SoccerPropagationConfig;
  onUpdatePropagation?: (next: SoccerPropagationConfig) => void;
  blockingConfig?: SoccerBlockingConfig;
  onUpdateBlocking?: (next: SoccerBlockingConfig) => void;
  synergyConfig?: SynergyConfig;
  onUpdateSynergy?: (next: SynergyConfig) => void;
  relativeConfig?: SoccerRelativeAdjustmentConfig;
  onUpdateRelativeAdjustment?: (next: SoccerRelativeAdjustmentConfig) => void;
  equalizationConfig?: SoccerEqualizationConfig;
  onUpdateEqualization?: (next: SoccerEqualizationConfig) => void;
  disabled?: boolean;
  disabledKeys?: Partial<Record<PipelineFunctionKey, boolean>>;
  visibleKeys?: Partial<Record<PipelineFunctionKey, boolean>>;
  disabledNotes?: Partial<Record<PipelineFunctionKey, string>>;
  compact?: boolean;
  className?: string;
}

export const SoccerPipelineFunctionsConfig: React.FC<SoccerPipelineFunctionsConfigProps> = ({
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
  disabled = false,
  disabledKeys,
  visibleKeys,
  disabledNotes,
  compact = false,
  className = ''
}) => {
  const { t } = useI18n();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isPropVisible = !visibleKeys || visibleKeys.propagation;
  const isBlockVisible = !visibleKeys || visibleKeys.blocking;
  const isSynVisible = !visibleKeys || visibleKeys.synergy;
  const isRelVisible = !visibleKeys || visibleKeys.relative;
  const isEqVisible = !visibleKeys || visibleKeys.equalization;

  const isPropDisabled = disabled || Boolean(disabledKeys?.propagation);
  const isBlockDisabled = disabled || Boolean(disabledKeys?.blocking);
  const isSynDisabled = disabled || Boolean(disabledKeys?.synergy);
  const isRelDisabled = disabled || Boolean(disabledKeys?.relative);
  const isEqDisabled = disabled || Boolean(disabledKeys?.equalization);

  const visibleBoxes = [
    { key: 'propagation', visible: isPropVisible },
    { key: 'blocking', visible: isBlockVisible },
    { key: 'synergy', visible: isSynVisible },
    { key: 'relative', visible: isRelVisible },
    { key: 'equalization', visible: isEqVisible }
  ];
  const allFiveVisible = visibleBoxes.every(b => b.visible);
  const visibleCount = visibleBoxes.filter(b => b.visible).length;

  const effectiveWidth = containerWidth ?? (typeof window !== 'undefined' ? (window.innerWidth >= 1500 ? 1250 : 900) : 1250);
  const isWideEnoughForSingleLine = effectiveWidth >= 1200;
  const isSplit32 = allFiveVisible && !isWideEnoughForSingleLine && effectiveWidth >= 580;

  let gridLayoutClass = '';
  if (allFiveVisible) {
    if (isWideEnoughForSingleLine) {
      gridLayoutClass = 'grid-cols-5';
    } else if (isSplit32) {
      gridLayoutClass = 'grid-cols-6';
    } else {
      gridLayoutClass = 'grid-cols-1';
    }
  } else {
    if (visibleCount === 4) {
      gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    } else if (visibleCount === 3) {
      gridLayoutClass = 'grid-cols-1 sm:grid-cols-3';
    } else if (visibleCount === 2) {
      gridLayoutClass = 'grid-cols-1 sm:grid-cols-2';
    } else {
      gridLayoutClass = 'grid-cols-1';
    }
  }

  // --- Formula Code Helpers reflecting complete mathematical representations (including diagonal) ---
  const getPropagationFormula = (cfg: SoccerPropagationConfig) => {
    switch (cfg.type) {
      case 'inhibited':
        return 'i == j ? 1 : 0';
      case 'triangular':
        return 'i == j ? 1 : (d <= L ? (L - d) / L : 0)';
      case 'rectangular':
        return 'i == j ? 1 : (d <= L ? 1 : 0)';
      case 'trapezoidal':
        return 'i == j ? 1 : (d <= L1 ? 1 : (d <= L ? (L - d) / (L - L1) : 0))';
      case 'sinusoidal':
        return 'i == j ? 1 : (d <= L ? 0.5 * (1 + cos(pi * d / L)) : 0)';
      case 'custom': {
        const expr = cfg.customExpr || 'exp(-d / 2)';
        return expr.includes('i == j') || expr.includes('i==j') ? expr : `i == j ? 1 : (${expr})`;
      }
      case 'maxRatio':
      default:
        return 'i == j ? 1 : (L > 0 ? d / L : 0)';
    }
  };

  const getBlockingFormula = (cfg: SoccerBlockingConfig) => {
    switch (cfg.type) {
      case 'standard':
        return 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))';
      case 'threshold':
        return 'i == j ? 1 : (a < theta ? 0 : a)';
      case 'custom':
        return cfg.customExpr || 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))';
      case 'none':
      default:
        return 'a';
    }
  };

  const getSynergyFormula = (cfg?: SynergyConfig) => {
    switch (cfg?.type) {
      case 'factor':
        return 'i == j ? a : a * k';
      case 'custom': {
        const expr = cfg.customExpr || 'min(1, a * 1.2)';
        return expr.includes('i == j') || expr.includes('i==j') ? expr : `i == j ? a : (${expr})`;
      }
      case 'none':
      default:
        return 'a';
    }
  };

  const getRelativeFormula = (cfg: SoccerRelativeAdjustmentConfig) => {
    switch (cfg.type) {
      case 'byMinutes':
        return 'minutos / minutos_totales';
      case 'byTouches':
        return 'media_toques / toques';
      case 'byMean':
        return '1 / media_vc';
      case 'custom':
        return cfg.customExpr || '1';
      case 'none':
      default:
        return '1';
    }
  };

  const getEqualizationFormula = (cfg: SoccerEqualizationConfig) => {
    switch (cfg.type) {
      case 'max':
      case 'maximum':
        return 'min(1, vcr / max_vcr)';
      case 'sum':
        return 'vcr / sum_vcr';
      case 'target':
        return 'min(1, vcr / obj)';
      case 'custom':
        return cfg.customExpr || 'min(1, vcr / max_vcr)';
      case 'none':
      default:
        return 'vcr';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`grid ${gridLayoutClass} gap-3 ${className}`}
    >
      {/* Box 1: Función de Propagación F_P */}
      {isPropVisible && (
        <div
          className={`flex flex-col justify-between ${
            compact ? 'p-2.5' : 'p-3'
          } rounded-xl bg-white dark:bg-gray-800/90 border border-purple-200 dark:border-purple-900/60 shadow-2xs relative ${
            isPropDisabled ? 'opacity-55' : ''
          } ${isSplit32 ? 'col-span-2' : ''}`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.affinity.propagationTitle')}
              </span>
            </div>
            {disabledKeys?.propagation && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {disabledNotes?.propagation || 'Sobrescrita'}
              </span>
            )}
          </div>

          <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 ${isPropDisabled ? 'pointer-events-none' : ''}`}>
            <select
              disabled={isPropDisabled}
              value={propagationConfig.type || 'maxRatio'}
              onChange={e => onUpdatePropagation?.({ ...propagationConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <option value="maxRatio">{t('soccer.affinity.propagationTypeMaxRatio')}</option>
              <option value="triangular">{t('char.tower.prop.triangular')}</option>
              <option value="rectangular">{t('char.tower.prop.rectangular')}</option>
              <option value="trapezoidal">{t('char.tower.prop.trapezoidal')}</option>
              <option value="sinusoidal">{t('char.tower.prop.sinusoidal')}</option>
              <option value="inhibited">{t('char.tower.prop.inhibited')}</option>
              <option value="custom">{t('char.tower.prop.custom') || 'Personalizada'}</option>
            </select>

            <FormulaCodeDisplay
              code={getPropagationFormula(propagationConfig)}
              compact
            />

            {/* Trapezoidal parameters: L1 and L2 */}
            {propagationConfig.type === 'trapezoidal' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                    {t('char.tower.limitL1')}
                  </label>
                  <DecimalInput
                    disabled={isPropDisabled}
                    value={propagationConfig.l1 ?? 0}
                    onChange={val => onUpdatePropagation?.({ ...propagationConfig, l1: val })}
                    className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-center disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                    {t('char.tower.limitL2')}
                  </label>
                  <DecimalInput
                    disabled={isPropDisabled}
                    value={propagationConfig.limit ?? 10}
                    onChange={val => onUpdatePropagation?.({ ...propagationConfig, limit: val })}
                    className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-center disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Triangular, Rectangular, Sinusoidal parameters: limit L */}
            {['triangular', 'rectangular', 'sinusoidal'].includes(propagationConfig.type) && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                  {t('char.tower.limit')}
                </label>
                <DecimalInput
                  disabled={isPropDisabled}
                  value={propagationConfig.limit ?? 10}
                  onChange={val => onUpdatePropagation?.({ ...propagationConfig, limit: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* MaxRatio: optional override limit L */}
            {propagationConfig.type === 'maxRatio' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">L =</span>
                <DecimalInput
                  disabled={isPropDisabled}
                  placeholder="Máx."
                  value={propagationConfig.limit}
                  onChange={val => onUpdatePropagation?.({ ...propagationConfig, limit: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Custom formula input */}
            {propagationConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isPropDisabled}
                value={propagationConfig.customExpr ?? ''}
                onChange={e => onUpdatePropagation?.({ ...propagationConfig, customExpr: e.target.value })}
                placeholder="exp(-d / 2)"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {propagationConfig.type === 'triangular'
                ? t('soccer.affinity.propagationDescTriangular')
                : propagationConfig.type === 'rectangular'
                ? t('soccer.affinity.propagationDescRectangular')
                : propagationConfig.type === 'trapezoidal'
                ? t('soccer.affinity.propagationDescTrapezoidal')
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
      )}

      {/* Box 2: Función de Bloqueo F_B */}
      {isBlockVisible && (
        <div
          className={`flex flex-col justify-between ${
            compact ? 'p-2.5' : 'p-3'
          } rounded-xl bg-white dark:bg-gray-800/90 border border-amber-200 dark:border-amber-900/60 shadow-2xs relative ${
            isBlockDisabled ? 'opacity-55' : ''
          } ${isSplit32 ? 'col-span-2' : ''}`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.affinity.blockingTitle')}
              </span>
            </div>
            {disabledKeys?.blocking && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {disabledNotes?.blocking || 'Sobrescrita'}
              </span>
            )}
          </div>

          <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 ${isBlockDisabled ? 'pointer-events-none' : ''}`}>
            <select
              disabled={isBlockDisabled}
              value={blockingConfig.type || 'none'}
              onChange={e => onUpdateBlocking?.({ ...blockingConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <option value="none">{t('soccer.affinity.blockingTypeNone')}</option>
              <option value="standard">{t('char.tower.block.standard')}</option>
              <option value="threshold">{t('soccer.affinity.blockingTypeThreshold')}</option>
              <option value="custom">{t('char.tower.block.custom') || 'Personalizada'}</option>
            </select>

            <FormulaCodeDisplay
              code={getBlockingFormula(blockingConfig)}
              compact
            />

            {/* Standard blocking: scalar vb factor */}
            {blockingConfig.type === 'standard' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">vb =</span>
                <DecimalInput
                  disabled={isBlockDisabled}
                  min={0}
                  max={1}
                  value={blockingConfig.vb ?? 0.0}
                  onChange={val => onUpdateBlocking?.({ ...blockingConfig, vb: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Threshold blocking: theta threshold */}
            {blockingConfig.type === 'threshold' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">θ =</span>
                <DecimalInput
                  disabled={isBlockDisabled}
                  min={0}
                  max={1}
                  value={blockingConfig.threshold ?? 0.15}
                  onChange={val => onUpdateBlocking?.({ ...blockingConfig, threshold: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Custom formula input */}
            {blockingConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isBlockDisabled}
                value={blockingConfig.customExpr ?? ''}
                onChange={e => onUpdateBlocking?.({ ...blockingConfig, customExpr: e.target.value })}
                placeholder="i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {blockingConfig.type === 'standard'
                ? t('soccer.affinity.blockingDescStandard')
                : blockingConfig.type === 'threshold'
                ? t('soccer.affinity.blockingDescThreshold')
                : blockingConfig.type === 'custom'
                ? t('soccer.affinity.blockingDescCustom')
                : t('soccer.affinity.blockingDescNone')}
            </p>
          </div>
        </div>
      )}

      {/* Box 3: Función de Sinergia F_S */}
      {isSynVisible && (
        <div
          className={`flex flex-col justify-between ${
            compact ? 'p-2.5' : 'p-3'
          } rounded-xl bg-white dark:bg-gray-800/90 border border-blue-200 dark:border-blue-900/60 shadow-2xs relative ${
            isSynDisabled ? 'opacity-55' : ''
          } ${isSplit32 ? 'col-span-2' : ''}`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.dimension.synergyTitle')}
              </span>
            </div>
            {disabledKeys?.synergy && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {disabledNotes?.synergy || t('soccer.generalConfig.overriddenBadge')}
              </span>
            )}
          </div>

          <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 ${isSynDisabled ? 'pointer-events-none' : ''}`}>
            <select
              disabled={isSynDisabled}
              value={synergyConfig?.type || 'none'}
              onChange={e => onUpdateSynergy?.({ ...synergyConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <option value="none">{t('char.tower.syn.none')}</option>
              <option value="factor">{t('char.tower.syn.factor')}</option>
              <option value="custom">{t('char.tower.syn.custom') || 'Personalizada'}</option>
            </select>

            <FormulaCodeDisplay
              code={getSynergyFormula(synergyConfig)}
              compact
            />

            {/* Factor k input */}
            {synergyConfig?.type === 'factor' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">k =</span>
                <DecimalInput
                  disabled={isSynDisabled}
                  min={0}
                  max={2}
                  value={synergyConfig.k ?? 1.0}
                  onChange={val => onUpdateSynergy?.({ ...synergyConfig, k: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Custom formula input */}
            {synergyConfig?.type === 'custom' && (
              <input
                type="text"
                disabled={isSynDisabled}
                value={synergyConfig.customExpr ?? ''}
                onChange={e => onUpdateSynergy?.({ ...synergyConfig, customExpr: e.target.value })}
                placeholder="min(1, a * 1.2)"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {synergyConfig?.type === 'factor'
                ? t('soccer.dimension.synergyDescFactor')
                : synergyConfig?.type === 'custom'
                ? t('soccer.dimension.synergyDescCustom')
                : t('soccer.dimension.synergyDescNone')}
            </p>
          </div>
        </div>
      )}

      {/* Box 4: Ajuste Relativo c_a */}
      {isRelVisible && (
        <div
          className={`flex flex-col justify-between ${
            compact ? 'p-2.5' : 'p-3'
          } rounded-xl bg-white dark:bg-gray-800/90 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs relative ${
            isRelDisabled ? 'opacity-55' : ''
          } ${isSplit32 ? 'col-span-3' : ''}`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.affinity.relativeTitle')}
              </span>
            </div>
            {disabledKeys?.relative && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {disabledNotes?.relative || t('soccer.generalConfig.overriddenBadge')}
              </span>
            )}
          </div>

          <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 ${isRelDisabled ? 'pointer-events-none' : ''}`}>
            <select
              disabled={isRelDisabled}
              value={relativeConfig.type || 'none'}
              onChange={e => onUpdateRelativeAdjustment?.({ ...relativeConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <option value="none">{t('soccer.affinity.relativeTypeNone')}</option>
              <option value="byMinutes">{t('soccer.affinity.relativeTypeMinutes')}</option>
              <option value="byTouches">{t('soccer.affinity.relativeTypeTouches')}</option>
              <option value="byMean">{t('soccer.affinity.relativeTypeMean')}</option>
              <option value="custom">{t('soccer.affinity.relativeTypeCustom') || 'Personalizada'}</option>
            </select>

            <FormulaCodeDisplay
              code={getRelativeFormula(relativeConfig)}
              compact
            />

            {/* Custom formula input */}
            {relativeConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isRelDisabled}
                value={relativeConfig.customExpr ?? ''}
                onChange={e => onUpdateRelativeAdjustment?.({ ...relativeConfig, customExpr: e.target.value })}
                placeholder="minutos / minutos_totales"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {relativeConfig.type === 'byMinutes'
                ? t('soccer.affinity.relativeDescMinutes')
                : relativeConfig.type === 'byTouches'
                ? t('soccer.affinity.relativeDescTouches')
                : relativeConfig.type === 'byMean'
                ? t('soccer.affinity.relativeDescMean')
                : relativeConfig.type === 'custom'
                ? t('soccer.affinity.relativeDescCustom')
                : t('soccer.affinity.relativeDescNone')}
            </p>
          </div>
        </div>
      )}

      {/* Box 5: Ajuste por Equiparación c_n */}
      {isEqVisible && (
        <div
          className={`flex flex-col justify-between ${
            compact ? 'p-2.5' : 'p-3'
          } rounded-xl bg-white dark:bg-gray-800/90 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs relative ${
            isEqDisabled ? 'opacity-55' : ''
          } ${isSplit32 ? 'col-span-3' : ''}`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.affinity.equalizationTitle')}
              </span>
            </div>
            {disabledKeys?.equalization && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {disabledNotes?.equalization || t('soccer.generalConfig.overriddenBadge')}
              </span>
            )}
          </div>

          <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 ${isEqDisabled ? 'pointer-events-none' : ''}`}>
            <select
              disabled={isEqDisabled}
              value={equalizationConfig.type || 'max'}
              onChange={e => onUpdateEqualization?.({ ...equalizationConfig, type: e.target.value as any })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <option value="max">{t('char.adj.norm.maximum')}</option>
              <option value="sum">{t('char.adj.norm.sum') || 'Por Suma'}</option>
              <option value="target">{t('char.adj.norm.target')}</option>
              <option value="none">{t('char.adj.norm.none')}</option>
              <option value="custom">{t('char.adj.norm.custom') || 'Personalizada'}</option>
            </select>

            <FormulaCodeDisplay
              code={getEqualizationFormula(equalizationConfig)}
              compact
            />

            {/* Target equalization: obj parameter */}
            {equalizationConfig.type === 'target' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold">obj =</span>
                <DecimalInput
                  disabled={isEqDisabled}
                  min={0.01}
                  value={equalizationConfig.obj ?? 1.0}
                  onChange={val => onUpdateEqualization?.({ ...equalizationConfig, obj: val })}
                  className="w-full h-7 px-1.5 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Custom formula input */}
            {equalizationConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isEqDisabled}
                value={equalizationConfig.customExpr ?? ''}
                onChange={e => onUpdateEqualization?.({ ...equalizationConfig, customExpr: e.target.value })}
                placeholder="min(1, vcr / max_vcr)"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {equalizationConfig.type === 'sum'
                ? t('soccer.affinity.equalizationDescSum')
                : equalizationConfig.type === 'target'
                ? t('soccer.affinity.equalizationDescTarget')
                : equalizationConfig.type === 'none'
                ? t('soccer.affinity.equalizationDescNone')
                : equalizationConfig.type === 'custom'
                ? t('soccer.affinity.equalizationDescCustom')
                : t('soccer.affinity.equalizationDescMax')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

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
              <option value="triangular">{t('soccer.affinity.propagationTypeTriangular')}</option>
              <option value="rectangular">{t('soccer.affinity.propagationTypeRectangular')}</option>
              <option value="sinusoidal">{t('soccer.affinity.propagationTypeSinusoidal')}</option>
              <option value="inhibited">{t('soccer.affinity.propagationTypeInhibited')}</option>
              <option value="custom">{t('soccer.affinity.propagationTypeCustom')}</option>
            </select>

            <FormulaCodeDisplay
              code={
                propagationConfig.type === 'triangular'
                  ? 'max(0, (L - d) / L)'
                  : propagationConfig.type === 'rectangular'
                  ? 'd >= cut ? 1 : 0'
                  : propagationConfig.type === 'sinusoidal'
                  ? 'd <= L ? 0.5 * (1 + cos(pi * d / L)) : 0'
                  : propagationConfig.type === 'inhibited'
                  ? '0'
                  : propagationConfig.type === 'custom'
                  ? propagationConfig.customExpr || 'd / L'
                  : 'd / L'
              }
              compact
            />

            {propagationConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isPropDisabled}
                value={propagationConfig.customExpr ?? 'd / L'}
                onChange={e => onUpdatePropagation?.({ ...propagationConfig, customExpr: e.target.value })}
                placeholder="d / L"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed"
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
              <option value="threshold">{t('soccer.affinity.blockingTypeThreshold')}</option>
              <option value="custom">{t('soccer.affinity.blockingTypeCustom')}</option>
            </select>

            <FormulaCodeDisplay
              code={
                blockingConfig.type === 'threshold'
                  ? 'a < theta ? 0 : a'
                  : blockingConfig.type === 'custom'
                  ? blockingConfig.customExpr || 'a < theta ? 0 : a'
                  : 'a'
              }
              compact
            />

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

            {blockingConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isBlockDisabled}
                value={blockingConfig.customExpr ?? 'a < theta ? 0 : a'}
                onChange={e => onUpdateBlocking?.({ ...blockingConfig, customExpr: e.target.value })}
                placeholder="a < theta ? 0 : a"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {blockingConfig.type === 'threshold'
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
              <option value="none">{t('soccer.dimension.synergyTypeNone')}</option>
              <option value="factor">{t('soccer.dimension.synergyTypeFactor')}</option>
              <option value="custom">{t('soccer.dimension.synergyTypeCustom')}</option>
            </select>

            <FormulaCodeDisplay
              code={
                synergyConfig?.type === 'factor'
                  ? 'a * k'
                  : synergyConfig?.type === 'custom'
                  ? synergyConfig.customExpr || 'a * k'
                  : 'a'
              }
              compact
            />

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

            {synergyConfig?.type === 'custom' && (
              <input
                type="text"
                disabled={isSynDisabled}
                value={synergyConfig.customExpr ?? 'a * k'}
                onChange={e => onUpdateSynergy?.({ ...synergyConfig, customExpr: e.target.value })}
                placeholder="a * k"
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
              <option value="custom">{t('soccer.affinity.relativeTypeCustom')}</option>
            </select>

            <FormulaCodeDisplay
              code={
                relativeConfig.type === 'byMinutes'
                  ? 'minutos / minutos_totales'
                  : relativeConfig.type === 'byTouches'
                  ? 'media_toques / toques'
                  : relativeConfig.type === 'byMean'
                  ? '1 / media_vc'
                  : relativeConfig.type === 'custom'
                  ? relativeConfig.customExpr || '1'
                  : '1'
              }
              compact
            />

            {relativeConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isRelDisabled}
                value={relativeConfig.customExpr ?? 'vp * (minutos / minutos_totales)'}
                onChange={e => onUpdateRelativeAdjustment?.({ ...relativeConfig, customExpr: e.target.value })}
                placeholder="vp * (minutos / minutos_totales)"
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
              <option value="max">{t('soccer.affinity.equalizationTypeMax')}</option>
              <option value="sum">{t('soccer.affinity.equalizationTypeSum')}</option>
              <option value="none">{t('soccer.affinity.equalizationTypeNone')}</option>
              <option value="custom">{t('soccer.affinity.equalizationTypeCustom')}</option>
            </select>

            <FormulaCodeDisplay
              code={
                equalizationConfig.type === 'sum'
                  ? 'vp / sum_vp'
                  : equalizationConfig.type === 'none'
                  ? 'vp'
                  : equalizationConfig.type === 'custom'
                  ? equalizationConfig.customExpr || 'vp / max_vp'
                  : 'vp / max_vp'
              }
              compact
            />

            {equalizationConfig.type === 'custom' && (
              <input
                type="text"
                disabled={isEqDisabled}
                value={equalizationConfig.customExpr ?? 'vp / max_vp'}
                onChange={e => onUpdateEqualization?.({ ...equalizationConfig, customExpr: e.target.value })}
                placeholder="vp / max_vp"
                className="w-full h-7 px-2 text-xs font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed"
              />
            )}

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {equalizationConfig.type === 'sum'
                ? t('soccer.affinity.equalizationDescSum')
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

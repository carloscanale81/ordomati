import React, { useState } from 'react';
import { Target, Sparkles, Layers, Sliders, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Card } from './Card';
import { SoccerDimensionalAnalysis, SoccerConcept } from '../../logic/soccerAnalysis';
import { SynergyConfig } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';

export interface SoccerDimensionCardProps {
  concept: SoccerConcept;
  conceptTitle: string;
  analysis: SoccerDimensionalAnalysis;
  synergyConfig?: SynergyConfig;
  onUpdateSynergy?: (next: SynergyConfig) => void;
  onRecalculate?: () => void;
  defaultCollapsed?: boolean;
}

export const SoccerDimensionCard: React.FC<SoccerDimensionCardProps> = ({
  conceptTitle,
  analysis,
  onRecalculate,
  defaultCollapsed = false
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const { players, VC, VP, isCalculated } = analysis;

  const maxVp = VP && VP.length > 0 ? Math.max(...VP, 0.0001) : 1;
  const maxVc = VC && VC.length > 0 ? Math.max(...VC, 1) : 1;

  // Identify MVP player for this dimension (only if positive value exists)
  let topVpIdx = -1;
  let highestVp = 0;
  if (VP) {
    VP.forEach((val, idx) => {
      if (val > highestVp) {
        highestVp = val;
        topVpIdx = idx;
      }
    });
  } else if (VC) {
    VC.forEach((val, idx) => {
      if (val > highestVp) {
        highestVp = val;
        topVpIdx = idx;
      }
    });
  }
  const mvpPlayer = topVpIdx !== -1 && highestVp > 0 ? players[topVpIdx] : null;

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.dimension.titlePrefix')}: {conceptTitle}
          </span>
        </div>
      }
      center={
        mvpPlayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>MVP: {mvpPlayer.name}</span>
          </div>
        ) : null
      }
      className="bg-white/95 dark:bg-gray-900/95 shadow-sm"
      action={
        <button
          type="button"
          onClick={() => setIsCollapsed(prev => !prev)}
          title={isCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
          aria-label={isCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      }
    >
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Pillar 1: Valor Propio (V^P) */}
          <div className="flex flex-col h-full rounded-xl p-3.5 bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.dimension.vpTitle')}
              </h4>
            </div>

            {!isCalculated || !VP ? (
              <div className="relative flex-1 min-h-[260px] flex flex-col justify-center rounded-xl bg-gray-100/60 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
                {/* Shaded Skeleton List */}
                <div className="p-3 space-y-1.5 opacity-30 select-none pointer-events-none">
                  {players.map((p, idx) => (
                    <div
                      key={idx}
                      className="h-7 rounded bg-gray-300 dark:bg-gray-700 flex items-center justify-between px-2"
                    >
                      <span className="text-[10px] font-mono text-gray-400">#{p.shirtNo}</span>
                      <div className="w-12 h-2 rounded bg-gray-400/40" />
                    </div>
                  ))}
                </div>

                {/* Centered '?' Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gray-50/40 dark:bg-gray-900/40 backdrop-blur-[1px]">
                  <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <span className="text-3xl font-black text-gray-400 dark:text-gray-500">?</span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-2">
                    {t('soccer.dimension.vpPendingHelp')}
                  </span>
                  {onRecalculate && (
                    <button
                      type="button"
                      onClick={onRecalculate}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('soccer.dimension.calculateAction')}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[520px] pr-0.5">
                {players.map((p, idx) => {
                  const val = VP[idx] ?? 0;
                  const isTop = idx === topVpIdx && val > 0;
                  const barWidth = Math.max(4, Math.round((val / maxVp) * 100));

                  return (
                    <div
                      key={p.id || idx}
                      className={`p-1.5 rounded-lg border text-xs flex items-center justify-between gap-1 transition-all ${
                        isTop
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 font-semibold'
                          : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 w-4 text-right shrink-0">
                          #{p.shirtNo}
                        </span>
                        <span className="truncate max-w-[110px] font-medium" title={p.name}>
                          {p.name}
                        </span>
                        {isTop && (
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            MVP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${barWidth}%` }}
                            className={`h-full rounded-full ${
                              isTop ? 'bg-blue-600' : 'bg-blue-400 dark:bg-blue-500'
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-right w-11">
                          {val.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pillar 2: Valor Contextual (V^C) */}
          <div className="flex flex-col h-full rounded-xl p-3.5 bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('soccer.dimension.vcTitle')} ({conceptTitle})
              </h4>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto max-h-[520px] pr-0.5">
              {players.map((p, idx) => {
                const val = VC[idx] ?? 0;
                const barWidth = Math.max(3, Math.round((val / maxVc) * 100));

                return (
                  <div
                    key={p.id || idx}
                    className="p-1.5 rounded-lg border text-xs flex items-center justify-between gap-1 bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 w-4 text-right shrink-0">
                        #{p.shirtNo}
                      </span>
                      <span className="truncate max-w-[120px] font-medium" title={p.name}>
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="font-mono font-bold text-[11px] text-right w-6 text-emerald-600 dark:text-emerald-400">
                        {val}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

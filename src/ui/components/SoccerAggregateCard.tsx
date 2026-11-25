import React, { useState, useMemo } from 'react';
import { Layers, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Card } from './Card';
import {
  SoccerAggregatedAnalysis,
  SoccerOwaConfig,
  SoccerConcept,
  SOCCER_CONCEPTS
} from '../../logic/soccerAnalysis';
import { useI18n } from '../i18n/I18nContext';

export interface SoccerAggregateCardProps {
  analysis: SoccerAggregatedAnalysis;
  activeDimensions?: SoccerConcept[];
  owaConfig?: SoccerOwaConfig;
  dimAffinityMatrix?: number[][];
  onUpdateOwa?: (next: SoccerOwaConfig) => void;
  onUpdateDimAffinity?: (next: number[][]) => void;
  defaultCollapsed?: boolean;
}

export const SoccerAggregateCard: React.FC<SoccerAggregateCardProps> = ({
  analysis,
  activeDimensions,
  defaultCollapsed = false
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const { players, scores, ranking, mvpPlayer, V } = analysis;

  const maxScore = scores && scores.length > 0 ? Math.max(...scores, 0.0001) : 1;

  const visibleConcepts = useMemo(() => {
    if (!activeDimensions || activeDimensions.length === 0) return SOCCER_CONCEPTS;
    return SOCCER_CONCEPTS.filter(c => activeDimensions.includes(c.key));
  }, [activeDimensions]);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.aggregate.title')}
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
        <div className="space-y-4">
          {/* Ranking & Aggregated Values for Active Segment */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-2xs">
            <div className="p-3 bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {t('soccer.aggregate.rankingTitle')}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {analysis.segment.teamName} · {analysis.segment.label}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5 text-left">{t('soccer.aggregate.colPlayer')}</th>
                    <th className="p-2.5 text-center w-14">{t('soccer.aggregate.colPos')}</th>
                    {visibleConcepts.map(c => (
                      <th key={c.key} className="p-2 text-right font-mono text-[10px] whitespace-nowrap" title={`VP (${c.name})`}>
                        {c.name.slice(0, 3)}
                      </th>
                    ))}
                    <th className="p-2.5 text-right font-mono font-bold w-28">
                      {t('soccer.aggregate.colScore')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {ranking.map((playerIdx, rank) => {
                    const player = players[playerIdx];
                    if (!player) return null;
                    const score = scores[playerIdx] || 0;
                    const isTop = rank === 0;

                    return (
                      <tr
                        key={player.id || player.name}
                        className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                          isTop ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          {rank === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs shadow-2xs">
                              1
                            </span>
                          ) : rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100 font-bold text-xs">
                              2
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-gray-400 font-mono text-xs">{rank + 1}</span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-1.5">
                            {isTop && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            <span>{player.name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {player.position}
                          </span>
                        </td>
                        {visibleConcepts.map((_, colIdx) => {
                          const vpVal = V[playerIdx]?.[colIdx] ?? 0;
                          return (
                            <td key={colIdx} className="p-2 text-right font-mono text-[11px] text-gray-600 dark:text-gray-400">
                              {vpVal.toFixed(2)}
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (score / maxScore) * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                              {score.toFixed(3)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
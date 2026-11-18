import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Zap,
  Target,
  Shield,
  Activity,
  Layers,
  BarChart2,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';
import {
  IntegralMatchPlayerScore,
  PlayerSegmentBreakdown,
  SOCCER_CONCEPTS
} from '../../logic/soccerAnalysis';
import { useI18n } from '../i18n/I18nContext';
import { ErrorBoundary } from './ErrorBoundary';

export interface SoccerIntegralPlayerCardProps {
  item: IntegralMatchPlayerScore;
  idx: number;
  isTop: boolean;
  isMatchTop: boolean;
  maxScore: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedSegmentId: string | null;
  onSelectSegmentId: (segmentId: string | null) => void;
}

const fmtScore = (val: number | undefined | null, decimals = 3): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return '0.000';
  return Number(val).toFixed(decimals);
};

const fmtStat = (val: any, fallback: string | number = 0): string | number => {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const vals = Object.values(val);
    if (vals.length > 0) {
      const last: any = vals[vals.length - 1];
      if (typeof last === 'number' || typeof last === 'string') return last;
    }
    return fallback;
  }
  return String(val);
};

export const SoccerIntegralPlayerCard: React.FC<SoccerIntegralPlayerCardProps> = ({
  item,
  idx,
  isTop,
  isMatchTop,
  maxScore,
  isExpanded,
  onToggleExpand,
  selectedSegmentId,
  onSelectSegmentId
}) => {
  const { t } = useI18n();

  const safeCumScore = typeof item.cumulativeScore === 'number' && !isNaN(item.cumulativeScore) ? item.cumulativeScore : 0;
  const scorePercent = Math.min(
    100,
    Math.max(0, (safeCumScore / (maxScore > 0 ? maxScore : 1)) * 100)
  );

  const segments = item.segments || [];
  const selectedSegment = segments.find(s => s.segmentId === selectedSegmentId) || null;
  const isViewingSegment = selectedSegment !== null;

  // Active stats: either segment stats or full match stats
  const activeStats = (isViewingSegment ? selectedSegment?.rawStats : item.fullMatch?.rawStats) || {};

  // Active dimensional scores: either segment's dimScores or full match's dimCumulativeScores
  const activeDimScores = isViewingSegment
    ? (selectedSegment?.dimScores || []).map(d => ({
        key: d.concept,
        name: d.conceptName || d.concept,
        unit: d.unit || '',
        rawVC: d.rawVC ?? 0,
        score: d.vp ?? 0
      }))
    : (item.fullMatch?.dimCumulativeScores || []).map(d => ({
        key: d.concept,
        name: d.conceptName || d.concept,
        unit: d.unit || '',
        rawVC: d.rawTotalVC ?? 0,
        score: d.cumulativeVp ?? 0
      }));

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isMatchTop
          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400/60 shadow-xs'
          : isTop
          ? item.team === 'home'
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
            : 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/60'
          : 'bg-white/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-800'
      }`}
    >
      {/* Header clickable row */}
      <div
        onClick={onToggleExpand}
        className="p-3 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/80 transition-colors select-none"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700/80 font-mono text-[10px] font-bold text-gray-700 dark:text-gray-300 shrink-0">
              {item.player.shirtNo || idx + 1}
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
              {item.player.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0 font-medium">
              {item.player.position}
            </span>
            {isMatchTop && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white shrink-0 shadow-2xs">
                MVP Partido
              </span>
            )}
            {!isMatchTop && item.isMvp && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-600 text-white shrink-0">
                MVP {item.team === 'home' ? 'Local' : 'Visitante'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
              {fmtScore(item.cumulativeScore, 3)}
            </span>
            <button
              type="button"
              aria-label={isExpanded ? t('soccer.playerCard.collapse') : t('soccer.playerCard.expand')}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Fluid progress bar */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isMatchTop
                ? 'bg-amber-500'
                : isTop
                ? item.team === 'home'
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-cyan-600 dark:bg-cyan-500'
                : item.team === 'home'
                ? 'bg-indigo-500 dark:bg-indigo-600'
                : 'bg-cyan-500 dark:bg-cyan-600'
            }`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Expanded Detailed Sheet */}
      {isExpanded && (
        <ErrorBoundary fallbackTitle="Error al desplegar detalle del jugador">
          <div className="p-3.5 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 space-y-3.5 animate-in fade-in duration-200">
            {/* Segment Timeline Bar for Player's Team */}
            {item.segments && item.segments.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                  <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('soccer.playerCard.segmentTimeline')}</span>
                  </span>

                  {/* View Full Match reset button */}
                  {isViewingSegment ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectSegmentId(null);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('soccer.playerCard.viewFullMatch')}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{t('soccer.playerCard.fullMatch')} (100%)</span>
                    </span>
                  )}
                </div>

                {/* Interactive Segment Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {item.segments.map((seg, sIdx) => {
                    const isSelected = selectedSegmentId === seg.segmentId;
                    return (
                      <button
                        key={seg.segmentId}
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectSegmentId(isSelected ? null : seg.segmentId);
                        }}
                        className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/40 shadow-xs'
                            : seg.isActive
                            ? 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 shadow-2xs'
                            : 'bg-gray-100/60 dark:bg-gray-850/60 text-gray-400 dark:text-gray-500 border-dashed border-gray-200 dark:border-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold leading-tight">
                          <span className="truncate">S{sIdx + 1} ({seg.startMinute}&apos;-{seg.endMinute}&apos;)</span>
                          <span className="shrink-0">{seg.weightPercent}%</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                            {seg.duration}&apos;
                          </span>
                          <span className={`font-mono font-bold ${
                            isSelected
                              ? 'text-white'
                              : seg.isActive
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-400'
                          }`}>
                            {seg.isActive ? fmtScore(seg.segmentScore, 3) : t('soccer.playerCard.inactiveInSegment')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active View Context Banner */}
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {isViewingSegment && selectedSegment
                    ? `${selectedSegment.segmentName} (${selectedSegment.duration} min · ${selectedSegment.weightPercent}% del partido)`
                    : `${t('soccer.playerCard.fullMatch')} (${item.fullMatch?.minutesPlayed ?? (item.segments?.reduce((acc, s) => acc + (s.isActive ? s.duration : 0), 0) || (item.isFirstEleven ? 90 : 0))} min disputados)`}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <span>{isViewingSegment ? t('soccer.playerCard.segmentScore') : 'Punt. Total'}:</span>
                <span>
                  {isViewingSegment
                    ? selectedSegment?.isActive ? fmtScore(selectedSegment.segmentScore, 3) : '-'
                    : fmtScore(item.cumulativeScore, 3)}
                </span>
              </div>
            </div>

            {/* Raw Match Statistics (Loaded indicators) */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('soccer.playerCard.rawIndicators')}</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-xs">
                {!isViewingSegment && activeStats.rating !== undefined && (
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.rating')}</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {typeof activeStats.rating === 'number'
                        ? activeStats.rating.toFixed(2)
                        : typeof activeStats.rating === 'object' && activeStats.rating !== null
                        ? String(Object.values(activeStats.rating).pop() ?? '-')
                        : String(activeStats.rating)}
                    </div>
                  </div>
                )}

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.minutesPlayed')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                    {isViewingSegment ? `${fmtStat(activeStats.minutesInSegment, 0)}'` : `${fmtStat(activeStats.minutesPlayed, 0)}'`}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.goals')}</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">{fmtStat(activeStats.goals, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.assists')}</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">{fmtStat(activeStats.assists, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.shots')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                    {fmtStat(activeStats.shotsTotal, 0)} / {fmtStat(activeStats.shotsOnTarget, 0)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.passes')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                    {fmtStat(activeStats.passesAccurate, 0)} / {fmtStat(activeStats.passesTotal, 0)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.passAccuracy')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">{fmtStat(activeStats.passAccuracy, '-')}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.dribbles')}</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{fmtStat(activeStats.dribblesWon, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.aerial')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">{fmtStat(activeStats.aerialWon, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.tackles')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">{fmtStat(activeStats.tacklesWon, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.interceptions')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">{fmtStat(activeStats.interceptions, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.clearances')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">{fmtStat(activeStats.clearances, 0)}</div>
                </div>

                {(activeStats.saves !== undefined && Number(activeStats.saves) > 0) && (
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.saves')}</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtStat(activeStats.saves, 0)}</div>
                  </div>
                )}

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.keyPasses')}</div>
                  <div className="font-bold text-purple-600 dark:text-purple-400 font-mono">{fmtStat(activeStats.keyPasses, 0)}</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('soccer.playerCard.cards')}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                    {fmtStat(activeStats.yellowCards, 0)} / {fmtStat(activeStats.redCards, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* 12-Dimensional Scores Breakdown */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('soccer.playerCard.dimensionsBreakdown')}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {activeDimScores.map(dim => (
                  <div
                    key={dim.key}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {dim.name}
                      </div>
                      <div className="text-[9px] text-gray-400 dark:text-gray-500">
                        {String(dim.rawVC ?? 0)} {dim.unit}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {fmtScore(dim.score, 3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Clock, ArrowRightLeft, Shield } from 'lucide-react';
import { TimelineSegment, TimelineEventReason } from '../../logic/soccerAnalysis';
import { useI18n } from '../i18n/I18nContext';

export interface SoccerTimelineSliderProps {
  totalMinutes: number;
  homeTeamName: string;
  awayTeamName: string;
  homeCrestUrl?: string;
  awayCrestUrl?: string;
  homeSegments: TimelineSegment[];
  awaySegments: TimelineSegment[];
  homeEvents?: TimelineEventReason[];
  awayEvents?: TimelineEventReason[];
  selectedSegmentId: string;
  onSelectSegment: (segment: TimelineSegment) => void;
}

export const SoccerTimelineSlider: React.FC<SoccerTimelineSliderProps> = ({
  totalMinutes,
  homeTeamName,
  awayTeamName,
  homeCrestUrl,
  awayCrestUrl,
  homeSegments,
  awaySegments,
  homeEvents,
  awayEvents,
  selectedSegmentId,
  onSelectSegment
}) => {
  const { t } = useI18n();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const allSegments = [...homeSegments, ...awaySegments];
  const activeSegment =
    allSegments.find(s => s.id === selectedSegmentId) || homeSegments[0] || awaySegments[0];

  const handleImageError = (teamKey: string) => {
    setImgErrors(prev => ({ ...prev, [teamKey]: true }));
  };

  const renderTrack = (
    team: 'home' | 'away',
    teamName: string,
    crestUrl: string | undefined,
    segments: TimelineSegment[],
    teamEvents: TimelineEventReason[] = []
  ) => {
    const hasImageError = Boolean(imgErrors[team]);

    // Aggregate any events present on segments if not passed directly
    const aggregatedEvents: TimelineEventReason[] = [...teamEvents];
    if (aggregatedEvents.length === 0) {
      segments.forEach(seg => {
        if (seg.startReason && !aggregatedEvents.some(e => e.minute === seg.startReason?.minute && e.type === seg.startReason?.type)) {
          aggregatedEvents.push(seg.startReason);
        }
        if (seg.endReason && !aggregatedEvents.some(e => e.minute === seg.endReason?.minute && e.type === seg.endReason?.type)) {
          aggregatedEvents.push(seg.endReason);
        }
      });
    }

    return (
      <div className="flex items-center gap-2.5 pt-2">
        {/* Team Identity with Real Shield Crest */}
        <div className="w-32 sm:w-40 shrink-0 flex items-center gap-2 truncate">
          {crestUrl && !hasImageError ? (
            <img
              src={crestUrl}
              alt={teamName}
              onError={() => handleImageError(team)}
              className="w-5 h-5 object-contain shrink-0 drop-shadow-2xs"
            />
          ) : (
            <Shield
              className={`w-4 h-4 shrink-0 ${
                team === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-cyan-600 dark:text-cyan-400'
              }`}
            />
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate" title={teamName}>
              {teamName}
            </span>
            <span className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400">
              {team === 'home' ? t('soccer.timeline.homeTeam') : t('soccer.timeline.awayTeam')}
            </span>
          </div>
        </div>

        {/* Timeline Bar with Markers positioned at exact equivalent moments */}
        <div className="flex-1 relative">
          {/* Exact Event Markers pinned at their exact minute */}
          {aggregatedEvents.map(ev => {
            const leftPct = Math.min(100, Math.max(0, (ev.minute / totalMinutes) * 100));
            const isGoal = ev.type === 'goal';
            const isSub = ev.type === 'sub';
            const isRedCard = ev.type === 'red_card';

            return (
              <div
                key={`${ev.type}-${ev.minute}-${ev.playerPrimary}`}
                style={{ left: `${leftPct}%` }}
                onClick={() => {
                  const matchingSeg =
                    segments.find(s => s.startMinute === ev.minute) ||
                    segments.find(s => s.endMinute === ev.minute) ||
                    segments.find(s => ev.minute >= s.startMinute && ev.minute <= s.endMinute) ||
                    (ev.minute >= totalMinutes ? segments[segments.length - 1] : undefined);
                  if (matchingSeg) onSelectSegment(matchingSeg);
                }}
                className="absolute -top-2.5 -translate-x-1/2 z-20 flex flex-col items-center group/marker cursor-pointer select-none"
                title={`${ev.minute}': ${ev.description}`}
              >
                {/* Marker badge */}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs border-2 border-white dark:border-gray-900 transition-transform group-hover/marker:scale-125 ${
                    isGoal
                      ? 'bg-emerald-500 text-white ring-1 ring-emerald-600/40'
                      : isSub
                      ? 'bg-amber-500 text-white ring-1 ring-amber-600/40'
                      : 'bg-rose-600 text-white ring-1 ring-rose-700/40'
                  }`}
                >
                  {isGoal ? '⚽' : isSub ? '⇄' : '🟥'}
                </span>

                {/* Hairline downward indicator notch */}
                <span className="w-0.5 h-1.5 bg-gray-400 dark:bg-gray-500 opacity-60" />

                {/* Floating detail tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover/marker:flex flex-col items-center z-30 pointer-events-none whitespace-nowrap">
                  <div className="px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-medium shadow-lg border border-gray-700">
                    <span className="font-bold">{ev.minute}'</span> · {ev.description}
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
                </div>
              </div>
            );
          })}

          {/* Segmented clickable blocks */}
          <div className="relative flex h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 p-0.5 border border-gray-200 dark:border-gray-700 w-full">
            {segments.map(seg => {
              const isSelected = activeSegment?.id === seg.id;
              const widthPct = (seg.duration / totalMinutes) * 100;
              const hasSub = Boolean(seg.subDetail) || seg.startReason?.type === 'sub' || seg.endReason?.type === 'sub';
              const hasGoal = seg.startReason?.type === 'goal' || seg.endReason?.type === 'goal';
              const hasRed = seg.startReason?.type === 'red_card' || seg.endReason?.type === 'red_card';

              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSelectSegment(seg)}
                  style={{ width: `${widthPct}%` }}
                  title={`${seg.teamName}: ${seg.label} (${seg.periodName})`}
                  className={`relative h-full transition-all duration-150 flex items-center justify-center px-1 border-r last:border-r-0 border-white/70 dark:border-gray-900/80 cursor-pointer select-none min-w-0 flex-shrink-0 group ${
                    isSelected
                      ? team === 'home'
                        ? 'bg-blue-600 text-white font-bold shadow-xs z-10 ring-2 ring-blue-500/50'
                        : 'bg-cyan-600 text-white font-bold shadow-xs z-10 ring-2 ring-cyan-500/50'
                      : 'bg-white/80 dark:bg-gray-700/60 hover:bg-blue-50 dark:hover:bg-gray-600/80 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 overflow-hidden">
                    {hasGoal && (
                      <span className="text-[10px]" title={seg.endReason?.description || seg.startReason?.description}>
                        ⚽
                      </span>
                    )}
                    {hasSub && (
                      <ArrowRightLeft
                        className={`w-2.5 h-2.5 shrink-0 ${
                          isSelected ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                    )}
                    {hasRed && (
                      <span className="text-[9px] text-rose-500 font-bold">
                        🟥
                      </span>
                    )}
                    <span className="text-[11px] truncate whitespace-nowrap">
                      {seg.startMinute}'–{seg.endMinute}'
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
            0' – {totalMinutes}' ({totalMinutes <= 90 ? '90 min' : '120 min + Prórroga'})
          </span>
        </div>

        {/* Selected Segment Banner displaying exact reasons and involved player names */}
        {activeSegment && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('soccer.timeline.selectedSegment')}:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-xs ${
                activeSegment.team === 'home'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
              }`}
            >
              <span>{activeSegment.teamName}</span>
              <span>·</span>
              <span>
                {activeSegment.startMinute}' – {activeSegment.endMinute}'
              </span>
              <span className="text-[10px] font-normal opacity-80">({activeSegment.periodName})</span>
            </span>

            {/* Start reason with player names */}
            {activeSegment.startReason && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                  activeSegment.startReason.type === 'goal'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : activeSegment.startReason.type === 'sub'
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}
                title={activeSegment.startReason.description}
              >
                {activeSegment.startReason.type === 'goal' && <span>⚽</span>}
                {activeSegment.startReason.type === 'sub' && <ArrowRightLeft className="w-3 h-3" />}
                {activeSegment.startReason.type === 'red_card' && <span>🟥</span>}
                <span>{activeSegment.startReason.description}</span>
              </span>
            )}

            {/* End reason with player names */}
            {activeSegment.endReason && activeSegment.endReason !== activeSegment.startReason && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                  activeSegment.endReason.type === 'goal'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : activeSegment.endReason.type === 'sub'
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}
                title={activeSegment.endReason.description}
              >
                {activeSegment.endReason.type === 'goal' && <span>⚽</span>}
                {activeSegment.endReason.type === 'sub' && <ArrowRightLeft className="w-3 h-3" />}
                {activeSegment.endReason.type === 'red_card' && <span>🟥</span>}
                <span>{activeSegment.endReason.description}</span>
              </span>
            )}

            {/* Fallback to subDetail if startReason/endReason are not present */}
            {!activeSegment.startReason && !activeSegment.endReason && activeSegment.subDetail && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                <ArrowRightLeft className="w-3 h-3" />
                <span>
                  Cambio: Entra {activeSegment.subDetail.playerOn} ⇄ Sale {activeSegment.subDetail.playerOff}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dual Tracks: Home on top, Away on bottom */}
      <div className="space-y-3">
        {renderTrack('home', homeTeamName, homeCrestUrl, homeSegments, homeEvents)}
        {renderTrack('away', awayTeamName, awayCrestUrl, awaySegments, awayEvents)}
      </div>
    </div>
  );
};

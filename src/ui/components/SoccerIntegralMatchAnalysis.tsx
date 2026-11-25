import React, { useState, useMemo, useRef } from 'react';
import {
  Trophy,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Sparkles,
  Layers,
  Maximize2
} from 'lucide-react';
import { Card } from './Card';
import { SoccerIntegralAffinityPanel } from './SoccerIntegralAffinityPanel';
import { SoccerIntegralPlayerCard } from './SoccerIntegralPlayerCard';
import { SoccerPitchGraph } from './SoccerPitchGraph';
import { ErrorBoundary } from './ErrorBoundary';
import {
  SoccerTimelineResult,
  SoccerConcept,
  SOCCER_CONCEPTS,
  SoccerOwaConfig,
  computeIntegralMatchCumulativeScores,
  computeIntegralCumulativeAffinity,
  IntegralMatchAnalysisResult,
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig
} from '../../logic/soccerAnalysis';
import { SynergyConfig } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';

export interface SoccerIntegralMatchAnalysisProps {
  timeline: SoccerTimelineResult;
  matchData: any;
  owaConfig: SoccerOwaConfig;
  dimAffinityMatrix: number[][];
  synergyConfigs: Record<SoccerConcept, SynergyConfig>;
  synergyConfig?: SynergyConfig;
  propagationConfig?: SoccerPropagationConfig;
  blockingConfig?: SoccerBlockingConfig;
  relativeConfig?: SoccerRelativeAdjustmentConfig;
  equalizationConfig?: SoccerEqualizationConfig;
  propagationConfigs?: Record<SoccerConcept, SoccerPropagationConfig>;
  blockingConfigs?: Record<SoccerConcept, SoccerBlockingConfig>;
  relativeConfigs?: Record<SoccerConcept, SoccerRelativeAdjustmentConfig>;
  equalizationConfigs?: Record<SoccerConcept, SoccerEqualizationConfig>;
}

export const SoccerIntegralMatchAnalysis: React.FC<SoccerIntegralMatchAnalysisProps> = ({
  timeline,
  matchData,
  owaConfig,
  dimAffinityMatrix,
  synergyConfigs,
  synergyConfig,
  propagationConfig,
  blockingConfig,
  relativeConfig,
  equalizationConfig,
  propagationConfigs,
  blockingConfigs,
  relativeConfigs,
  equalizationConfigs
}) => {
  const { t } = useI18n();

  const totalMinutes = timeline.totalMinutes || 90;
  const [sliderMinute, setSliderMinute] = useState<number>(totalMinutes);
  const [selectedConceptOrAgg, setSelectedConceptOrAgg] = useState<SoccerConcept | 'aggregate'>(
    'aggregate'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x
  const [selectedAffinityTeam, setSelectedAffinityTeam] = useState<'home' | 'away'>('home');
  const [isAffinityExpanded, setIsAffinityExpanded] = useState<boolean>(false);
  const expandedAffinityRef = useRef<HTMLDivElement>(null);
  const [expandedPlayerKeys, setExpandedPlayerKeys] = useState<Set<number | string>>(new Set());
  const [playerSegmentSelection, setPlayerSegmentSelection] = useState<Record<number | string, string | null>>({});

  // Synchronize slider minute when match or totalMinutes changes
  React.useEffect(() => {
    setSliderMinute(totalMinutes);
    setIsPlaying(false);
  }, [totalMinutes]);

  const allEvents = useMemo(
    () => [...(timeline.homeEvents || []), ...(timeline.awayEvents || [])],
    [timeline.homeEvents, timeline.awayEvents]
  );

  const toggleExpandPlayer = (key: number | string) => {
    setExpandedPlayerKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectPlayerSegment = (key: number | string, segmentId: string | null) => {
    setPlayerSegmentSelection(prev => ({
      ...prev,
      [key]: segmentId
    }));
  };

  const effectiveSliderMinute = Math.min(sliderMinute, totalMinutes);

  // Compute cumulative scores for all players up to effectiveSliderMinute
  const analysisResult: IntegralMatchAnalysisResult = useMemo(() => {
    return computeIntegralMatchCumulativeScores(
      timeline,
      matchData,
      selectedConceptOrAgg,
      owaConfig,
      dimAffinityMatrix,
      synergyConfigs,
      effectiveSliderMinute,
      propagationConfig,
      blockingConfig,
      relativeConfig,
      equalizationConfig,
      synergyConfig,
      propagationConfigs,
      blockingConfigs,
      relativeConfigs,
      equalizationConfigs
    );
  }, [
    timeline,
    matchData,
    selectedConceptOrAgg,
    owaConfig,
    dimAffinityMatrix,
    synergyConfigs,
    effectiveSliderMinute,
    propagationConfig,
    blockingConfig,
    relativeConfig,
    equalizationConfig,
    synergyConfig,
    propagationConfigs,
    blockingConfigs,
    relativeConfigs,
    equalizationConfigs
  ]);

  // Compute cumulative contextual affinity and distance matrix up to effectiveSliderMinute
  // Active general synergy config (if not overridden per dimension) or from selected concept
  const activeSynergyConfig =
    selectedConceptOrAgg === 'aggregate'
      ? synergyConfig || synergyConfigs?.['dribblesWon'] || { type: 'none', k: 1.0 }
      : synergyConfigs?.[selectedConceptOrAgg] || synergyConfig || { type: 'none', k: 1.0 };

  const homeCumulativeAffinity = useMemo(() => {
    return computeIntegralCumulativeAffinity(
      timeline,
      matchData,
      'home',
      activeSynergyConfig,
      effectiveSliderMinute,
      propagationConfig,
      blockingConfig
    );
  }, [
    timeline,
    matchData,
    activeSynergyConfig,
    effectiveSliderMinute,
    propagationConfig,
    blockingConfig
  ]);

  const awayCumulativeAffinity = useMemo(() => {
    return computeIntegralCumulativeAffinity(
      timeline,
      matchData,
      'away',
      activeSynergyConfig,
      effectiveSliderMinute,
      propagationConfig,
      blockingConfig
    );
  }, [
    timeline,
    matchData,
    activeSynergyConfig,
    effectiveSliderMinute,
    propagationConfig,
    blockingConfig
  ]);

  const cumulativeAffinity =
    selectedAffinityTeam === 'home' ? homeCumulativeAffinity : awayCumulativeAffinity;

  const handleOpenAffinity = (team: 'home' | 'away') => {
    setSelectedAffinityTeam(team);
    setIsAffinityExpanded(true);
    setTimeout(() => {
      expandedAffinityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const { homePlayers, awayPlayers, homeMvp, awayMvp, matchMvp, convergentCutPoints } =
    analysisResult;

  // Max score for relative progress bar scaling
  const maxScore = useMemo(() => {
    const all = [...homePlayers, ...awayPlayers].map(p => p.cumulativeScore);
    const m = Math.max(...all, 0.0001);
    return m > 0 ? m : 1;
  }, [homePlayers, awayPlayers]);

  // Playback timer with adjustable speed
  React.useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(25, Math.round(150 / playbackSpeed));
    const interval = setInterval(() => {
      setSliderMinute(prev => {
        if (prev >= totalMinutes) {
          setIsPlaying(false);
          return totalMinutes;
        }
        return Math.min(totalMinutes, prev + 1);
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPlaying, totalMinutes, playbackSpeed]);

  // Handle play/pause with automatic restart from beginning if currently at end
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (sliderMinute >= totalMinutes) {
        setSliderMinute(0);
      }
      setIsPlaying(true);
    }
  };

  // Jump to next or prev convergent cut point
  const handleStep = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const prevCuts = convergentCutPoints.filter(m => m < sliderMinute);
      if (prevCuts.length > 0) {
        setSliderMinute(prevCuts[prevCuts.length - 1]);
      } else {
        setSliderMinute(0);
      }
    } else {
      const nextCuts = convergentCutPoints.filter(m => m > sliderMinute);
      if (nextCuts.length > 0) {
        setSliderMinute(nextCuts[0]);
      } else {
        setSliderMinute(totalMinutes);
      }
    }
  };

  // Human label for key moments at convergent cut points
  const getCutPointLabel = (minute: number): string => {
    if (minute === 0) return t('soccer.integral.eventStart');
    if (minute === 45) return t('soccer.integral.eventHalfTime');
    if (minute === totalMinutes) return t('soccer.integral.eventMatchEnd');
    if (totalMinutes > 90 && minute === 90) return t('soccer.integral.eventFullTime');
    if (totalMinutes > 90 && minute === 105) return t('soccer.integral.eventExtraHalf');

    const ev = allEvents.find(e => e.minute === minute);
    if (ev) {
      if (ev.type === 'goal') return `⚽ ${ev.description}`;
      if (ev.type === 'red_card') return `🟥 ${ev.description}`;
      if (ev.type === 'sub') return `⇄ ${ev.description}`;
    }
    return `${minute}'`;
  };

  return (
    <Card
      title={
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.integral.cardTitle')}
          </span>
        </div>
      }
      className="bg-white/95 dark:bg-gray-900/95 shadow-sm"
    >
      <div className="space-y-6">
        {/* Selector: Multi-dimensional Aggregated (Global) vs Single Concept */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedConceptOrAgg('aggregate')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedConceptOrAgg === 'aggregate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('soccer.integral.optionAggregate')}</span>
            </button>

            {SOCCER_CONCEPTS.map(concept => (
              <button
                key={concept.key}
                type="button"
                onClick={() => setSelectedConceptOrAgg(concept.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedConceptOrAgg === concept.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{concept.name}</span>
              </button>
            ))}
          </div>

          {/* Current minute badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('soccer.integral.currentMinuteLabel')}:
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {sliderMinute}&apos; / {totalMinutes}&apos;
            </span>
          </div>
        </div>

        {/* Global Match MVP Banner (Solid background, no gradient) */}
        {matchMvp && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {t('soccer.integral.matchMvpBadge')} ({sliderMinute}&apos;)
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                  {matchMvp.player.name}{' '}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    ({matchMvp.teamName} · #{matchMvp.player.shirtNo})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('soccer.integral.cumulativeScoreLabel')}:
              </span>
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                {matchMvp.cumulativeScore.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {/* Cumulative Contextual Affinity Matrix Panel (colocado entre la indicación de MVP general y la línea temporal al ampliarse) */}
        {isAffinityExpanded && (
          <div ref={expandedAffinityRef} className="animate-in fade-in zoom-in-95 duration-200">
            <SoccerIntegralAffinityPanel
              timeline={timeline}
              players={cumulativeAffinity.players}
              AC_cum={cumulativeAffinity.AC_cum}
              AAI_cum={cumulativeAffinity.AAI_cum}
              A_cum={cumulativeAffinity.A_cum}
              pass_cum={cumulativeAffinity.pass_cum}
              currentMinute={sliderMinute}
              selectedTeam={selectedAffinityTeam}
              onSelectTeam={setSelectedAffinityTeam}
              onClose={() => setIsAffinityExpanded(false)}
            />
          </div>
        )}

        {/* Unified Convergent Timeline Bar with Movable Scrubber */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {t('soccer.integral.timelineTitle')}
            </span>

            {/* Playback Controls & Speed Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSliderMinute(0)}
                title={t('soccer.integral.btnReset')}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStep('prev')}
                title={t('soccer.integral.btnPrevCut')}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? t('soccer.integral.btnPause') : t('soccer.integral.btnPlay')}
                className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:bg-indigo-700"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? t('soccer.integral.pause') : t('soccer.integral.play')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleStep('next')}
                title={t('soccer.integral.btnNextCut')}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>

              {/* Speed Switcher Dropdown / Pills */}
              <div className="flex items-center bg-white dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xs ml-1">
                {[0.25, 0.5, 1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPlaybackSpeed(speed)}
                    title={`Velocidad ${speed}x`}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed === speed
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Convergent Segmented Visual Bar */}
          <div className="relative pt-6 pb-2">
            {/* Visual Bar Track */}
            <div className="relative h-7 w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 flex border border-gray-300 dark:border-gray-700 shadow-inner">
              {convergentCutPoints.map((cutMinute, idx) => {
                if (idx === convergentCutPoints.length - 1) return null;
                const nextMinute = convergentCutPoints[idx + 1];
                const segDuration = nextMinute - cutMinute;
                const widthPercent = (segDuration / totalMinutes) * 100;
                const isPassed = nextMinute <= sliderMinute;
                const isCurrent = cutMinute < sliderMinute && sliderMinute <= nextMinute;

                return (
                  <div
                    key={cutMinute}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full border-r border-white/40 dark:border-gray-900/40 transition-colors relative flex items-center justify-center min-w-0 flex-shrink-0 ${
                      isPassed
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        : isCurrent
                        ? 'bg-gradient-to-r from-indigo-400 to-indigo-300 dark:from-indigo-700 dark:to-indigo-800'
                        : 'bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/90 drop-shadow-xs select-none truncate px-0.5">
                      {segDuration}&apos;
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Convergent Cut Points Marker Pin Icons */}
            <div className="relative w-full h-5 mt-1">
              {convergentCutPoints.map(cutMinute => {
                const leftPercent = (cutMinute / totalMinutes) * 100;
                const isSpecial =
                  cutMinute === 0 ||
                  cutMinute === 45 ||
                  cutMinute === totalMinutes ||
                  (totalMinutes > 90 && (cutMinute === 90 || cutMinute === 105)) ||
                  allEvents.some(e => e.minute === cutMinute);

                return (
                  <button
                    key={cutMinute}
                    type="button"
                    onClick={() => setSliderMinute(cutMinute)}
                    title={getCutPointLabel(cutMinute)}
                    style={{ left: `${leftPercent}%` }}
                    className={`absolute -translate-x-1/2 flex flex-col items-center transition-all cursor-pointer ${
                      sliderMinute === cutMinute ? 'scale-125 z-10' : 'hover:scale-110 opacity-75'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-2 rounded-full ${
                        sliderMinute === cutMinute
                          ? 'bg-indigo-600 dark:bg-indigo-400 ring-2 ring-indigo-300'
                          : isSpecial
                          ? 'bg-amber-500 ring-1 ring-amber-300'
                          : 'bg-gray-400 dark:bg-gray-500'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400 mt-0.5 select-none">
                      {cutMinute}&apos;
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Native Slider Track overlay */}
            <input
              type="range"
              min={0}
              max={totalMinutes}
              step={1}
              value={effectiveSliderMinute}
              onChange={e => setSliderMinute(parseInt(e.target.value, 10))}
              className="w-full mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Quick Jump Buttons to Convergent Key Moments */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/60 dark:border-gray-800">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
              {t('soccer.integral.quickMomentsLabel')}:
            </span>
            {convergentCutPoints.map(cutMinute => {
              const label = getCutPointLabel(cutMinute);
              const isActive = sliderMinute === cutMinute;
              return (
                <button
                  key={cutMinute}
                  type="button"
                  onClick={() => setSliderMinute(cutMinute)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual-Column Participant Players Cumulative Evolution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Home Team (España) */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white/90 dark:bg-gray-900/90 shadow-sm flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                {timeline.homeCrestUrl && (
                  <img
                    src={timeline.homeCrestUrl}
                    alt={timeline.homeTeamName}
                    className="w-7 h-7 object-contain drop-shadow-xs"
                  />
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                    {timeline.homeTeamName}
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {homePlayers.length} {t('soccer.integral.participantsLabel')}
                  </span>
                </div>
              </div>

              {homeMvp && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>MVP: {homeMvp.player.name}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Reducido de Matriz de Afinidad Contextual del Equipo Local */}
            <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200/90 dark:border-gray-800 bg-linear-to-b from-gray-900 via-slate-900 to-black shadow-xs group">
              <div
                onClick={() => handleOpenAffinity('home')}
                className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                title={t('soccer.integral.expandAffinity')}
              >
                {homeCumulativeAffinity.players.length > 0 ? (
                  <SoccerPitchGraph
                    players={homeCumulativeAffinity.players}
                    matrix={homeCumulativeAffinity.AC_cum}
                    teamKey="home"
                    teamName={timeline.homeTeamName}
                    crestUrl={timeline.homeCrestUrl}
                    className="!rounded-xl !border-0 !shadow-none !max-w-none pointer-events-none"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {t('soccer.integral.noActivePlayers')}
                  </div>
                )}
              </div>

              {/* Botón icono de ampliación en la esquina superior derecha */}
              <button
                type="button"
                onClick={() => handleOpenAffinity('home')}
                title={t('soccer.integral.expandAffinity')}
                aria-label={t('soccer.integral.expandAffinity')}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-xs transition-all shadow-md cursor-pointer hover:scale-105 border border-white/20"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Player Performance Cards List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {homePlayers.map((item, idx) => {
                const key = `home_${item.player.id || item.player.name}`;
                return (
                  <ErrorBoundary key={key} fallbackTitle={`Error en jugador: ${item.player.name}`}>
                    <SoccerIntegralPlayerCard
                      item={item}
                      idx={idx}
                      isTop={idx === 0}
                      isMatchTop={item.isMatchMvp}
                      maxScore={maxScore}
                      isExpanded={expandedPlayerKeys.has(key)}
                      onToggleExpand={() => toggleExpandPlayer(key)}
                      selectedSegmentId={playerSegmentSelection[key] ?? null}
                      onSelectSegmentId={segId => selectPlayerSegment(key, segId)}
                    />
                  </ErrorBoundary>
                );
              })}
            </div>
          </div>

          {/* Column 2: Away Team (Argentina) */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white/90 dark:bg-gray-900/90 shadow-sm flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                {timeline.awayCrestUrl && (
                  <img
                    src={timeline.awayCrestUrl}
                    alt={timeline.awayTeamName}
                    className="w-7 h-7 object-contain drop-shadow-xs"
                  />
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                    {timeline.awayTeamName}
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {awayPlayers.length} {t('soccer.integral.participantsLabel')}
                  </span>
                </div>
              </div>

              {awayMvp && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>MVP: {awayMvp.player.name}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Reducido de Matriz de Afinidad Contextual del Equipo Visitante */}
            <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200/90 dark:border-gray-800 bg-linear-to-b from-gray-900 via-slate-900 to-black shadow-xs group">
              <div
                onClick={() => handleOpenAffinity('away')}
                className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                title={t('soccer.integral.expandAffinity')}
              >
                {awayCumulativeAffinity.players.length > 0 ? (
                  <SoccerPitchGraph
                    players={awayCumulativeAffinity.players}
                    matrix={awayCumulativeAffinity.AC_cum}
                    teamKey="away"
                    teamName={timeline.awayTeamName}
                    crestUrl={timeline.awayCrestUrl}
                    className="!rounded-xl !border-0 !shadow-none !max-w-none pointer-events-none"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {t('soccer.integral.noActivePlayers')}
                  </div>
                )}
              </div>

              {/* Botón icono de ampliación en la esquina superior derecha */}
              <button
                type="button"
                onClick={() => handleOpenAffinity('away')}
                title={t('soccer.integral.expandAffinity')}
                aria-label={t('soccer.integral.expandAffinity')}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-xs transition-all shadow-md cursor-pointer hover:scale-105 border border-white/20"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Player Performance Cards List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {awayPlayers.map((item, idx) => {
                const key = `away_${item.player.id || item.player.name}`;
                return (
                  <ErrorBoundary key={key} fallbackTitle={`Error en jugador: ${item.player.name}`}>
                    <SoccerIntegralPlayerCard
                      item={item}
                      idx={idx}
                      isTop={idx === 0}
                      isMatchTop={item.isMatchMvp}
                      maxScore={maxScore}
                      isExpanded={expandedPlayerKeys.has(key)}
                      onToggleExpand={() => toggleExpandPlayer(key)}
                      selectedSegmentId={playerSegmentSelection[key] ?? null}
                      onSelectSegmentId={segId => selectPlayerSegment(key, segId)}
                    />
                  </ErrorBoundary>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Sparkles,
  Layers
} from 'lucide-react';
import { Card } from './Card';
import { SoccerIntegralAffinityPanel } from './SoccerIntegralAffinityPanel';
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
  propagationConfig?: SoccerPropagationConfig;
  blockingConfig?: SoccerBlockingConfig;
  relativeConfig?: SoccerRelativeAdjustmentConfig;
  equalizationConfig?: SoccerEqualizationConfig;
}

export const SoccerIntegralMatchAnalysis: React.FC<SoccerIntegralMatchAnalysisProps> = ({
  timeline,
  matchData,
  owaConfig,
  dimAffinityMatrix,
  synergyConfigs,
  propagationConfig,
  blockingConfig,
  relativeConfig,
  equalizationConfig
}) => {
  const { t } = useI18n();

  const totalMinutes = timeline.totalMinutes || 120;
  const [sliderMinute, setSliderMinute] = useState<number>(totalMinutes);
  const [selectedConceptOrAgg, setSelectedConceptOrAgg] = useState<SoccerConcept | 'aggregate'>(
    'aggregate'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedAffinityTeam, setSelectedAffinityTeam] = useState<'home' | 'away'>('home');

  // Compute cumulative scores for all players up to sliderMinute
  const analysisResult: IntegralMatchAnalysisResult = useMemo(() => {
    return computeIntegralMatchCumulativeScores(
      timeline,
      matchData,
      selectedConceptOrAgg,
      owaConfig,
      dimAffinityMatrix,
      synergyConfigs,
      sliderMinute,
      propagationConfig,
      blockingConfig,
      relativeConfig,
      equalizationConfig
    );
  }, [
    timeline,
    matchData,
    selectedConceptOrAgg,
    owaConfig,
    dimAffinityMatrix,
    synergyConfigs,
    sliderMinute,
    propagationConfig,
    blockingConfig,
    relativeConfig,
    equalizationConfig
  ]);

  // Compute cumulative contextual affinity and distance matrix up to sliderMinute
  const activeSynergyConfig =
    selectedConceptOrAgg === 'aggregate'
      ? synergyConfigs['dribblesWon'] || { type: 'factor', k: 1.0 }
      : synergyConfigs[selectedConceptOrAgg] || { type: 'factor', k: 1.0 };

  const cumulativeAffinity = useMemo(() => {
    return computeIntegralCumulativeAffinity(
      timeline,
      matchData,
      selectedAffinityTeam,
      activeSynergyConfig,
      sliderMinute,
      propagationConfig,
      blockingConfig
    );
  }, [
    timeline,
    matchData,
    selectedAffinityTeam,
    activeSynergyConfig,
    sliderMinute,
    propagationConfig,
    blockingConfig
  ]);

  const { homePlayers, awayPlayers, homeMvp, awayMvp, matchMvp, convergentCutPoints } =
    analysisResult;

  // Max score for relative progress bar scaling
  const maxScore = useMemo(() => {
    const all = [...homePlayers, ...awayPlayers].map(p => p.cumulativeScore);
    const m = Math.max(...all, 0.0001);
    return m > 0 ? m : 1;
  }, [homePlayers, awayPlayers]);

  // Playback timer
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSliderMinute(prev => {
        if (prev >= totalMinutes) {
          setIsPlaying(false);
          return totalMinutes;
        }
        return Math.min(totalMinutes, prev + 2);
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying, totalMinutes]);

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
    if (minute === 18) return '⚽ Gol Messi (ARG)';
    if (minute === 34) return '⚽ Gol Olmo (ESP)';
    if (minute === 45) return t('soccer.integral.eventHalfTime');
    if (minute === 57) return '⚽ Gol Mac Allister (ARG)';
    if (minute === 79) return '⚽ Gol Yamal (ESP)';
    if (minute === 90) return t('soccer.integral.eventFullTime');
    if (minute === 105) return t('soccer.integral.eventExtraHalf');
    if (minute === 108) return '⚽ Gol Rodri (ESP)';
    if (minute === 120) return t('soccer.integral.eventMatchEnd');
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

        {/* Cumulative Contextual Affinity Matrix Panel (colocado entre la indicación de MVP general y la línea temporal) */}
        <SoccerIntegralAffinityPanel
          timeline={timeline}
          players={cumulativeAffinity.players}
          AC_cum={cumulativeAffinity.AC_cum}
          pass_cum={cumulativeAffinity.pass_cum}
          currentMinute={sliderMinute}
          selectedTeam={selectedAffinityTeam}
          onSelectTeam={setSelectedAffinityTeam}
        />

        {/* Unified Convergent Timeline Bar with Movable Scrubber */}
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {t('soccer.integral.timelineTitle')}
            </span>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5">
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
                onClick={() => setIsPlaying(prev => !prev)}
                title={isPlaying ? t('soccer.integral.btnPause') : t('soccer.integral.btnPlay')}
                className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
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
                    className={`h-full border-r border-white/40 dark:border-gray-900/40 transition-colors relative flex items-center justify-center ${
                      isPassed
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        : isCurrent
                        ? 'bg-gradient-to-r from-indigo-400 to-indigo-300 dark:from-indigo-700 dark:to-indigo-800'
                        : 'bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/90 drop-shadow-xs select-none">
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
                const isSpecial = [18, 34, 45, 57, 79, 90, 105, 108, 120].includes(cutMinute);

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
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
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
              value={sliderMinute}
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

            {/* Player Performance Cards List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {homePlayers.map((item, idx) => {
                const isTop = idx === 0;
                const isMatchTop = item.isMatchMvp;
                const scorePercent = Math.min(100, Math.max(0, (item.cumulativeScore / maxScore) * 100));

                return (
                  <div
                    key={item.player.id || item.player.name}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isMatchTop
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/60 shadow-xs'
                        : isTop
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                        : 'bg-white/70 dark:bg-gray-800/60 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 font-mono text-[10px] font-bold text-gray-700 dark:text-gray-300">
                          {item.player.shirtNo || idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {item.player.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
                          {item.player.position}
                        </span>
                        {isMatchTop && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white shrink-0">
                            MVP Partido
                          </span>
                        )}
                      </div>

                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                        {item.cumulativeScore.toFixed(3)}
                      </span>
                    </div>

                    {/* Fluid progress bar */}
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMatchTop
                            ? 'bg-amber-500'
                            : isTop
                            ? 'bg-indigo-600 dark:bg-indigo-500'
                            : 'bg-indigo-500 dark:bg-indigo-600'
                        }`}
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
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

            {/* Player Performance Cards List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {awayPlayers.map((item, idx) => {
                const isTop = idx === 0;
                const isMatchTop = item.isMatchMvp;
                const scorePercent = Math.min(100, Math.max(0, (item.cumulativeScore / maxScore) * 100));

                return (
                  <div
                    key={item.player.id || item.player.name}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isMatchTop
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/60 shadow-xs'
                        : isTop
                        ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/60'
                        : 'bg-white/70 dark:bg-gray-800/60 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 font-mono text-[10px] font-bold text-gray-700 dark:text-gray-300">
                          {item.player.shirtNo || idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {item.player.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
                          {item.player.position}
                        </span>
                        {isMatchTop && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white shrink-0">
                            MVP Partido
                          </span>
                        )}
                      </div>

                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                        {item.cumulativeScore.toFixed(3)}
                      </span>
                    </div>

                    {/* Fluid progress bar */}
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMatchTop
                            ? 'bg-amber-500'
                            : isTop
                            ? 'bg-cyan-600 dark:bg-cyan-500'
                            : 'bg-cyan-500 dark:bg-cyan-600'
                        }`}
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
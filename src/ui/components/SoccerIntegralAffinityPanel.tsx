import React, { useState } from 'react';
import { Network, Table, ChevronDown, ChevronUp, Database, Shield, X } from 'lucide-react';
import { MatchPlayer, SoccerTimelineResult } from '../../logic/soccerAnalysis';
import { useI18n } from '../i18n/I18nContext';
import { SoccerPitchGraph } from './SoccerPitchGraph';

export interface SoccerIntegralAffinityPanelProps {
  timeline: SoccerTimelineResult;
  players: MatchPlayer[];
  AC_cum: number[][];
  pass_cum: number[][];
  currentMinute: number;
  selectedTeam: 'home' | 'away';
  onSelectTeam: (team: 'home' | 'away') => void;
  className?: string;
  onClose?: () => void;
}

export const SoccerIntegralAffinityPanel: React.FC<SoccerIntegralAffinityPanelProps> = ({
  timeline,
  players,
  AC_cum,
  pass_cum,
  currentMinute,
  selectedTeam,
  onSelectTeam,
  className = '',
  onClose
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'matrix' | 'graph'>('graph');
  const [showPassDebug, setShowPassDebug] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (key: string) => {
    setImgErrors(prev => ({ ...prev, [key]: true }));
  };

  const isHome = selectedTeam === 'home';
  const teamName = isHome ? timeline.homeTeamName : timeline.awayTeamName;
  const crestUrl = isHome ? timeline.homeCrestUrl : timeline.awayCrestUrl;
  const hasCrest = crestUrl && !imgErrors[selectedTeam];

  return (
    <div
      className={`rounded-2xl p-4 bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 space-y-4 shadow-2xs ${className}`}
    >
      {/* 1. Header with Team Switcher and Mode Toggle (Grafo / Matriz) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.integral.cumulativeAffinityTitle')} (A<sup>C</sup>
            <sub className="text-[10px]">acum</sub>)
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            0&apos; - {currentMinute}&apos;
          </span>
        </div>

        {/* Team Selector & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Team Tabs Toggle (España vs Argentina) */}
          <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
            {/* Home Team Button */}
            <button
              type="button"
              onClick={() => onSelectTeam('home')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isHome
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {timeline.homeCrestUrl && !imgErrors['home'] ? (
                <img
                  src={timeline.homeCrestUrl}
                  alt={timeline.homeTeamName}
                  onError={() => handleImgError('home')}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>{timeline.homeTeamName}</span>
            </button>

            {/* Away Team Button */}
            <button
              type="button"
              onClick={() => onSelectTeam('away')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isHome
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {timeline.awayCrestUrl && !imgErrors['away'] ? (
                <img
                  src={timeline.awayCrestUrl}
                  alt={timeline.awayTeamName}
                  onError={() => handleImgError('away')}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>{timeline.awayTeamName}</span>
            </button>
          </div>

          {/* Mode Switcher: Matrix vs Graph */}
          <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              title={t('soccer.dimension.modeMatrix')}
              aria-label={t('soccer.dimension.modeMatrix')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t('soccer.dimension.modeMatrix')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('graph')}
              title={t('soccer.dimension.modeGraph')}
              aria-label={t('soccer.dimension.modeGraph')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('soccer.dimension.modeGraph')}</span>
            </button>
          </div>

          {/* Close button to hide the expanded panel */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title={t('soccer.integral.closeAffinity')}
              aria-label={t('soccer.integral.closeAffinity')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-red-600 dark:hover:text-red-400 shrink-0" />
              <span>{t('common.close')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Cumulative Content: Horizontal Pitch Graph OR Cumulative Matrix Table */}
      {viewMode === 'graph' ? (
        <div className="py-2">
          {players.length > 0 ? (
            <SoccerPitchGraph
              players={players}
              matrix={AC_cum}
              teamKey={selectedTeam}
              teamName={teamName}
              crestUrl={crestUrl}
              decimalPrecision={2}
            />
          ) : (
            <div className="text-center py-8 text-xs text-gray-500">
              No hay jugadores activos para este equipo en el minuto seleccionado.
            </div>
          )}
        </div>
      ) : (
        /* Matrix View Mode (Clean, uncolored table) */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-2 text-left text-[11px] text-gray-500 dark:text-gray-400 font-bold w-28">
                  #
                </th>
                {players.map((colP, j) => (
                  <th
                    key={j}
                    className="p-1.5 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 min-w-[34px]"
                    title={`#${colP.shirtNo} ${colP.name}`}
                  >
                    #{colP.shirtNo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((rowP, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td
                    className="p-1.5 text-left font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                    title={`#${rowP.shirtNo} ${rowP.name}`}
                  >
                    <span className="font-mono text-gray-500 dark:text-gray-400 mr-1.5 font-bold">
                      #{rowP.shirtNo}
                    </span>
                    {rowP.name}
                  </td>
                  {players.map((colP, j) => {
                    const val = AC_cum[i]?.[j] ?? 0;
                    const isDiag = i === j;

                    return (
                      <td
                        key={j}
                        title={`${rowP.name} → ${colP.name}: ${isDiag ? '1.00' : val.toFixed(2)}`}
                        className="p-1.5 font-mono text-[11px] text-gray-800 dark:text-gray-200"
                      >
                        {isDiag ? '1.00' : val > 0 ? val.toFixed(2) : '0'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Collapsible Debug Section: Cumulative Raw Pass Count / Distance Matrix */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowPassDebug(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs transition-all cursor-pointer select-none"
        >
          <Database className="w-3.5 h-3.5 text-gray-500" />
          <span>
            {showPassDebug
              ? t('soccer.integral.hideCumulativePassDebug')
              : t('soccer.integral.cumulativePassDebug')}
          </span>
          {showPassDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPassDebug && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Conteo acumulado de pases puros completados hasta el minuto {currentMinute}&apos; para {teamName} (acumulación incremental dependiente del slider / animación):
            </div>
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2 text-left text-[11px] text-gray-500 dark:text-gray-400 font-bold w-28">
                    #
                  </th>
                  {players.map((colP, j) => (
                    <th
                      key={j}
                      className="p-1.5 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 min-w-[34px]"
                      title={`#${colP.shirtNo} ${colP.name}`}
                    >
                      #{colP.shirtNo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((rowP, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td
                      className="p-1.5 text-left font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                      title={`#${rowP.shirtNo} ${rowP.name}`}
                    >
                      <span className="font-mono text-gray-500 dark:text-gray-400 mr-1.5 font-bold">
                        #{rowP.shirtNo}
                      </span>
                      {rowP.name}
                    </td>
                    {players.map((colP, j) => {
                      const count = pass_cum[i]?.[j] ?? 0;
                      const isDiag = i === j;

                      return (
                        <td
                          key={j}
                          title={`${rowP.name} → ${colP.name}: ${isDiag ? '-' : count}`}
                          className="p-1.5 font-mono text-[11px] text-gray-800 dark:text-gray-200"
                        >
                          {isDiag ? '-' : count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

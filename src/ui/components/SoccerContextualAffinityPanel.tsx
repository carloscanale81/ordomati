import React, { useState } from 'react';
import {
  Table,
  Network,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react';
import {
  MatchPlayer,
  TimelineSegment
} from '../../logic/soccerAnalysis';
import { useI18n } from '../i18n/I18nContext';
import { SoccerPitchGraph } from './SoccerPitchGraph';

export interface SoccerContextualAffinityPanelProps {
  segment: TimelineSegment;
  players: MatchPlayer[];
  AC: number[][];
  passCounts?: number[][];
  teamKey?: 'home' | 'away';
  crestUrl?: string;
  className?: string;
}

export const SoccerContextualAffinityPanel: React.FC<SoccerContextualAffinityPanelProps> = ({
  segment,
  players,
  AC,
  passCounts,
  teamKey = 'home',
  crestUrl,
  className = ''
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'matrix' | 'graph'>('graph');
  const [showDistanceDebug, setShowDistanceDebug] = useState(false);

  return (
    <div
      className={`rounded-2xl p-4 bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 space-y-4 ${className}`}
    >
      {/* 1. Contextual Affinity Matrix Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {t('soccer.dimension.acTitle')} ({segment.startMinute}' - {segment.endMinute}')
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
            {segment.team === 'home' ? t('soccer.timeline.homeTeam') : t('soccer.timeline.awayTeam')}
          </span>
        </div>

        {/* Mode Toggle: Matrix Table vs Pitch Graph */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            title={t('soccer.dimension.modeMatrix')}
            aria-label={t('soccer.dimension.modeMatrix')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-2xs'
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
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{t('soccer.dimension.modeGraph')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Affinity Content: Horizontal Soccer Pitch Graph OR Matrix Table */}
      {viewMode === 'graph' ? (
        <div className="py-2">
          <SoccerPitchGraph
            players={players}
            matrix={AC}
            teamKey={teamKey || segment.team}
            teamName={segment.teamName}
            crestUrl={crestUrl}
            decimalPrecision={2}
          />
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
                    const val = AC[i]?.[j] ?? 0;
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

      {/* 4. Collapsible Debug Section: Raw Base Pass / Distance Matrix */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowDistanceDebug(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs transition-all cursor-pointer select-none"
        >
          <Database className="w-3.5 h-3.5 text-gray-500" />
          <span>
            {showDistanceDebug
              ? t('soccer.affinity.hideDistanceDebug') || 'Ocultar depuración de pases / distancia'
              : t('soccer.affinity.distanceMatrixDebug') || 'Depuración: Matriz de pases / distancia (conteo base)'}
          </span>
          {showDistanceDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDistanceDebug && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Conteo de pases puros completados entre jugadores en este segmento (base de afinidad sinérgica):
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
                      const count = passCounts?.[i]?.[j] ?? 0;
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

import React, { useState, useMemo } from 'react';
import {
  Table,
  Network,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  MatchPlayer,
  TimelineSegment
} from '../../logic/soccerAnalysis';
import { invertMatrixDetailed } from '../../logic/affinity';
import { useI18n } from '../i18n/I18nContext';
import { SoccerPitchGraph } from './SoccerPitchGraph';

export type AffinityStage = 'distance' | 'propagation' | 'blocking' | 'contextual' | 'inverse';

export interface SoccerContextualAffinityPanelProps {
  segment: TimelineSegment;
  players: MatchPlayer[];
  AC: number[][]; // Contextual affinity matrix (after synergy)
  AAI?: number[][]; // Autoinduced affinity matrix (after blocking)
  A?: number[][]; // Base affinity matrix (after propagation)
  passCounts?: number[][]; // Raw pass count matrix (distance)
  teamKey?: 'home' | 'away';
  crestUrl?: string;
  className?: string;
}

export const SoccerContextualAffinityPanel: React.FC<SoccerContextualAffinityPanelProps> = ({
  segment,
  players,
  AC,
  AAI,
  A,
  passCounts,
  teamKey = 'home',
  crestUrl,
  className = ''
}) => {
  const { language } = useI18n();
  const isEs = language === 'es';
  const [viewMode, setViewMode] = useState<'matrix' | 'graph'>('graph');

  // Compute inverse of contextual affinity (A^C)^(-1) for the 5th stage
  const invAC = useMemo(() => {
    if (!AC || AC.length === 0) return [];
    try {
      const { matrix } = invertMatrixDetailed(AC);
      return matrix;
    } catch {
      return Array.from({ length: AC.length }, () => Array(AC.length).fill(0));
    }
  }, [AC]);

  // 5 horizontal stages ordered linearly:
  // 0: Distancia (Pases base)
  // 1: Afinidad (Propagación)
  // 2: Afinidad Autoinducida (Bloqueo)
  // 3: Afinidad Contextual (Sinergia) -> Vista inicial predeterminada
  // 4: Inversa Contextual ((A^C)^(-1)) -> Para el cálculo inverso de VP
  const [stageIndex, setStageIndex] = useState<number>(3);

  const stages: {
    key: AffinityStage;
    label: string;
    subtitle: string;
    matrix: number[][];
    isInteger?: boolean;
    precision: number;
  }[] = [
    {
      key: 'distance',
      label: isEs ? 'Distancia' : 'Distance',
      subtitle: isEs
        ? 'Pases puros entre jugadores'
        : 'Direct passes between players',
      matrix: passCounts || Array.from({ length: players.length }, () => Array(players.length).fill(0)),
      isInteger: true,
      precision: 0
    },
    {
      key: 'propagation',
      label: isEs ? 'Afinidad' : 'Affinity',
      subtitle: isEs
        ? 'Afinidad base (propagación)'
        : 'Base affinity (propagation)',
      matrix: A || AC,
      precision: 2
    },
    {
      key: 'blocking',
      label: isEs ? 'Afinidad Autoinducida' : 'Autoinduced Affinity',
      subtitle: isEs
        ? 'Bloqueo y conservación por filas'
        : 'Blocking & row conservation',
      matrix: AAI || AC,
      precision: 2
    },
    {
      key: 'contextual',
      label: isEs ? 'Afinidad Contextual' : 'Contextual Affinity',
      subtitle: isEs
        ? 'Sinergia y modulación contextual'
        : 'Synergy & contextual modulation',
      matrix: AC,
      precision: 2
    },
    {
      key: 'inverse',
      label: isEs ? 'Inversa Contextual' : 'Inverse Contextual',
      subtitle: isEs
        ? 'Matriz inversa (A^C)⁻¹ para resolución de V^P'
        : 'Inverse matrix (A^C)⁻¹ for V^P resolution',
      matrix: invAC,
      precision: 3
    }
  ];

  const currentStage = stages[stageIndex];
  const activeMatrix = currentStage.matrix;

  // Strict linear navigation: cannot loop directly between distance and contextual
  const canGoPrev = stageIndex > 0;
  const canGoNext = stageIndex < stages.length - 1;

  const handlePrevStage = () => {
    if (canGoPrev) setStageIndex(prev => prev - 1);
  };

  const handleNextStage = () => {
    if (canGoNext) setStageIndex(prev => prev + 1);
  };

  const teamLabel = segment.teamName || (segment.team === 'home' ? (isEs ? 'Local' : 'Home') : (isEs ? 'Visitante' : 'Away'));

  return (
    <div
      className={`rounded-2xl p-4 bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 space-y-4 ${className}`}
    >
      {/* 1. Header Integrado: Equipo, Intervalo de tiempo y Vista activa entre Distancia, Afinidad, etc. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
            <span>{isEs ? 'Flujos de Valor' : 'Value Flows'}:</span>
            <span className="text-blue-600 dark:text-blue-400">{currentStage.label}</span>
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
            {teamLabel} ({segment.startMinute}' - {segment.endMinute}')
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
            ({stageIndex + 1}/{stages.length})
          </span>
        </div>

        {/* Mode Toggle: Matrix Table vs Pitch Graph */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            title={isEs ? 'Modo Tabla' : 'Table Mode'}
            aria-label={isEs ? 'Modo Tabla' : 'Table Mode'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{isEs ? 'Tabla' : 'Table'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('graph')}
            title={isEs ? 'Modo Grafo' : 'Graph Mode'}
            aria-label={isEs ? 'Modo Grafo' : 'Graph Mode'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{isEs ? 'Grafo' : 'Graph'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Area with Lateral Nav Controls on Left & Right */}
      <div className="relative flex items-center justify-between gap-2">
        {/* Left Discrete Nav Button (disabled when at first stage: Distance) */}
        <button
          type="button"
          onClick={handlePrevStage}
          disabled={!canGoPrev}
          title={
            canGoPrev
              ? `${isEs ? 'Anterior:' : 'Previous:'} ${stages[stageIndex - 1].label}`
              : isEs ? 'Extremo inicial (Distancia)' : 'Initial boundary (Distance)'
          }
          aria-label={isEs ? 'Etapa anterior' : 'Previous stage'}
          className={`z-20 p-2 sm:p-2.5 rounded-full border shadow-sm transition-all shrink-0 ${
            canGoPrev
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer active:scale-95'
              : 'bg-gray-100/70 dark:bg-gray-800/40 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed opacity-40'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Pitch Graph OR Matrix Table */}
        <div className="flex-1 min-w-0">
          {viewMode === 'graph' ? (
            <div className="py-1">
              <SoccerPitchGraph
                players={players}
                matrix={activeMatrix}
                teamKey={teamKey || segment.team}
                teamName={segment.teamName}
                crestUrl={crestUrl}
                decimalPrecision={currentStage.precision}
              />
            </div>
          ) : (
            /* Matrix View Mode (Tabla completa con columna Σ Sumatorio) */
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/90 shadow-2xs p-2">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                {currentStage.label} — {currentStage.subtitle}:
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
                    <th
                      className="p-1.5 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-[42px] bg-indigo-50/50 dark:bg-indigo-950/30"
                      title={isEs ? 'Sumatorio de la fila' : 'Row sum'}
                    >
                      Σ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((rowP, i) => {
                    const rowSum = (activeMatrix[i] || []).reduce(
                      (acc, v) => acc + (typeof v === 'number' && Number.isFinite(v) ? v : 0),
                      0
                    );
                    return (
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
                          const rawVal = activeMatrix[i]?.[j] ?? 0;
                          const isDiag = i === j;
                          const displayVal = currentStage.isInteger
                            ? (isDiag ? '-' : String(rawVal))
                            : rawVal.toFixed(currentStage.precision);

                          return (
                            <td
                              key={j}
                              title={`${rowP.name} → ${colP.name}: ${displayVal}`}
                              className={`p-1.5 font-mono text-[11px] text-gray-800 dark:text-gray-200 ${
                                isDiag ? 'font-bold text-blue-600 dark:text-blue-400' : ''
                              }`}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                        <td className="p-1.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                          {currentStage.isInteger ? String(Math.round(rowSum)) : rowSum.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Discrete Nav Button (disabled when at last stage: Contextual Affinity) */}
        <button
          type="button"
          onClick={handleNextStage}
          disabled={!canGoNext}
          title={
            canGoNext
              ? `${isEs ? 'Siguiente:' : 'Next:'} ${stages[stageIndex + 1].label}`
              : isEs ? 'Extremo final (Afinidad Contextual)' : 'Final boundary (Contextual Affinity)'
          }
          aria-label={isEs ? 'Etapa siguiente' : 'Next stage'}
          className={`z-20 p-2 sm:p-2.5 rounded-full border shadow-sm transition-all shrink-0 ${
            canGoNext
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer active:scale-95'
              : 'bg-gray-100/70 dark:bg-gray-800/40 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed opacity-40'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

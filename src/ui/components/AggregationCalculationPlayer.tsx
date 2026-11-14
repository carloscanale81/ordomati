import React, { useState } from 'react';
import { OrbBadge } from './OrbBadge';
import { MathText } from './Formula';
import { Characteristic } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';

export interface AggregationCalculationPlayerProps {
  elements: string[];
  elementImages?: string[];
  characteristics: Characteristic[];
  V: number[][];
  RWA: number[][];
  A_final: number[];
  ranking: number[];
  decimalPrecision?: number;
}

interface MatrixBracketProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  dimText?: string;
}

const MatrixBracket: React.FC<MatrixBracketProps> = ({ children, label, dimText }) => (
  <div className="flex flex-col items-center select-none">
    {label && (
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">{label}</span>
        {dimText && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">[{dimText}]</span>
        )}
      </div>
    )}
    <div className="relative inline-flex items-center p-2 sm:p-3">
      {/* Mathematical Left Bracket */}
      <div className="absolute left-0 top-0 bottom-0 w-3 border-l-2 border-t-2 border-b-2 border-gray-400 dark:border-gray-500 rounded-l-md pointer-events-none" />
      {/* Inner Content */}
      <div className="px-2 py-1">{children}</div>
      {/* Mathematical Right Bracket */}
      <div className="absolute right-0 top-0 bottom-0 w-3 border-r-2 border-t-2 border-b-2 border-gray-400 dark:border-gray-500 rounded-r-md pointer-events-none" />
    </div>
  </div>
);

export const AggregationCalculationPlayer: React.FC<AggregationCalculationPlayerProps> = ({
  elements,
  elementImages = [],
  characteristics,
  V,
  RWA,
  A_final,
  ranking,
  decimalPrecision = 4
}) => {
  const { t } = useI18n();
  const n = elements.length;
  const m = characteristics.length;
  const totalSubSteps = Math.max(1, n * m);

  // currentStep ranges from 0 to n * m - 1
  // elIdx (row i / alternative) = Math.floor(currentStep / m)
  // dimIdx (col j / dimension) = currentStep % m
  const [currentStep, setCurrentStep] = useState<number>(0);

  const safeStep = Math.min(totalSubSteps - 1, Math.max(0, currentStep));
  const elIdx = m > 0 ? Math.min(n - 1, Math.floor(safeStep / m)) : 0;
  const dimIdx = m > 0 ? safeStep % m : 0;

  const activeElement = elements[elIdx] || `E${elIdx + 1}`;
  const activeDim = characteristics[dimIdx];
  const activeDimName = activeDim?.name || `D${dimIdx + 1}`;
  const activeRank = ranking.indexOf(elIdx) + 1;

  // Running accumulated sum for active element row up to dimIdx
  let runningSumForActiveEl = 0;
  for (let k = 0; k <= dimIdx; k++) {
    runningSumForActiveEl += (V[elIdx]?.[k] ?? 0) * (RWA[elIdx]?.[k] ?? 0);
  }

  // Terms breakdown for active element across dimensions
  const terms = characteristics.map((c, j) => {
    const vVal = V[elIdx]?.[j] ?? 0;
    const wVal = RWA[elIdx]?.[j] ?? 0;
    const prod = vVal * wVal;
    const isEvaluated = j <= dimIdx;
    const isCurrentActive = j === dimIdx;
    return {
      dimIdx: j,
      dimName: c.name,
      dimImage: c.image,
      vVal,
      wVal,
      prod,
      isEvaluated,
      isCurrentActive
    };
  });

  const finalElementVal = A_final[elIdx] ?? 0;

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* 1. UNIFIED CARD: COMPACT MATRIX PRODUCT RECREATION WITH HEADER SLIDER */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        {/* Card Header: Formula on left + Segmented Slider Line on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="font-mono text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-600 dark:text-emerald-400"><MathText text="A_final" /></span>
              <span className="text-gray-400">=</span>
              <span className="text-gray-400">(</span>
              <span className="text-blue-600 dark:text-blue-400">V</span>
              <span className="text-gray-400">⊙</span>
              <span className="text-indigo-600 dark:text-indigo-400">RWA</span>
              <span className="text-gray-400">)</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600 dark:text-gray-300">1</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">
              (<MathText text="A_{final,i} = Σ V_{ij} · RWA_{ij}" />)
            </p>
          </div>

          {/* Segmented Scrubber Line: horizontal, aligned right, no numbers/text, faint dividing lines */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="relative flex items-center w-40 sm:w-56 h-3 select-none">
              <div className="absolute inset-0 flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/90 shadow-2xs">
                {Array.from({ length: totalSubSteps }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-full border-r border-gray-300/60 dark:border-gray-700/70 last:border-r-0 transition-colors ${
                      idx < safeStep
                        ? 'bg-emerald-500 text-white'
                        : idx === safeStep
                        ? 'bg-emerald-600 text-white ring-1 ring-white/70 shadow-2xs'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={totalSubSteps - 1}
                step={1}
                value={safeStep}
                onChange={e => setCurrentStep(Number(e.target.value))}
                aria-label={t('player.ariaAggProgress')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Compact Grid Representation: [ V (n×m) ] ⊙ [ RWA (n×m) ] → [ A_final (n×1) ] */}
        <div className="flex flex-col items-center justify-center py-2">
          {/* Status Subtitle Pill */}
          <div className="flex items-center gap-2 mb-4 font-mono text-xs flex-wrap justify-center">
            <span className="px-2.5 py-0.5 rounded-full font-mono text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              [{activeElement}, {activeDimName}]
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.dimOf', { current: dimIdx + 1, total: m })}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.accumulated')} <strong className="text-gray-900 dark:text-gray-100">{runningSumForActiveEl.toFixed(decimalPrecision)}</strong>
            </span>
          </div>

          {/* Compact Grids Equation */}
          <div className="inline-flex items-center gap-3 sm:gap-6 justify-center max-w-full overflow-x-auto p-2 no-scrollbar">
            {/* 1. MATRIX V: n × m grid */}
            <MatrixBracket label="V" dimText={`${n}×${m}`}>
              <div className="flex flex-col gap-1">
                {elements.map((el, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {characteristics.map((c, j) => {
                      const val = V[i]?.[j] ?? 0;
                      const isRowActive = i === elIdx;
                      const isCellActive = isRowActive && j === dimIdx;
                      const isEvaluatedInRow = isRowActive && j < dimIdx;
                      return (
                        <div
                          key={j}
                          onClick={() => setCurrentStep(i * m + j)}
                          title={`V[${el}, ${c.name}] = ${val.toFixed(decimalPrecision)}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer select-none flex items-center justify-center text-[10px] font-mono ${
                            isCellActive
                              ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 shadow-md scale-115 z-20 animate-pulse text-amber-950 font-bold'
                              : isEvaluatedInRow
                              ? 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                              : isRowActive
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-300'
                          }`}
                        >
                          {el[0]}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-xl sm:text-2xl font-black select-none">⊙</div>

            {/* 2. MATRIX RWA: n × m grid */}
            <MatrixBracket label="RWA" dimText={`${n}×${m}`}>
              <div className="flex flex-col gap-1">
                {elements.map((el, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {characteristics.map((c, j) => {
                      const val = RWA[i]?.[j] ?? 0;
                      const isRowActive = i === elIdx;
                      const isCellActive = isRowActive && j === dimIdx;
                      const isEvaluatedInRow = isRowActive && j < dimIdx;
                      return (
                        <div
                          key={j}
                          onClick={() => setCurrentStep(i * m + j)}
                          title={`RWA[${el}, ${c.name}] = ${val.toFixed(decimalPrecision)}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer select-none flex items-center justify-center text-[10px] font-mono ${
                            isCellActive
                              ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 shadow-md scale-115 z-20 animate-pulse text-amber-950 font-bold'
                              : isEvaluatedInRow
                              ? 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                              : isRowActive
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400'
                              : 'bg-gray-100/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-indigo-300'
                          }`}
                        >
                          {c.name.slice(0, 2)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-xl sm:text-2xl font-black select-none">=</div>

            {/* 3. TARGET COLUMN VECTOR A_final: n × 1 grid */}
            <MatrixBracket label={<MathText text="A_final" />} dimText={`${n}×1`}>
              <div className="flex flex-col gap-1">
                {elements.map((el, i) => {
                  const isTargetRow = i === elIdx;
                  const isCompletedRow = i < elIdx;
                  const displayValue = isCompletedRow
                    ? (A_final[i] ?? 0).toFixed(decimalPrecision)
                    : isTargetRow
                    ? runningSumForActiveEl.toFixed(decimalPrecision)
                    : '—';
                  return (
                    <div
                      key={i}
                      onClick={() => setCurrentStep(i * m)}
                      title={`A_final[${el}]: ${displayValue}`}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                        isTargetRow
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-400 shadow-md scale-110 font-bold z-10 animate-pulse'
                          : isCompletedRow
                          ? 'bg-emerald-500 text-white border-emerald-300 dark:border-emerald-700 font-semibold'
                          : 'bg-gray-100 dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-700 text-gray-400'
                      }`}
                    >
                      {el[0]}
                    </div>
                  );
                })}
              </div>
            </MatrixBracket>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE STEP DETAILED CALCULATION BREAKDOWN */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
        {/* Active Element & Active Cell Pair Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <OrbBadge
              name={activeElement}
              image={elementImages[elIdx]}
              size="md"
              color={activeRank === 1 ? 'amber' : 'emerald'}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('player.calculatingFor')}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  {activeElement} ({t('player.rowLabel', { row: elIdx + 1 })})
                </span>
                {activeRank > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      activeRank === 1
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {t('player.rankingBadge', { rank: activeRank })}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-mono font-bold">
                  {t('player.currentPair')} V[{elIdx + 1}, {dimIdx + 1}] × RWA[{elIdx + 1}, {dimIdx + 1}]
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                <MathText text={`A_{final,${elIdx + 1}} = Σ (V_{${elIdx + 1},j} · RWA_{${elIdx + 1},j})`} />
              </p>
            </div>
          </div>

          {/* Running Sum & Target Value Badges */}
          <div className="flex items-center gap-3 sm:self-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('player.accumulatedPartial')}
              </span>
              <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 rounded-xl shadow-2xs tabular-nums">
                {runningSumForActiveEl.toFixed(decimalPrecision)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('player.totalFinal')}
              </span>
              <span className="font-mono text-base font-bold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-0.5 rounded-xl shadow-2xs tabular-nums">
                {finalElementVal.toFixed(decimalPrecision)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms Breakdown Grid: Term-by-term progressive visibility */}
        <div>
          <div className="flex items-center justify-between mb-2.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold uppercase tracking-wider">
              {t('player.dotProductTermsDim')}
            </span>
            <span className="font-mono text-[11px]">
              V[{elIdx + 1}, j] × RWA[{elIdx + 1}, j]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {terms.map(term => (
              <div
                key={term.dimIdx}
                onClick={() => setCurrentStep(elIdx * m + term.dimIdx)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  term.isCurrentActive
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/60 shadow-xs scale-102'
                    : term.isEvaluated
                    ? 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50/40 dark:bg-gray-900/40 border-dashed border-gray-200 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <OrbBadge
                    name={term.dimName}
                    image={term.dimImage}
                    size="xs"
                    isDimension={true}
                    color={term.isCurrentActive ? 'amber' : 'indigo'}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                      {term.dimName}
                    </div>
                    <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      <span className={`font-semibold ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-blue-600 dark:text-blue-400'}`}>
                        {term.vVal.toFixed(decimalPrecision)}
                      </span>
                      <span className="text-gray-400 mx-1">×</span>
                      <span className={`font-semibold ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {term.wVal.toFixed(decimalPrecision)}
                      </span>
                      {term.isCurrentActive && (
                        <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold uppercase tracking-tighter">
                          {t('player.multiplying')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs tabular-nums shrink-0 ml-2">
                  <span className="text-gray-400">=</span>
                  {term.isEvaluated ? (
                    <span className={`font-bold ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-gray-100'}`}>
                      {term.prod.toFixed(decimalPrecision)}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">{t('player.pendingDots')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summation Equation Representation with Real-time Progress */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 overflow-x-auto no-scrollbar font-mono">
            <span className="font-bold text-gray-900 dark:text-gray-100"><MathText text={`A_{final,${elIdx + 1}}`} /> =</span>
            {terms.map((term, idx) => (
              <span key={idx} className="whitespace-nowrap">
                {idx > 0 && <span className="text-gray-400 mx-1">+</span>}
                {term.isEvaluated ? (
                  <span className={term.isCurrentActive ? 'text-amber-600 dark:text-amber-300 font-bold underline' : ''}>
                    {term.prod.toFixed(decimalPrecision)}
                  </span>
                ) : (
                  <span className="text-gray-400">?</span>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-sm shrink-0 text-emerald-700 dark:text-emerald-300 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-3">
            <span className="text-gray-400">=</span>
            <span>{runningSumForActiveEl.toFixed(decimalPrecision)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

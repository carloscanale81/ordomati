import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { OrbBadge } from './OrbBadge';
import { MathText } from './Formula';
import { useI18n } from '../i18n/I18nContext';

export interface MatrixCalculationPlayerProps {
  elements: string[];
  elementImages?: string[];
  sourceVectorName: string; // e.g. "V^P" or "V^C"
  sourceVector: number[];
  matrixName: string; // e.g. "A^C", "(A^C)⁻¹" or "(A^C)⁺"
  matrix: number[][];
  targetVectorName: string; // e.g. "V^C" or "V^P"
  targetVector: number[];
  decimalPrecision?: number;
  themeColor?: 'emerald' | 'blue' | 'indigo';
  isQuasiInverse?: boolean;
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

export const MatrixCalculationPlayer: React.FC<MatrixCalculationPlayerProps> = ({
  elements,
  elementImages = [],
  sourceVectorName,
  sourceVector,
  matrixName,
  matrix,
  targetVectorName,
  targetVector,
  decimalPrecision = 4,
  themeColor = 'emerald',
  isQuasiInverse = false
}) => {
  const { t } = useI18n();
  const n = elements.length;
  const totalSubSteps = Math.max(1, n * n);

  // currentStep ranges from 0 to n * n - 1
  // colIdx (target element column j) = Math.floor(currentStep / n)
  // rowIdx (source element cell row i) = currentStep % n
  const [currentStep, setCurrentStep] = useState<number>(0);

  const colIdx = Math.min(n - 1, Math.floor(currentStep / n));
  const rowIdx = currentStep % n;

  const activeElement = elements[colIdx] || `E${colIdx + 1}`;
  const currentSourceElement = elements[rowIdx] || `E${rowIdx + 1}`;
  const currentSVal = sourceVector[rowIdx] ?? 0;
  const currentMVal = matrix[rowIdx]?.[colIdx] ?? 0;
  const currentProd = currentSVal * currentMVal;

  // Compute running accumulated sum for column colIdx up to rowIdx
  let runningSumForActiveCol = 0;
  for (let k = 0; k <= rowIdx; k++) {
    runningSumForActiveCol += (sourceVector[k] ?? 0) * (matrix[k]?.[colIdx] ?? 0);
  }

  // Terms breakdown for the active column
  const terms = elements.map((el, i) => {
    const sVal = sourceVector[i] ?? 0;
    const mVal = matrix[i]?.[colIdx] ?? 0;
    const prod = sVal * mVal;
    const isSelf = i === colIdx;
    const isEvaluated = i <= rowIdx;
    const isCurrentActive = i === rowIdx;
    return {
      sourceIdx: i,
      sourceName: el,
      sVal,
      mVal,
      prod,
      isSelf,
      isEvaluated,
      isCurrentActive
    };
  });

  // Theme styling helpers
  const themeClasses = {
    emerald: {
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      accentBorder: 'border-emerald-200 dark:border-emerald-800',
      accentText: 'text-emerald-700 dark:text-emerald-300',
      ringColor: 'ring-emerald-500/50 border-emerald-500',
      highlightCol: 'bg-emerald-100/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100',
      highlightCell: 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 text-amber-950 dark:text-amber-50',
      sliderAccent: 'accent-emerald-600',
      accentBgFilled: 'bg-emerald-500 text-white',
      accentBgActive: 'bg-emerald-600 text-white'
    },
    blue: {
      accentBg: 'bg-blue-50 dark:bg-blue-950/40',
      accentBorder: 'border-blue-200 dark:border-blue-800',
      accentText: 'text-blue-700 dark:text-blue-300',
      ringColor: 'ring-blue-500/50 border-blue-500',
      highlightCol: 'bg-blue-100/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
      highlightCell: 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 text-amber-950 dark:text-amber-50',
      sliderAccent: 'accent-blue-600',
      accentBgFilled: 'bg-blue-500 text-white',
      accentBgActive: 'bg-blue-600 text-white'
    },
    indigo: {
      accentBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      accentBorder: 'border-indigo-200 dark:border-indigo-800',
      accentText: 'text-indigo-700 dark:text-indigo-300',
      ringColor: 'ring-indigo-500/50 border-indigo-500',
      highlightCol: 'bg-indigo-100/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100',
      highlightCell: 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 text-amber-950 dark:text-amber-50',
      sliderAccent: 'accent-indigo-600',
      accentBgFilled: 'bg-indigo-500 text-white',
      accentBgActive: 'bg-indigo-600 text-white'
    }
  }[themeColor];

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* QUASI-INVERSE WARNING BANNER (When matrix is singular / ill-conditioned) */}
      {isQuasiInverse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl flex items-start gap-3.5 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
              <span>{t('player.quasiInverseTitle')}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                <MathText text="(A^C)⁺" />
              </span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              <MathText text={t('player.quasiInverseDesc')} />
            </p>
          </div>
        </div>
      )}

      {/* UNIFIED CARD: COMPACT MATRIX PRODUCT RECREATION WITH HEADER SLIDER */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        {/* Card Header: Formula on left + Segmented Slider Line on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="font-mono text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
              <span><MathText text={targetVectorName} /></span>
              <span className="text-gray-400">=</span>
              <span className="text-blue-600 dark:text-blue-400"><MathText text={sourceVectorName} /></span>
              <span className="text-gray-400">·</span>
              <span className="text-indigo-600 dark:text-indigo-400"><MathText text={matrixName} /></span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">
              (<MathText text={`${targetVectorName}_j = Σ ${sourceVectorName}_i · ${matrixName}_{ij}`} />)
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
                      idx < currentStep
                        ? themeClasses.accentBgFilled
                        : idx === currentStep
                        ? `${themeClasses.accentBgActive} ring-1 ring-white/70 shadow-2xs`
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
                value={currentStep}
                onChange={(e) => setCurrentStep(Number(e.target.value))}
                aria-label={t('player.ariaMatrixProgress')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Compact Grid Representation: [ Vector ] · [ Matrix ] = [ Vector ] */}
        <div className="flex flex-col items-center justify-center py-2">
          {/* Status Subtitle Pill */}
          <div className="flex items-center gap-2 mb-4 font-mono text-xs flex-wrap justify-center">
            <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs ${themeClasses.accentBg} ${themeClasses.accentText} border ${themeClasses.accentBorder} font-bold`}>
              [{currentSourceElement}, {activeElement}]
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.termOf', { current: rowIdx + 1, total: n })}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.accumulated')} <strong className="text-gray-900 dark:text-gray-100">{runningSumForActiveCol.toFixed(decimalPrecision)}</strong>
            </span>
          </div>

          {/* Compact Grids Equation */}
          <div className="inline-flex items-center gap-3 sm:gap-6 justify-center max-w-full overflow-x-auto p-2 no-scrollbar">
            {/* 1. SOURCE ROW VECTOR: 1 × n grid */}
            <MatrixBracket label={<MathText text={sourceVectorName} />} dimText={`1×${n}`}>
              <div className="flex items-center gap-1">
                {elements.map((el, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentStep(colIdx * n + i)}
                    title={`${sourceVectorName}[${el}] = ${(sourceVector[i] ?? 0).toFixed(decimalPrecision)}`}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                      i === rowIdx
                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 shadow-sm scale-110 font-bold z-10'
                        : i < rowIdx
                        ? 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {el[0]}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-2xl font-black select-none">·</div>

            {/* 2. MATRIX: n × n grid of squares without numbers */}
            <MatrixBracket label={<MathText text={matrixName} />} dimText={`${n}×${n}`}>
              <div className="flex flex-col gap-1">
                {matrix.map((row, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {row.map((val, j) => {
                      const isColActive = j === colIdx;
                      const isCellActive = isColActive && i === rowIdx;
                      const isEvaluatedInCol = isColActive && i < rowIdx;
                      return (
                        <div
                          key={j}
                          onClick={() => setCurrentStep(j * n + i)}
                          title={`${matrixName}[${elements[i]}, ${elements[j]}] = ${(val ?? 0).toFixed(decimalPrecision)}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer select-none ${
                            isCellActive
                              ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 shadow-md scale-115 z-20 animate-pulse'
                              : isEvaluatedInCol
                              ? `${themeClasses.highlightCol} ring-1 ${themeClasses.ringColor}`
                              : isColActive
                              ? 'bg-indigo-100/70 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800'
                              : 'bg-gray-100/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-750 hover:border-gray-400'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-2xl font-black select-none">=</div>

            {/* 3. TARGET ROW VECTOR: 1 × n grid */}
            <MatrixBracket label={<MathText text={targetVectorName} />} dimText={`1×${n}`}>
              <div className="flex items-center gap-1">
                {elements.map((el, j) => {
                  const isTargetCol = j === colIdx;
                  const isCompletedCol = j < colIdx;
                  const displayValue = isCompletedCol
                    ? (targetVector[j] ?? 0).toFixed(decimalPrecision)
                    : isTargetCol
                    ? runningSumForActiveCol.toFixed(decimalPrecision)
                    : '—';
                  return (
                    <div
                      key={j}
                      onClick={() => setCurrentStep(j * n)}
                      title={`${targetVectorName}[${el}]: ${displayValue}`}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                        isTargetCol
                          ? `${themeClasses.accentBgActive} ring-2 ring-emerald-300 dark:ring-emerald-400 shadow-md scale-110 font-bold z-10 animate-pulse`
                          : isCompletedCol
                          ? `${themeClasses.accentBgFilled} border-emerald-300 dark:border-emerald-700 font-semibold`
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

      {/* 4. ACTIVE STEP DETAILED CALCULATION BREAKDOWN */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
        {/* Active Element & Active Cell Pair Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <OrbBadge
              name={activeElement}
              image={elementImages[colIdx]}
              size="md"
              color={themeColor}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('player.calculatingFor')}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  {activeElement} ({t('player.columnLabel', { col: colIdx + 1 })})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-mono font-bold">
                  {t('player.currentPair')} {currentSourceElement} × M[{rowIdx + 1}, {colIdx + 1}]
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                <MathText text={`${targetVectorName}_{${colIdx + 1}} = Σ (${sourceVectorName}_i · ${matrixName}_{i,${colIdx + 1}})`} />
              </p>
            </div>
          </div>

          {/* Running Sum & Target Value Badges */}
          <div className="flex items-center gap-3 sm:self-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('player.accumulatedPartial')}
              </span>
              <span className={`font-mono text-base font-bold ${themeClasses.accentText} ${themeClasses.accentBg} border ${themeClasses.accentBorder} px-3 py-0.5 rounded-xl shadow-2xs tabular-nums`}>
                {runningSumForActiveCol.toFixed(decimalPrecision)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('player.totalFinal')}
              </span>
              <span className="font-mono text-base font-bold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-0.5 rounded-xl shadow-2xs tabular-nums">
                {(targetVector[colIdx] ?? 0).toFixed(decimalPrecision)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms Breakdown Grid: Term-by-term progressive visibility */}
        <div>
          <div className="flex items-center justify-between mb-2.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold uppercase tracking-wider">
              {t('player.dotProductTerms')}
            </span>
            <span className="font-mono text-[11px]">
              <MathText text={sourceVectorName} />[i] × <MathText text={matrixName} />[i, {colIdx + 1}]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {terms.map(term => (
              <div
                key={term.sourceIdx}
                onClick={() => {
                  setCurrentStep(colIdx * n + term.sourceIdx);
                }}
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
                    name={term.sourceName}
                    image={elementImages[term.sourceIdx]}
                    size="xs"
                    color={term.isCurrentActive ? 'amber' : term.isSelf ? 'blue' : 'indigo'}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      <span className={`font-semibold ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-blue-600 dark:text-blue-400'}`}>
                        {term.sVal.toFixed(decimalPrecision)}
                      </span>
                      <span className="text-gray-400 mx-1">×</span>
                      <span className={`font-semibold ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {term.mVal.toFixed(decimalPrecision)}
                      </span>
                    </span>
                    {term.isSelf && (
                      <span className="text-[10px] ml-1.5 px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                        {t('player.self')}
                      </span>
                    )}
                    {term.isCurrentActive && (
                      <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold uppercase tracking-tighter">
                        {t('player.multiplying')}
                      </span>
                    )}
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
            <span className="font-bold text-gray-900 dark:text-gray-100"><MathText text={`${targetVectorName}_{${colIdx + 1}}`} /> =</span>
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
          <div className={`flex items-center gap-1 font-mono font-bold text-sm shrink-0 ${themeClasses.accentText} sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-3`}>
            <span className="text-gray-400">=</span>
            <span>{runningSumForActiveCol.toFixed(decimalPrecision)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

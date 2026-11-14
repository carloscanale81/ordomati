import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { OrbBadge } from './OrbBadge';
import { MathText } from './Formula';
import { useI18n } from '../i18n/I18nContext';

export interface MatrixCellCalculationPlayerProps {
  elements: string[];
  elementImages?: string[];
  sampleVP: number[][];
  sampleVC: number[][];
  invSampleVP: number[][];
  AC: number[][];
  decimalPrecision?: number;
  themeColor?: 'indigo' | 'emerald' | 'blue';
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

export const MatrixCellCalculationPlayer: React.FC<MatrixCellCalculationPlayerProps> = ({
  elements,
  elementImages = [],
  sampleVP,
  sampleVC,
  invSampleVP,
  AC,
  decimalPrecision = 4,
  themeColor = 'indigo',
  isQuasiInverse = false
}) => {
  const { t } = useI18n();
  const n = elements.length;
  const totalSubSteps = Math.max(1, n * n * n);

  // currentStep ranges from 0 to n * n * n - 1
  const [currentStep, setCurrentStep] = useState<number>(0);

  const cellIdx = Math.min(n * n - 1, Math.floor(currentStep / n));
  const rowIdx = Math.floor(cellIdx / n); // Row i in M_VC and A^C
  const colIdx = cellIdx % n;            // Col j in invSampleVP and A^C
  const termIdx = currentStep % n;        // Term k in dot product

  const rowElement = elements[rowIdx] || `E${rowIdx + 1}`;
  const colElement = elements[colIdx] || `E${colIdx + 1}`;
  const sampleLabel = `M${termIdx + 1}`;

  const currentVcVal = sampleVC[rowIdx]?.[termIdx] ?? 0;
  const currentInvVpVal = invSampleVP[termIdx]?.[colIdx] ?? 0;
  const currentProduct = currentVcVal * currentInvVpVal;

  // Running sum for cell (rowIdx, colIdx) up to termIdx
  let runningSumForActiveCell = 0;
  for (let k = 0; k <= termIdx; k++) {
    runningSumForActiveCell += (sampleVC[rowIdx]?.[k] ?? 0) * (invSampleVP[k]?.[colIdx] ?? 0);
  }

  // Terms breakdown for the active cell (rowIdx, colIdx)
  const terms = Array.from({ length: n }, (_, k) => {
    const vcVal = sampleVC[rowIdx]?.[k] ?? 0;
    const invVal = invSampleVP[k]?.[colIdx] ?? 0;
    const prod = vcVal * invVal;
    const isEvaluated = k <= termIdx;
    const isCurrentActive = k === termIdx;
    return {
      termIndex: k,
      sampleName: `M${k + 1}`,
      vcVal,
      invVal,
      prod,
      isEvaluated,
      isCurrentActive
    };
  });

  // Theme styling helpers
  const themeClasses = {
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
    },
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
    }
  }[themeColor];

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* QUASI-INVERSE WARNING BANNER (When sampling matrix M_VP is singular / ill-conditioned) */}
      {isQuasiInverse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl flex items-start gap-3.5 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
              <span>{t('player.samplingQuasiTitle')}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                <MathText text="(M_VP)⁺" />
              </span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              <MathText text={t('player.samplingQuasiDesc')} />
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
              <span className="text-indigo-600 dark:text-indigo-400 font-black"><MathText text="A^C" /></span>
              <span className="text-gray-400">=</span>
              <span className="text-blue-600 dark:text-blue-400"><MathText text="M_VC" /></span>
              <span className="text-gray-400">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                <MathText text={isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'} />
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">
              (<MathText text={`A^C_{ij} = Σ M_{VC,ik} · ${isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'}_{kj}`} />)
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
                aria-label={t('player.ariaAcProgress')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Compact Grid Representation: [ M_VC ] · [ (M_VP)^-1 ] = [ A^C ] */}
        <div className="flex flex-col items-center justify-center py-2">
          {/* Status Subtitle Pill */}
          <div className="flex items-center gap-2 mb-4 font-mono text-xs flex-wrap justify-center">
            <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs ${themeClasses.accentBg} ${themeClasses.accentText} border ${themeClasses.accentBorder} font-bold`}>
              {t('player.cellPrefix')} <MathText text="A^C" />[{rowElement}, {colElement}]
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.termOfSample', { current: termIdx + 1, total: n, sample: sampleLabel })}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('player.accumulated')} <strong className="text-gray-900 dark:text-gray-100">{runningSumForActiveCell.toFixed(decimalPrecision)}</strong>
            </span>
          </div>

          {/* Compact Grids Equation */}
          <div className="inline-flex items-center gap-3 sm:gap-6 justify-center max-w-full overflow-x-auto p-2 no-scrollbar">
            {/* 1. M_VC MATRIX: n × n grid */}
            <MatrixBracket label={<MathText text="M_VC" />} dimText={`${n}×${n}`}>
              <div className="flex flex-col gap-1">
                {sampleVC.map((row, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {row.map((val, k) => {
                      const isRowActive = i === rowIdx;
                      const isCellActive = isRowActive && k === termIdx;
                      return (
                        <div
                          key={k}
                          onClick={() => setCurrentStep((rowIdx * n + colIdx) * n + k)}
                          title={`M_VC[${elements[i]}, M${k + 1}] = ${(val ?? 0).toFixed(decimalPrecision)}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                            isCellActive
                              ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 shadow-md scale-115 z-20 animate-pulse font-bold text-amber-950 dark:text-amber-50'
                              : isRowActive
                              ? 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                              : 'bg-gray-100/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'
                          }`}
                        >
                          {elements[i][0]}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-2xl font-black select-none">·</div>

            {/* 2. (M_VP)^-1 INVERSE MATRIX: n × n grid */}
            <MatrixBracket label={<MathText text={isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'} />} dimText={`${n}×${n}`}>
              <div className="flex flex-col gap-1">
                {invSampleVP.map((row, k) => (
                  <div key={k} className="flex items-center gap-1">
                    {row.map((val, j) => {
                      const isColActive = j === colIdx;
                      const isCellActive = isColActive && k === termIdx;
                      return (
                        <div
                          key={j}
                          onClick={() => setCurrentStep((rowIdx * n + j) * n + termIdx)}
                          title={`(M_VP)⁻¹[M${k + 1}, ${elements[j]}] = ${(val ?? 0).toFixed(decimalPrecision)}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                            isCellActive
                              ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 ring-2 ring-amber-300 dark:ring-amber-400 shadow-md scale-115 z-20 animate-pulse font-bold text-amber-950 dark:text-amber-50'
                              : isColActive
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : 'bg-gray-100/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300'
                          }`}
                        >
                          {elements[j][0]}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>

            <div className="text-gray-400 dark:text-gray-500 text-2xl font-black select-none">=</div>

            {/* 3. RESULTING CONTEXTUAL AFFINITY MATRIX A^C: n × n grid */}
            <MatrixBracket label={<MathText text="A^C" />} dimText={`${n}×${n}`}>
              <div className="flex flex-col gap-1">
                {AC.map((row, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {row.map((val, j) => {
                      const cellNumber = i * n + j;
                      const isCurrentCell = i === rowIdx && j === colIdx;
                      const isCompletedCell = cellNumber < cellIdx;
                      const displayVal = isCompletedCell
                        ? (val ?? 0).toFixed(decimalPrecision)
                        : isCurrentCell
                        ? runningSumForActiveCell.toFixed(decimalPrecision)
                        : '—';

                      return (
                        <div
                          key={j}
                          onClick={() => setCurrentStep((i * n + j) * n + (n - 1))}
                          title={`A^C[${elements[i]}, ${elements[j]}]: ${displayVal}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono select-none ${
                            isCurrentCell
                              ? `${themeClasses.accentBgActive} ring-2 ring-indigo-300 dark:ring-indigo-400 shadow-md scale-110 font-bold z-10 animate-pulse`
                              : isCompletedCell
                              ? `${themeClasses.accentBgFilled} border-indigo-300 dark:border-indigo-700 font-semibold`
                              : 'bg-gray-100 dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          {elements[i][0]}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </MatrixBracket>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE STEP DETAILED CALCULATION BREAKDOWN */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
        {/* Active Elements Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <OrbBadge
                name={rowElement}
                image={elementImages[rowIdx]}
                size="md"
                color="blue"
              />
              <OrbBadge
                name={colElement}
                image={elementImages[colIdx]}
                size="md"
                color="indigo"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('player.calculatingCell')}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  <MathText text="A^C" />[{rowElement}, {colElement}] ({t('player.rowColLabel', { row: rowIdx + 1, col: colIdx + 1 })})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-mono font-bold">
                  {t('player.currentPair')} <MathText text="M_VC" />[{rowElement}, {sampleLabel}] × <MathText text={isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'} />[{sampleLabel}, {colElement}]
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                <MathText text={`A^C[${rowElement}, ${colElement}] = Σ (M_VC[${rowElement}, M_k] · ${isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'}[M_k, ${colElement}])`} />
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
                {runningSumForActiveCell.toFixed(decimalPrecision)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('player.totalCell')}
              </span>
              <span className="font-mono text-base font-bold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-0.5 rounded-xl shadow-2xs tabular-nums">
                {(AC[rowIdx]?.[colIdx] ?? 0).toFixed(decimalPrecision)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms Breakdown Grid: Term-by-term progressive visibility */}
        <div>
          <div className="flex items-center justify-between mb-2.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {t('player.multTerms', { n })}
            </span>
            <span className="font-mono text-[11px]">
              {t('player.activeTerm', { current: termIdx + 1, total: n })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {terms.map((term) => {
              return (
                <div
                  key={term.termIndex}
                  onClick={() => setCurrentStep((rowIdx * n + colIdx) * n + term.termIndex)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    term.isCurrentActive
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/50 shadow-sm'
                      : term.isEvaluated
                      ? 'bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/80'
                      : 'bg-gray-50/30 dark:bg-gray-900/40 border-dashed border-gray-200 dark:border-gray-800 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold font-mono text-gray-700 dark:text-gray-300">
                      {t('player.sampleItem', { name: term.sampleName })}
                    </span>
                    {term.isCurrentActive ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-sans">
                        {t('player.statusComputing')}
                      </span>
                    ) : term.isEvaluated ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-sans">
                        {t('player.statusAdded')}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 font-sans">
                        {t('player.statusPending')}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                      <span><MathText text="M_VC" />:</span>
                      <span className="tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                        {term.isEvaluated ? term.vcVal.toFixed(decimalPrecision) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                      <span><MathText text={isQuasiInverse ? '(M_VP)⁺' : '(M_VP)⁻¹'} />:</span>
                      <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {term.isEvaluated ? term.invVal.toFixed(decimalPrecision) : '—'}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between font-bold">
                      <span className="text-gray-600 dark:text-gray-300">{t('player.productLabel')}</span>
                      <span className={`tabular-nums ${term.isCurrentActive ? 'text-amber-700 dark:text-amber-300 text-sm' : 'text-gray-900 dark:text-gray-100'}`}>
                        {term.isEvaluated ? term.prod.toFixed(decimalPrecision) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

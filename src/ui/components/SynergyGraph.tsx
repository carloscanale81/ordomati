import React, { useId } from 'react';
import { SynergyConfig } from '../../logic/types';
import { evaluateCustomSynergy } from '../../logic/affinity';

export interface SynergyGraphProps {
  syn: SynergyConfig;
  className?: string;
}

export const SynergyGraph: React.FC<SynergyGraphProps> = ({ syn, className = '' }) => {
  const rawId = useId();
  const gradId = `synAreaGrad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const k = syn.k ?? 1;

  // Compute points across domain a^A in [0, 1]
  const numSamples = 50;
  const points: Array<{ aA: number; aC: number }> = [];
  let computedMax = 1.0;

  for (let idx = 0; idx <= numSamples; idx++) {
    const aA = idx / numSamples;
    let aC = aA;

    if (syn.type === 'factor') {
      aC = aA * k;
    } else if (syn.type === 'custom') {
      aC = evaluateCustomSynergy(aA, k, syn.customExpr || 'min(1, a * 1.5)');
    }

    if (aC > computedMax) computedMax = aC;
    points.push({ aA, aC });
  }

  // Y-axis max scale
  const yMax = Math.max(1.0, Math.min(Math.ceil(computedMax * 1.15 * 10) / 10, 3.0));

  // Pure minimalist layout (viewBox 0 0 240 70)
  const padL = 10;
  const padR = 8;
  const padT = 8;
  const padB = 8;
  const W = 240 - padL - padR;
  const H = 70 - padT - padB;

  const toX = (aA: number) => padL + aA * W;
  const toY = (aC: number) => padT + (1 - Math.min(yMax, aC) / yMax) * H;

  // Curve path
  const pathD = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(pt.aA).toFixed(1)} ${toY(pt.aC).toFixed(1)}`)
    .join(' ');

  // Area path
  const areaD = `${pathD} L ${toX(1).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`;

  return (
    <div className={`w-full bg-gray-50/70 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 p-2 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 240 70" className="w-full h-auto select-none overflow-hidden">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Axes: Only vertical and horizontal axes as requested */}
        <line x1={padL} y1={toY(0)} x2={padL + W} y2={toY(0)} stroke="#94a3b8" strokeWidth="1.2" className="dark:stroke-gray-600" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + H} stroke="#94a3b8" strokeWidth="1.2" className="dark:stroke-gray-600" />

        {/* Synergy Curve Area & Stroke Line */}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

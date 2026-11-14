import React, { useId } from 'react';
import { PropagationConfig } from '../../logic/types';
import { evaluateCustomPropagation } from '../../logic/affinity';

export interface PropagationGraphProps {
  prop: PropagationConfig;
  className?: string;
}

export const PropagationGraph: React.FC<PropagationGraphProps> = ({ prop, className = '' }) => {
  const rawId = useId();
  const gradId = `propAreaGrad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const l1 = prop.l1 || 0;
  const l2 = prop.limit || 10;

  // Determine domain d in [0, dMax]
  const dMax = prop.type === 'custom' ? 10 : Math.max(l2 * 1.35, l1 * 1.35, 10);

  // Compute points
  const numSamples = 60;
  const points: Array<{ d: number; a: number }> = [];

  for (let k = 0; k <= numSamples; k++) {
    const d = (k / numSamples) * dMax;
    let a = 0;

    if (d === 0) {
      a = 1;
    } else {
      switch (prop.type) {
        case 'triangular':
          a = d <= l2 ? (l2 - d) / l2 : 0;
          break;
        case 'rectangular':
          a = d <= l2 ? 1 : 0;
          break;
        case 'trapezoidal':
          a = d <= l1 ? 1 : d <= l2 ? (l2 - d) / (l2 - l1) : 0;
          break;
        case 'sinusoidal':
          a = d <= l2 ? 0.5 * (1 + Math.cos(Math.PI * (d / l2))) : 0;
          break;
        case 'inhibited':
          a = 0;
          break;
        case 'custom':
          a = evaluateCustomPropagation(d, l2, l1, prop.customExpr || 'exp(-d / 2)');
          break;
        default:
          a = 0;
      }
    }
    points.push({ d, a: Math.max(0, Math.min(1, a)) });
  }

  // Pure minimalist layout (viewBox 0 0 240 70)
  const padL = 10;
  const padR = 8;
  const padT = 8;
  const padB = 8;
  const W = 240 - padL - padR;
  const H = 70 - padT - padB;

  const toX = (d: number) => padL + (d / dMax) * W;
  const toY = (a: number) => padT + (1 - a) * H;

  // Path data for the curve
  const pathD = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(pt.d).toFixed(1)} ${toY(pt.a).toFixed(1)}`)
    .join(' ');

  // Area path closing on x-axis
  const areaD = `${pathD} L ${toX(dMax).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`;

  return (
    <div className={`w-full bg-gray-50/70 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 p-2 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 240 70" className="w-full h-auto select-none overflow-hidden">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Axes: Only vertical and horizontal axes as requested */}
        <line x1={padL} y1={toY(0)} x2={padL + W} y2={toY(0)} stroke="#94a3b8" strokeWidth="1.2" className="dark:stroke-gray-600" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + H} stroke="#94a3b8" strokeWidth="1.2" className="dark:stroke-gray-600" />

        {/* Function Curve Area & Stroke Line */}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

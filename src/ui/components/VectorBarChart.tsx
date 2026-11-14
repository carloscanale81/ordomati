import React from 'react';
import { OrbBadge } from './OrbBadge';

export interface VectorBarChartProps {
  elements: string[];
  elementImages?: string[];
  values: number[];
  color?: 'blue' | 'indigo' | 'emerald';
  maxVal?: number;
  className?: string;
  decimalPrecision?: number;
}

export const VectorBarChart: React.FC<VectorBarChartProps> = ({
  elements,
  elementImages = [],
  values,
  color = 'blue',
  maxVal,
  className = '',
  decimalPrecision = 4
}) => {
  const computedMax = maxVal ?? Math.max(1, ...values.map(v => (Number.isFinite(v) ? v : 0)));

  const barColorClass =
    color === 'emerald'
      ? 'bg-emerald-600'
      : color === 'indigo'
      ? 'bg-indigo-600'
      : 'bg-blue-600';

  const barBgClass =
    color === 'emerald'
      ? 'bg-emerald-50/70 border-emerald-100'
      : color === 'indigo'
      ? 'bg-indigo-50/70 border-indigo-100'
      : 'bg-blue-50/70 border-blue-100';

  return (
    <div className={`w-full p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/60 flex flex-col gap-3 ${className}`}>
      {/* Bars List */}
      <div className="space-y-3">
        {elements.map((el, i) => {
          const val = values[i] ?? 0;
          const ratio = computedMax > 0 ? Math.min(100, Math.max(0, (val / computedMax) * 100)) : 0;

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Element Ball Avatar (Hover shows name) */}
              <div className="flex items-center shrink-0">
                <OrbBadge
                  name={el}
                  image={elementImages[i]}
                  size="xs"
                  color={color}
                />
              </div>

              {/* Bar Track & Fill */}
              <div className={`flex-1 h-6 ${barBgClass} dark:bg-gray-800 dark:border-gray-700 rounded-lg border overflow-hidden relative shadow-2xs`}>
                <div
                  className={`h-full ${barColorClass} rounded-md transition-all duration-500 ease-out`}
                  style={{ width: `${ratio}%` }}
                />
              </div>

              {/* Formatted Numeric Value (Normal Weight) */}
              <span className="font-mono text-sm font-normal text-gray-800 dark:text-gray-200 shrink-0 w-20 text-right tabular-nums">
                {Number.isFinite(val) ? val.toFixed(decimalPrecision) : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

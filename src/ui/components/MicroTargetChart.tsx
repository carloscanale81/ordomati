import React from 'react';

export interface MicroTargetChartProps {
  values: number[];
  hasData: boolean;
  isActive?: boolean;
  noDataTitle?: string;
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  responsive?: boolean;
  className?: string;
}

export const MicroTargetChart: React.FC<MicroTargetChartProps> = ({
  values,
  hasData,
  isActive = false,
  noDataTitle,
  min,
  max,
  width = 44,
  height = 18,
  responsive = false,
  className = ''
}) => {
  const W = responsive ? 100 : width;
  const H = height;

  if (!hasData || values.length === 0) {
    return (
      <div
        style={responsive ? { width: '100%', height: `${H}px` } : { width: `${width}px`, height: `${H}px` }}
        className={`shrink-0 rounded-[3px] bg-gray-100/80 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-700 relative overflow-hidden flex items-center justify-center select-none ${className}`}
        title={noDataTitle}
      >
        <svg
          width={responsive ? '100%' : W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 opacity-20 pointer-events-none"
        >
          {/* Faint dummy vertical bar silhouette */}
          <rect x="0" y={H * 0.5} width={W * 0.25} height={H * 0.5} className="fill-gray-400 dark:fill-gray-500" />
          <rect x={W * 0.25} y={H * 0.25} width={W * 0.25} height={H * 0.75} className="fill-gray-400 dark:fill-gray-500" />
          <rect x={W * 0.5} y={H * 0.65} width={W * 0.25} height={H * 0.35} className="fill-gray-400 dark:fill-gray-500" />
          <rect x={W * 0.75} y={H * 0.35} width={W * 0.25} height={H * 0.65} className="fill-gray-400 dark:fill-gray-500" />
        </svg>
        <span className="font-extrabold text-[10px] text-gray-400 dark:text-gray-500 z-10">
          ?
        </span>
      </div>
    );
  }

  const n = values.length;
  const barW = W / n;

  // Scale using dimension min and max if available and valid
  const hasMinMax = typeof min === 'number' && typeof max === 'number' && max > min;
  const range = hasMinMax ? max - min : 0;
  const maxVal = Math.max(...values, 0.001);

  return (
    <svg
      width={responsive ? '100%' : W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={responsive ? { width: '100%', height: `${H}px` } : undefined}
      className={`shrink-0 overflow-hidden rounded-[3px] bg-gray-100/60 dark:bg-gray-900/60 ${className}`}
    >
      {values.map((v, i) => {
        const val = typeof v === 'number' && !isNaN(v) ? v : 0;
        const normalized = hasMinMax
          ? Math.max(0, Math.min(1, (val - min!) / range))
          : Math.max(0, Math.min(1, val / maxVal));

        const barH = Math.max(2, Math.round(normalized * H));
        const x = i * barW;
        const y = H - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            className={`transition-colors duration-200 ${
              isActive
                ? 'fill-blue-500 dark:fill-blue-400'
                : 'fill-gray-400 dark:fill-gray-500 group-hover:fill-blue-400 dark:group-hover:fill-blue-300'
            }`}
          />
        );
      })}
    </svg>
  );
};

import React from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface MatrixGraphProps {
  elements: string[];
  elementImages?: string[];
  matrix: (number | null | undefined)[][];
  theme?: 'blue' | 'indigo' | 'emerald';
  minThreshold?: number;
  className?: string;
  isDimension?: boolean;
  decimalPrecision?: number;
}

export const MatrixGraph: React.FC<MatrixGraphProps> = ({
  elements,
  elementImages = [],
  matrix,
  theme = 'blue',
  minThreshold = 0.001,
  className = '',
  isDimension = false,
  decimalPrecision = 4
}) => {
  const { t } = useI18n();
  const n = elements.length;
  const cx = 160;
  const cy = 160;
  const r = 100;

  // Calculate maximum value for relative edge scaling
  let maxVal = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && typeof v === 'number' && Number.isFinite(v) && v > maxVal) {
        maxVal = v;
      }
    });
  });
  if (maxVal === 0) maxVal = 1;

  // Compute node positions on the circle
  const nodes = elements.map((el, i) => {
    const theta = (2 * Math.PI * i) / (n || 1) - Math.PI / 2;
    return {
      id: i,
      label: el,
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta)
    };
  });

  // Extract edges
  interface Edge {
    source: (typeof nodes)[0];
    target: (typeof nodes)[0];
    val: number;
    ratio: number;
  }
  const edges: Edge[] = [];

  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j && typeof val === 'number' && Number.isFinite(val) && val > minThreshold) {
        edges.push({
          source: nodes[i],
          target: nodes[j],
          val,
          ratio: Math.min(1, Math.max(0, val / maxVal))
        });
      }
    });
  });

  const markerId = `graph-arrow-${theme}`;
  const strokeColor =
    theme === 'indigo'
      ? '#4f46e5'
      : theme === 'emerald'
      ? '#059669'
      : '#2563eb';

  return (
    <div className={`w-full aspect-square max-w-[300px] mx-auto bg-gray-50/70 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-2 relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xs select-none">
        <defs>
          <marker
            id={markerId}
            markerWidth="6"
            markerHeight="5"
            refX="5"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 6 2.5, 0 5" fill={strokeColor} />
          </marker>

          {/* Soft Curvature Shading Overlay (No Glare/Brillo - Only Soft Curvature Depth) */}
          <radialGradient id={`sphere-curvature-overlay-${theme}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="82%" stopColor="#000000" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
          </radialGradient>

          {/* Soft Base Radial Gradient for Name Fallback (White for dimensions, Color for elements) */}
          {isDimension ? (
            <radialGradient id={`sphere-ball-base-${theme}`} cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="68%" stopColor="#ffffff" />
              <stop offset="88%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
          ) : (
            <radialGradient id={`sphere-ball-base-${theme}`} cx="48%" cy="44%" r="60%">
              <stop offset="0%" stopColor={theme === 'indigo' ? '#818cf8' : theme === 'emerald' ? '#34d399' : '#60a5fa'} />
              <stop offset="50%" stopColor={theme === 'indigo' ? '#6366f1' : theme === 'emerald' ? '#10b981' : '#3b82f6'} />
              <stop offset="85%" stopColor={theme === 'indigo' ? '#4338ca' : theme === 'emerald' ? '#059669' : '#1d4ed8'} />
              <stop offset="100%" stopColor={theme === 'indigo' ? '#312e81' : theme === 'emerald' ? '#064e3b' : '#1e3a8a'} />
            </radialGradient>
          )}

          {/* Rounded Square Clip Paths for Node Images */}
          {nodes.map(node => (
            <clipPath key={`clip-${node.id}`} id={`node-ball-clip-${node.id}`}>
              <rect
                x={node.x - 23.5}
                y={node.y - 23.5}
                width="47"
                height="47"
                rx="12"
                ry="12"
              />
            </clipPath>
          ))}
        </defs>

        {/* Directed Edges */}
        {edges.map((edge, idx) => {
          const dx = edge.target.x - edge.source.x;
          const dy = edge.target.y - edge.source.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return null;

          const ux = dx / len;
          const uy = dy / len;
          const nx = -uy;
          const ny = ux;

          const curveOffset = 24;
          const controlX = edge.source.x + dx / 2 + nx * curveOffset;
          const controlY = edge.source.y + dy / 2 + ny * curveOffset;

          const startDx = controlX - edge.source.x;
          const startDy = controlY - edge.source.y;
          const startLen = Math.sqrt(startDx * startDx + startDy * startDy);
          const startX = edge.source.x + (startDx / startLen) * 23.5;
          const startY = edge.source.y + (startDy / startLen) * 23.5;

          const endDx = controlX - edge.target.x;
          const endDy = controlY - edge.target.y;
          const endLen = Math.sqrt(endDx * endDx + endDy * endDy);
          const endX = edge.target.x + (endDx / endLen) * 26.5;
          const endY = edge.target.y + (endDy / endLen) * 26.5;

          const midX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
          const midY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;

          const displayVal = edge.val >= 10 ? edge.val.toFixed(1) : edge.val.toFixed(2);

          return (
            <g key={idx}>
              {/* Directed Arrow Path */}
              <path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1 + edge.ratio * 2.5}
                markerEnd={`url(#${markerId})`}
                opacity={0.35 + edge.ratio * 0.65}
                className="transition-all duration-300"
              >
                <title>{`${edge.source.label} → ${edge.target.label}: ${edge.val.toFixed(decimalPrecision)}`}</title>
              </path>

              {/* Edge Value Badge on the Arrow */}
              <g transform={`translate(${midX},${midY})`} className="pointer-events-none">
                <rect
                  x="-17"
                  y="-8.5"
                  width="34"
                  height="17"
                  rx="4"
                  strokeWidth="0.8"
                  className="fill-white dark:fill-gray-800 stroke-slate-300 dark:stroke-gray-600 shadow-2xs"
                />
                <text
                  x="0"
                  y="0"
                  dy="4"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="normal"
                  className="font-mono tabular-nums fill-slate-900 dark:fill-gray-100"
                >
                  {displayVal}
                </text>
              </g>
            </g>
          );
        })}

        {/* Nodes rendered as Rounded Squares (130% Size) */}
        {nodes.map(node => {
          const img = elementImages[node.id];
          const hasImage = typeof img === 'string' && img.trim().length > 0;

          return (
            <g key={node.id} className="cursor-default select-none">
              {hasImage ? (
                <>
                  {/* Clipped Node Image */}
                  <image
                    href={img}
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#node-ball-clip-${node.id})`}
                  />
                  {/* Rounded Square Outer Rim */}
                  <rect
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    rx="12"
                    ry="12"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    opacity="0.6"
                    className="pointer-events-none"
                  />
                </>
              ) : (
                <>
                  {/* Base Rounded Square with Name inside */}
                  <rect
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    rx="12"
                    ry="12"
                    fill={isDimension ? '#ffffff' : `url(#sphere-ball-base-${theme})`}
                    stroke={isDimension ? '#cbd5e1' : strokeColor}
                    strokeWidth="1.2"
                  />
                  {/* Centered Crisp Text */}
                  <text
                    x={node.x}
                    y={node.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={isDimension ? '#1e293b' : '#ffffff'}
                    className="font-sans pointer-events-none select-none tracking-tight"
                    style={{
                      filter: isDimension
                        ? 'none'
                        : 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))'
                    }}
                  >
                    {node.label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Empty State Label */}
      {edges.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">
            {t('graph.noFlows')}
          </span>
        </div>
      )}
    </div>
  );
};

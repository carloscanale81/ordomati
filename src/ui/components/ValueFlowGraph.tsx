import React from 'react';

export interface ValueFlowGraphProps {
  elements: string[];
  elementImages?: string[];
  AC: number[][];
  decimalPrecision?: number;
}

export const ValueFlowGraph: React.FC<ValueFlowGraphProps> = ({ elements, elementImages = [], AC, decimalPrecision = 4 }) => {
  const n = elements.length;
  const cx = 150,
    cy = 150,
    r = 100;

  const nodes = elements.map((el, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    return { id: i, label: el, x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  });

  const edges: Array<{ source: (typeof nodes)[0]; target: (typeof nodes)[0]; val: number }> = [];
  AC.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j && val > 0.01) {
        edges.push({ source: nodes[i], target: nodes[j], val });
      }
    });
  });

  return (
    <div className="w-full aspect-square max-w-sm mx-auto bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/60 p-4">
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm select-none">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#4f46e5" />
          </marker>

          {/* Soft Curvature Shading Overlay (No Glare/Brillo - Only Soft Curvature Depth) */}
          <radialGradient id="flow-sphere-overlay" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="82%" stopColor="#000000" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
          </radialGradient>

          {/* Soft Base Radial Gradient for Name Fallback */}
          <radialGradient id="flow-sphere-base" cx="48%" cy="44%" r="60%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="85%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#312e81" />
          </radialGradient>

          {/* Rounded Square Clip Paths for Node Images */}
          {nodes.map(node => (
            <clipPath key={`clip-${node.id}`} id={`flow-ball-clip-${node.id}`}>
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

        {edges.map((edge, idx) => {
          const dx = edge.target.x - edge.source.x;
          const dy = edge.target.y - edge.source.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return null;

          const ux = dx / len,
            uy = dy / len;
          const nx = -uy,
            ny = ux;

          const curveOffset = 25;
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
              <path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1 + edge.val * 3}
                markerEnd="url(#arrowhead)"
                opacity={0.35 + edge.val * 0.65}
                className="transition-all duration-300"
              >
                <title>{`${edge.source.label} → ${edge.target.label}: ${edge.val.toFixed(decimalPrecision)}`}</title>
              </path>

              {/* Edge Value Badge on the Arrow */}
              <g transform={`translate(${midX},${midY})`} className="pointer-events-none">
                <rect
                  x="-16"
                  y="-8"
                  width="32"
                  height="16"
                  rx="4"
                  strokeWidth="0.8"
                  className="fill-white dark:fill-gray-800 stroke-slate-300 dark:stroke-gray-600 shadow-2xs"
                />
                <text
                  x="0"
                  y="0"
                  dy="3.5"
                  textAnchor="middle"
                  fontSize="10"
                  className="font-mono fill-gray-700 dark:fill-gray-200 font-bold"
                >
                  {displayVal}
                </text>
              </g>
            </g>
          );
        })}

        {/* Nodes as Rounded Squares (130% Size) */}
        {nodes.map(node => {
          const img = elementImages[node.id];
          const hasImage = typeof img === 'string' && img.trim().length > 0;

          return (
            <g key={node.id} className="cursor-default select-none">
              {hasImage ? (
                <>
                  <image
                    href={img}
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#flow-ball-clip-${node.id})`}
                  />
                  <rect
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    rx="12"
                    ry="12"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="1.2"
                    opacity="0.6"
                    className="pointer-events-none"
                  />
                </>
              ) : (
                <>
                  <rect
                    x={node.x - 23.5}
                    y={node.y - 23.5}
                    width="47"
                    height="47"
                    rx="12"
                    ry="12"
                    fill="url(#flow-sphere-base)"
                    stroke="#4f46e5"
                    strokeWidth="1.2"
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill="#ffffff"
                    className="font-sans pointer-events-none select-none tracking-tight"
                    style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))' }}
                  >
                    {node.label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

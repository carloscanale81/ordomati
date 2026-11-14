import React, { useState, useId } from 'react';
import { SOCCER_CONCEPTS, SoccerConcept } from '../../logic/soccerAnalysis';

export interface SoccerDimensionGraphProps {
  matrix: number[][]; // 12x12 dimension affinity matrix C
  className?: string;
  decimalPrecision?: number;
}

interface DimensionNode {
  id: number;
  concept: (typeof SOCCER_CONCEPTS)[0];
  code: string; // D1, D2, ...
  abbr: string; // Reg, Gol, Aér...
  name: string;
  x: number;
  y: number;
}

interface DimensionEdge {
  fromIdx: number;
  toIdx: number;
  fromNode: DimensionNode;
  toNode: DimensionNode;
  val: number;
  ratio: number;
}

export const SoccerDimensionGraph: React.FC<SoccerDimensionGraphProps> = ({
  matrix,
  className = '',
  decimalPrecision = 2
}) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');
  const markerId = `dim-arrow-${uid}`;

  // 1. Arrange the 12 dimension nodes in a wide, spacious ellipse (960 x 520)
  const W = 960;
  const H = 520;
  const cx = W / 2; // 480
  const cy = H / 2; // 260
  const rx = 400;   // Wide horizontal spread
  const ry = 205;   // Spacious vertical spread
  const n = SOCCER_CONCEPTS.length; // 12

  const nodes: DimensionNode[] = SOCCER_CONCEPTS.map((concept, i) => {
    // Start at top (-PI/2) and rotate clockwise
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id: i,
      concept,
      code: `D${i + 1}`,
      abbr: concept.name.slice(0, 3),
      name: concept.name,
      x: cx + rx * Math.cos(theta),
      y: cy + ry * Math.sin(theta)
    };
  });

  // 2. Find max value (excluding diagonal) for relative edge scaling
  let maxVal = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && typeof v === 'number' && Number.isFinite(v) && v > maxVal) {
        maxVal = v;
      }
    });
  });
  if (maxVal === 0) maxVal = 1;

  // 3. Collect all directed off-diagonal edges
  const allEdges: DimensionEdge[] = [];
  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (
        i !== j &&
        typeof val === 'number' &&
        Number.isFinite(val) &&
        val > 0 &&
        nodes[i] &&
        nodes[j]
      ) {
        allEdges.push({
          fromIdx: i,
          toIdx: j,
          fromNode: nodes[i],
          toNode: nodes[j],
          val,
          ratio: Math.min(1, Math.max(0, val / maxVal))
        });
      }
    });
  });

  // Sort ascending by value so stronger edges are drawn on top
  allEdges.sort((a, b) => a.val - b.val);

  const activeNodeInfo = hoveredNode !== null ? nodes[hoveredNode] : null;

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs relative bg-slate-900 select-none ${className}`}
    >
      {/* Top Banner Indicator on Node Hover */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {activeNodeInfo ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs shadow-md animate-in fade-in duration-150">
            <span className="font-mono font-bold text-indigo-400">{activeNodeInfo.code}</span>
            <span>·</span>
            <span className="font-semibold">{activeNodeInfo.name}</span>
            <span className="text-[11px] text-indigo-300/80">({activeNodeInfo.concept.unit})</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium px-2 py-0.5">
            Pasa el cursor sobre una dimensión para resaltar sus relaciones
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto drop-shadow-md">
        <defs>
          {/* Arrowhead marker */}
          <marker
            id={markerId}
            markerWidth="7"
            markerHeight="5.5"
            refX="6"
            refY="2.75"
            orient="auto"
          >
            <polygon points="0 0, 7 2.75, 0 5.5" fill="#818cf8" />
          </marker>

          {/* Node drop shadow */}
          <filter id={`node-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Subtle elliptical guideline */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.35"
        />

        {/* Directed Curved Affinity Arrows */}
        {allEdges.map((edge, idx) => {
          const isNodeHovered =
            hoveredNode !== null &&
            (hoveredNode === edge.fromIdx || hoveredNode === edge.toIdx);
          const isFaded = hoveredNode !== null && !isNodeHovered;

          const dx = edge.toNode.x - edge.fromNode.x;
          const dy = edge.toNode.y - edge.fromNode.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return null;

          const ux = dx / len;
          const uy = dy / len;
          const nx = -uy;
          const ny = ux;

          // Curve offset based on length
          const curveOffset = Math.min(32, Math.max(16, len * 0.08));
          const controlX = edge.fromNode.x + dx / 2 + nx * curveOffset;
          const controlY = edge.fromNode.y + dy / 2 + ny * curveOffset;

          const nodeMargin = 26;
          const startDx = controlX - edge.fromNode.x;
          const startDy = controlY - edge.fromNode.y;
          const startLen = Math.sqrt(startDx * startDx + startDy * startDy);
          const startX = edge.fromNode.x + (startDx / startLen) * nodeMargin;
          const startY = edge.fromNode.y + (startDy / startLen) * nodeMargin;

          const endDx = controlX - edge.toNode.x;
          const endDy = controlY - edge.toNode.y;
          const endLen = Math.sqrt(endDx * endDx + endDy * endDy);
          const endX = edge.toNode.x + (endDx / endLen) * (nodeMargin + 4);
          const endY = edge.toNode.y + (endDy / endLen) * (nodeMargin + 4);

          const midX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
          const midY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;

          const strokeWidth = Math.max(0.75, (edge.val / maxVal) * 3.8);
          const baseOpacity = isFaded
            ? 0.05
            : isNodeHovered
            ? 0.95
            : Math.max(0.18, 0.12 + (edge.val / maxVal) * 0.65);

          const strokeColor = isNodeHovered
            ? '#a5b4fc'
            : edge.ratio >= 0.7
            ? '#818cf8'
            : '#6366f1';

          return (
            <g key={idx} className="transition-opacity duration-200">
              <path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isNodeHovered ? strokeWidth + 0.8 : strokeWidth}
                markerEnd={`url(#${markerId})`}
                opacity={baseOpacity}
              >
                <title>{`${edge.fromNode.code} (${edge.fromNode.name}) → ${edge.toNode.code} (${edge.toNode.name}): ${edge.val.toFixed(
                  decimalPrecision
                )}`}</title>
              </path>

              {/* Edge Value Badge on Midpoint */}
              {(isNodeHovered || (!isFaded && edge.ratio >= 0.8)) && (
                <g transform={`translate(${midX},${midY})`} className="pointer-events-none">
                  <rect
                    x="-14"
                    y="-7"
                    width="28"
                    height="14"
                    rx="4"
                    fill="#0f172a"
                    stroke="#818cf8"
                    strokeWidth="0.8"
                    opacity={isNodeHovered ? 1 : 0.85}
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="bold"
                    fill="#f8fafc"
                    className="font-mono tabular-nums"
                  >
                    {edge.val.toFixed(decimalPrecision)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 12 Dimension Nodes: Squared with Rounded Corners */}
        {nodes.map(node => {
          const isHovered = hoveredNode === node.id;
          const isConnected =
            hoveredNode !== null &&
            (hoveredNode === node.id ||
              allEdges.some(
                e =>
                  (e.fromIdx === hoveredNode && e.toIdx === node.id) ||
                  (e.toIdx === hoveredNode && e.fromIdx === node.id)
              ));
          const isFaded = hoveredNode !== null && !isConnected;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-transform duration-150"
              filter={`url(#node-shadow-${uid})`}
              opacity={isFaded ? 0.35 : 1}
            >
              {/* Outer Pulse Rounded Ring on Hover */}
              {isHovered && (
                <rect
                  x="-32"
                  y="-24"
                  width="64"
                  height="48"
                  rx="12"
                  fill="none"
                  stroke="#a5b4fc"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )}

              {/* Square Node with Rounded Corners */}
              <rect
                x="-26"
                y="-18"
                width="52"
                height="36"
                rx="8"
                fill={isHovered ? '#312e81' : '#1e1b4b'}
                stroke={isHovered ? '#c7d2fe' : '#818cf8'}
                strokeWidth={isHovered ? 2.5 : 1.6}
              />

              {/* Dimension Code Badge (e.g. D1, D2) */}
              <text
                x="0"
                y="-5"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#a5b4fc"
                className="font-mono select-none"
              >
                {node.code}
              </text>

              {/* Dimension Short Abbreviation (matching table headers: Reg, Gol, Aér...) */}
              <text
                x="0"
                y="9"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#ffffff"
                className="font-sans select-none tracking-wide"
              >
                {node.abbr}
              </text>

              {/* Title tag for native browser tooltip fallback */}
              <title>{`${node.code}: ${node.name} (${node.concept.unit})`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

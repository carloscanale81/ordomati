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

  return (
    <div
      className={`w-full max-w-[960px] mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative bg-[#0b1329] select-none ${className}`}
    >
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
          <filter id={`node-shadow-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Subtle grid pattern / pitch-like backdrop lines */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          opacity="0.4"
        />
        <circle
          cx={cx}
          cy={cy}
          r={70}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.25"
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

          const nodeMargin = 20;
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

          // Stroke width proportional to edge weight (matching pitch graph)
          const strokeWidth = Math.max(0.65, (edge.val / maxVal) * 3.6);
          const baseOpacity = isFaded
            ? 0.08
            : isNodeHovered
            ? 0.95
            : Math.max(0.2, 0.15 + (edge.val / maxVal) * 0.65);

          const strokeColor = isNodeHovered
            ? '#c7d2fe'
            : edge.ratio >= 0.7
            ? '#818cf8'
            : '#6366f1';

          return (
            <g key={idx} className="transition-opacity duration-200">
              <path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isNodeHovered ? strokeWidth + 0.6 : strokeWidth}
                markerEnd={`url(#${markerId})`}
                opacity={baseOpacity}
              >
                <title>{`${edge.fromNode.abbr} (${edge.fromNode.name}) → ${edge.toNode.abbr} (${edge.toNode.name}): ${edge.val.toFixed(
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
                  x="-24"
                  y="-21"
                  width="48"
                  height="42"
                  rx="10"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              )}

              {/* Square / Rounded Rectangle Node */}
              <rect
                x="-18"
                y="-15"
                width="36"
                height="30"
                rx="7"
                fill={isHovered ? '#312e81' : '#1e1b4b'}
                stroke={isHovered ? '#c7d2fe' : '#818cf8'}
                strokeWidth={isHovered ? 2.5 : 1.8}
              />

              {/* Dimension Abbreviated Name inside the node (no D#) */}
              <text
                x="0"
                y="4.5"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#ffffff"
                className="font-sans select-none tracking-wide"
              >
                {node.abbr}
              </text>

              {/* Tooltip on hover with complete name and unit (no D#) */}
              <title>{`${node.name} (${node.concept.unit})`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

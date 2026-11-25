import React, { useState } from 'react';
import { MatchPlayer } from '../../logic/soccerAnalysis';
import { getTeamCrestColors } from '../../logic/teamColors';

export interface SoccerPitchGraphProps {
  players: MatchPlayer[];
  matrix: number[][]; // Contextual affinity matrix AC
  teamKey?: 'home' | 'away';
  teamName?: string;
  crestUrl?: string;
  minThreshold?: number;
  maxEdges?: number;
  className?: string;
  decimalPrecision?: number;
}

interface PitchNode {
  id: number;
  player: MatchPlayer;
  x: number;
  y: number;
}

interface PitchEdge {
  fromIdx: number;
  toIdx: number;
  fromNode: PitchNode;
  toNode: PitchNode;
  val: number;
  ratio: number;
}

export const SoccerPitchGraph: React.FC<SoccerPitchGraphProps> = ({
  players,
  matrix,
  teamKey = 'home',
  teamName,
  crestUrl,
  className = '',
  decimalPrecision = 2
}) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // 1. Calculate tactical coordinates for each of the 11 active players on the horizontal pitch
  const nodes: PitchNode[] = layoutSoccerPitchNodesHorizontal(players);

  // 2. Find max value for relative scaling (excluding diagonal)
  let maxVal = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && typeof v === 'number' && Number.isFinite(v) && v > maxVal) {
        maxVal = v;
      }
    });
  });
  if (maxVal === 0) maxVal = 1;

  // 3. Collect all edges for all affinities > 0 between distinct players (excluding self)
  const allEdges: PitchEdge[] = [];
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

  // Sort ascending by value so that stronger / thicker edges are drawn on top
  allEdges.sort((a, b) => a.val - b.val);
  const edges = allEdges;

  const uid = React.useId().replace(/:/g, '');
  const markerId = `pitch-arrow-${teamKey}-${uid}`;
  const grassStripesId = `grass-stripes-${uid}`;
  const nodeGlowId = `node-glow-${uid}`;

  // Resolve team crest colors for node rendering
  const crestColors = getTeamCrestColors(teamKey, teamName, crestUrl);
  const strokeColor = crestColors.accent;
  const nodeBgColor = crestColors.primary;
  const nodeBorderColor = crestColors.border;
  const nodeTextColor = crestColors.text;

  return (
    <div
      className={`w-full max-w-[760px] mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative bg-[#0d2818] select-none ${className}`}
    >
      <svg viewBox="0 0 720 450" className="w-full h-auto drop-shadow-md">
        <defs>
          {/* Arrowhead marker */}
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

          {/* Grass striping pattern */}
          <linearGradient id={grassStripesId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0e2f1d" />
            <stop offset="10%" stopColor="#123a24" />
            <stop offset="20%" stopColor="#0e2f1d" />
            <stop offset="30%" stopColor="#123a24" />
            <stop offset="40%" stopColor="#0e2f1d" />
            <stop offset="50%" stopColor="#123a24" />
            <stop offset="60%" stopColor="#0e2f1d" />
            <stop offset="70%" stopColor="#123a24" />
            <stop offset="80%" stopColor="#0e2f1d" />
            <stop offset="90%" stopColor="#123a24" />
            <stop offset="100%" stopColor="#0e2f1d" />
          </linearGradient>

          {/* Player node glow filter */}
          <filter id={nodeGlowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Pitch Background */}
        <rect x="0" y="0" width="720" height="450" fill={`url(#${grassStripesId})`} />

        {/* Tactical Pitch Lines (Horizontal Orientation) */}
        <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" fill="none">
          {/* Outer Boundary Line */}
          <rect x="20" y="20" width="680" height="410" rx="8" />

          {/* Halfway Line */}
          <line x1="360" y1="20" x2="360" y2="430" />

          {/* Center Circle & Spot */}
          <circle cx="360" cy="225" r="55" />
          <circle cx="360" cy="225" r="2.5" fill="#ffffff" fillOpacity="0.5" />

          {/* Left Penalty Area (Defending / GK Box) */}
          <rect x="20" y="120" width="120" height="210" />
          <rect x="20" y="170" width="42" height="110" />
          <circle cx="95" cy="225" r="2.5" fill="#ffffff" fillOpacity="0.4" />
          <path d="M 140 185 A 48 48 0 0 1 140 265" />
          {/* Left Goal Mouth */}
          <rect x="10" y="195" width="10" height="60" fill="#ffffff" fillOpacity="0.12" />

          {/* Right Penalty Area (Attacking Box) */}
          <rect x="580" y="120" width="120" height="210" />
          <rect x="658" y="170" width="42" height="110" />
          <circle cx="625" cy="225" r="2.5" fill="#ffffff" fillOpacity="0.4" />
          <path d="M 580 185 A 48 48 0 0 0 580 265" />
          {/* Right Goal Mouth */}
          <rect x="700" y="195" width="10" height="60" fill="#ffffff" fillOpacity="0.12" />

          {/* Corner Arcs */}
          <path d="M 20 32 A 12 12 0 0 0 32 20" />
          <path d="M 32 430 A 12 12 0 0 0 20 418" />
          <path d="M 688 20 A 12 12 0 0 0 700 32" />
          <path d="M 700 418 A 12 12 0 0 0 688 430" />
        </g>

        {/* Directed Curved Affinity Arrows */}
        {edges.map((edge, idx) => {
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

          const curveOffset = 18;
          const controlX = edge.fromNode.x + dx / 2 + nx * curveOffset;
          const controlY = edge.fromNode.y + dy / 2 + ny * curveOffset;

          const nodeRadius = 15;
          const startDx = controlX - edge.fromNode.x;
          const startDy = controlY - edge.fromNode.y;
          const startLen = Math.sqrt(startDx * startDx + startDy * startDy);
          const startX = edge.fromNode.x + (startDx / startLen) * nodeRadius;
          const startY = edge.fromNode.y + (startDy / startLen) * nodeRadius;

          const endDx = controlX - edge.toNode.x;
          const endDy = controlY - edge.toNode.y;
          const endLen = Math.sqrt(endDx * endDx + endDy * endDy);
          const endX = edge.toNode.x + (endDx / endLen) * (nodeRadius + 4);
          const endY = edge.toNode.y + (endDy / endLen) * (nodeRadius + 4);

          const midX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
          const midY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;

          const strokeWidth = Math.max(0.65, (edge.val / maxVal) * 3.6);
          const baseOpacity = isFaded ? 0.08 : isNodeHovered ? 0.95 : Math.max(0.2, 0.15 + (edge.val / maxVal) * 0.65);

          return (
            <g key={idx} className="transition-opacity duration-200">
              {/* Curve Arrow Path */}
              <path
                d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                markerEnd={`url(#${markerId})`}
                opacity={baseOpacity}
              >
                <title>{`${edge.fromNode.player.name} → ${edge.toNode.player.name}: ${edge.val.toFixed(
                  decimalPrecision
                )}`}</title>
              </path>

              {/* Edge Value Badge on Midpoint */}
              {(isNodeHovered || (!isFaded && edge.ratio >= 0.6)) && (
                <g transform={`translate(${midX},${midY})`} className="pointer-events-none">
                  <rect
                    x="-13"
                    y="-6.5"
                    width="26"
                    height="13"
                    rx="3.5"
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                    opacity={isNodeHovered ? 1 : 0.85}
                  />
                  <text
                    x="0"
                    y="3"
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

        {/* 11 Tactical Player Nodes */}
        {nodes.map(node => {
          const isHovered = hoveredNode === node.id;
          const lastName = getShortPlayerName(node.player.name);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-transform duration-150"
              filter={`url(#${nodeGlowId})`}
            >
              {/* Outer Pulse Ring on Hover */}
              {isHovered && (
                <circle cx="0" cy="0" r="21" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
              )}

              {/* Jersey Node Circle */}
              <circle
                cx="0"
                cy="0"
                r="15"
                fill={nodeBgColor}
                stroke={nodeBorderColor}
                strokeWidth={isHovered ? 2.5 : 1.8}
              />

              {/* Shirt Number */}
              <text
                x="0"
                y="4.5"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill={nodeTextColor}
                className="font-mono select-none"
              >
                {node.player.shirtNo}
              </text>

              {/* Player Name Banner underneath */}
              <g transform="translate(0, 24)" className="pointer-events-none">
                <rect
                  x="-32"
                  y="-7"
                  width="64"
                  height="14"
                  rx="3.5"
                  fill="#020617"
                  fillOpacity="0.88"
                  stroke="#334155"
                  strokeWidth="0.6"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="bold"
                  fill="#f1f5f9"
                  className="select-none"
                >
                  {lastName}
                </text>
              </g>

              {/* Position badge */}
              <g transform="translate(0, -18)" className="pointer-events-none">
                <rect
                  x="-13"
                  y="-5"
                  width="26"
                  height="10"
                  rx="2"
                  fill="#000000"
                  fillOpacity="0.75"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {node.player.position}
                </text>
              </g>

              <title>{`#${node.player.shirtNo} ${node.player.name} (${node.player.position})`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Distributes players on a 720 x 450 football pitch horizontally.
 * Priority 1: Exact coordinates specified in the match JSON (`fieldX`, `fieldY` from `formationPositions`).
 *   In WhoScored JSON:
 *   - fieldX (vertical): 0 (GK / defending goal line) to 10 (attacking goal line / strikers).
 *   - fieldY (horizontal): 1 (right flank) to 9 (left flank), with 5 being the pitch center axis.
 *   Mapped to 720 x 450 SVG canvas:
 *   - SVG X: 55 + (fieldX / 10) * 595 (from X ~ 55 to X ~ 650)
 *   - SVG Y: 45 + ((10 - fieldY) / 10) * 360 (flank left at top Y ~ 81, right flank at bottom Y ~ 369)
 * Priority 2: Tactical role and positional heuristics fallback if JSON coordinates are not present.
 */
export function layoutSoccerPitchNodesHorizontal(players: MatchPlayer[]): PitchNode[] {
  // If players have JSON coordinates (fieldX and fieldY), use them directly!
  const hasJsonCoords = players.some(
    p => typeof p.fieldX === 'number' && typeof p.fieldY === 'number'
  );

  if (hasJsonCoords) {
    return players.map((p, idx) => {
      if (typeof p.fieldX === 'number' && typeof p.fieldY === 'number') {
        const x = Math.round(55 + (p.fieldX / 10) * 595);
        const y = Math.round(45 + ((10 - p.fieldY) / 10) * 360);
        return { id: idx, player: p, x, y };
      }
      // Individual fallback if a single player lacks coordinates
      return {
        id: idx,
        player: p,
        x: Math.round(100 + ((idx * 50) % 500)),
        y: Math.round(70 + ((idx * 45) % 310))
      };
    });
  }

  const gkList: MatchPlayer[] = [];
  const defs: MatchPlayer[] = [];
  const mids: MatchPlayer[] = [];
  const fwds: MatchPlayer[] = [];

  players.forEach(p => {
    const pos = (p.position || '').toUpperCase();
    if (pos === 'GK') {
      gkList.push(p);
    } else if (pos.startsWith('D')) {
      defs.push(p);
    } else if (pos.startsWith('M')) {
      mids.push(p);
    } else {
      fwds.push(p);
    }
  });

  const sortVertically = (arr: MatchPlayer[]) => {
    const score = (p: MatchPlayer) => {
      const pos = (p.position || '').toUpperCase();
      if (pos.includes('L') || pos.endsWith('L')) return -1; // Top (Left flank)
      if (pos.includes('R') || pos.endsWith('R')) return 1;  // Bottom (Right flank)
      return 0; // Central
    };
    return [...arr].sort((a, b) => score(a) - score(b));
  };

  const sortedDefs = sortVertically(defs);
  const sortedMids = sortVertically(mids);
  const sortedFwds = sortVertically(fwds);

  const nodes: PitchNode[] = [];

  // 1. Goalkeeper (defending left goal mouth)
  gkList.forEach(gk => {
    const idx = players.findIndex(p => p.id === gk.id || p.name === gk.name);
    if (idx !== -1) {
      nodes[idx] = { id: idx, player: gk, x: 58, y: 225 };
    }
  });

  // 2. Defenders line (base X ~ 170, fullbacks advanced to X ~ 195, center-backs deeper to X ~ 155)
  distributeVerticalLineWithStagger(sortedDefs, players, nodes, 170, 75, 375, p => {
    const pos = (p.position || '').toUpperCase();
    if (pos.includes('DC')) return -18; // Deeper towards goal
    if (pos.includes('L') || pos.includes('R')) return 22; // Advanced fullbacks
    return 0;
  });

  // 3. Midfield line (base X ~ 340, holding pivots deeper at X ~ 285, attacking mids advanced at X ~ 410)
  distributeVerticalLineWithStagger(sortedMids, players, nodes, 345, 80, 370, (p, idx) => {
    const pos = (p.position || '').toUpperCase();
    const name = p.name;
    if (name === 'Rodri' || name === 'Enzo Fernández' || pos.includes('DM')) return -45; // Pivot
    if (name === 'Dani Olmo' || name === 'Alexis Mac Allister' || pos.includes('AM')) return 50; // Attacking mid
    return idx % 2 === 0 ? 12 : -12; // Stagger to prevent node overlap
  });

  // 4. Forward line (base X ~ 545, center forward highest at X ~ 605, wingers at X ~ 520)
  distributeVerticalLineWithStagger(sortedFwds, players, nodes, 545, 95, 355, p => {
    const pos = (p.position || '').toUpperCase();
    if (pos === 'FW' || pos === 'CF' || pos === 'ST') return 55; // Out in front striker
    return -18; // Wingers slightly recessed for diagonal cut
  });

  // Fallback for any unmapped player
  players.forEach((p, i) => {
    if (!nodes[i]) {
      nodes[i] = { id: i, player: p, x: 100 + ((i * 50) % 500), y: 70 + ((i * 45) % 310) };
    }
  });

  return nodes;
}

function distributeVerticalLineWithStagger(
  linePlayers: MatchPlayer[],
  allPlayers: MatchPlayer[],
  nodes: PitchNode[],
  baseX: number,
  yMin: number,
  yMax: number,
  offsetXFn: (p: MatchPlayer, idx: number, total: number) => number
) {
  const count = linePlayers.length;
  if (count === 0) return;

  if (count === 1) {
    const p = linePlayers[0];
    const idx = allPlayers.findIndex(x => x.id === p.id || x.name === p.name);
    if (idx !== -1) {
      nodes[idx] = { id: idx, player: p, x: baseX + offsetXFn(p, 0, 1), y: (yMin + yMax) / 2 };
    }
    return;
  }

  const step = (yMax - yMin) / (count - 1);
  linePlayers.forEach((p, i) => {
    const idx = allPlayers.findIndex(x => x.id === p.id || x.name === p.name);
    if (idx !== -1) {
      nodes[idx] = {
        id: idx,
        player: p,
        x: Math.round(baseX + offsetXFn(p, i, count)),
        y: Math.round(yMin + i * step)
      };
    }
  });
}

function getShortPlayerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1]; // Return last name
}

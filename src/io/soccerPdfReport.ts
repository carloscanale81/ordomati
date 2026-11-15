import {
  MatchPlayer,
  TimelineSegment,
  SoccerTimelineResult,
  SoccerConcept,
  SOCCER_CONCEPTS,
  SoccerOwaConfig,
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig,
  computeSoccerDimensionalAnalysis,
  computeSoccerAggregatedAnalysis,
  computeIntegralMatchCumulativeScores,
  computeIntegralCumulativeAffinity,
  IntegralMatchAnalysisResult,
  CumulativeAffinityResult
} from '../logic/soccerAnalysis';
import { SynergyConfig } from '../logic/types';
import { getTeamCrestColors } from '../logic/teamColors';

export interface SoccerReportOptions {
  matchData: any;
  sourceUrl: string;
  timeline: SoccerTimelineResult;
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    score: string;
    competition: string;
    stage: string;
    date: string;
    venue: string;
  };
  config: {
    propagationConfig: SoccerPropagationConfig;
    blockingConfig: SoccerBlockingConfig;
    synergyConfigs: Record<SoccerConcept, SynergyConfig>;
    relativeConfig: SoccerRelativeAdjustmentConfig;
    equalizationConfig: SoccerEqualizationConfig;
    owaConfig: SoccerOwaConfig;
    dimAffinityMatrix: number[][];
  };
  language: 'es' | 'en';
}

function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the 12-dimension interdimensional affinity graph as a standalone vector SVG string.
 */
function renderDimensionAffinityGraphSvg(matrix: number[][]): string {
  const W = 960;
  const H = 520;
  const cx = W / 2;
  const cy = H / 2;
  const rx = 400;
  const ry = 205;
  const n = SOCCER_CONCEPTS.length;

  const nodes = SOCCER_CONCEPTS.map((concept, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id: i,
      code: `D${i + 1}`,
      abbr: concept.name.slice(0, 3),
      name: concept.name,
      unit: concept.unit,
      x: Math.round(cx + rx * Math.cos(theta)),
      y: Math.round(cy + ry * Math.sin(theta))
    };
  });

  let maxVal = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && typeof v === 'number' && Number.isFinite(v) && v > maxVal) {
        maxVal = v;
      }
    });
  });
  if (maxVal === 0) maxVal = 1;

  const edges: Array<{
    fromIdx: number;
    toIdx: number;
    val: number;
    ratio: number;
    fromNode: typeof nodes[0];
    toNode: typeof nodes[0];
  }> = [];

  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j && typeof val === 'number' && Number.isFinite(val) && val > 0 && nodes[i] && nodes[j]) {
        edges.push({
          fromIdx: i,
          toIdx: j,
          val,
          ratio: Math.min(1, Math.max(0, val / maxVal)),
          fromNode: nodes[i],
          toNode: nodes[j]
        });
      }
    });
  });

  edges.sort((a, b) => a.val - b.val);

  const markerId = 'pdf-dim-arrow';

  let svgEdges = '';
  edges.forEach(edge => {
    const dx = edge.toNode.x - edge.fromNode.x;
    const dy = edge.toNode.y - edge.fromNode.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nodeMargin = 32;
    const sx = edge.fromNode.x + (dx / dist) * nodeMargin;
    const sy = edge.fromNode.y + (dy / dist) * nodeMargin;
    const ex = edge.toNode.x - (dx / dist) * nodeMargin;
    const ey = edge.toNode.y - (dy / dist) * nodeMargin;

    const strokeWidth = Math.max(0.65, edge.ratio * 3.6).toFixed(2);
    const strokeOpacity = (0.2 + edge.ratio * 0.65).toFixed(2);
    const strokeColor = '#3b82f6';

    svgEdges += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" marker-end="url(#${markerId})" />\n`;
  });

  let svgNodes = '';
  nodes.forEach(node => {
    const boxW = 50;
    const boxH = 34;
    const bx = node.x - boxW / 2;
    const by = node.y - boxH / 2;

    svgNodes += `
      <g transform="translate(${bx}, ${by})">
        <rect width="${boxW}" height="${boxH}" rx="7" ry="7" fill="#1e293b" stroke="#60a5fa" stroke-width="1.8" />
        <text x="${boxW / 2}" y="${boxH / 2 + 4.5}" fill="#ffffff" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">${escapeHtml(node.abbr)}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" style="max-height: 440px; background: #0f172a; border-radius: 12px; display: block; margin: 12px auto;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="${markerId}" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="#60a5fa" />
        </marker>
      </defs>
      <rect width="${W}" height="${H}" fill="#0f172a" rx="12" />
      <g opacity="0.15">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#94a3b8" stroke-dasharray="4 4" stroke-width="1.5" />
      </g>
      ${svgEdges}
      ${svgNodes}
    </svg>
  `;
}

/**
 * Computes horizontal pitch coordinates for the 11 active players.
 */
function layoutPitchPlayers(players: MatchPlayer[]) {
  const gkList = players.filter(p => (p.position || '').toUpperCase().includes('GK'));
  const defs = players.filter(p => {
    const pos = (p.position || '').toUpperCase();
    return pos.includes('DF') || pos.includes('CB') || pos.includes('LB') || pos.includes('RB');
  });
  const mids = players.filter(p => {
    const pos = (p.position || '').toUpperCase();
    return (
      pos.includes('MF') ||
      pos.includes('CM') ||
      pos.includes('DM') ||
      pos.includes('AM') ||
      pos.includes('LM') ||
      pos.includes('RM')
    );
  });
  const fwds = players.filter(p => {
    const pos = (p.position || '').toUpperCase();
    return (
      pos.includes('FW') ||
      pos.includes('CF') ||
      pos.includes('ST') ||
      pos.includes('LW') ||
      pos.includes('RW')
    );
  });

  const sortVertically = (arr: MatchPlayer[]) => {
    const score = (p: MatchPlayer) => {
      const pos = (p.position || '').toUpperCase();
      if (pos.includes('L') || pos.endsWith('L')) return -1;
      if (pos.includes('R') || pos.endsWith('R')) return 1;
      return 0;
    };
    return [...arr].sort((a, b) => score(a) - score(b));
  };

  const sortedDefs = sortVertically(defs);
  const sortedMids = sortVertically(mids);
  const sortedFwds = sortVertically(fwds);

  const nodes: Array<{ id: number; player: MatchPlayer; x: number; y: number }> = [];

  gkList.forEach(gk => {
    const idx = players.findIndex(p => p.id === gk.id || p.name === gk.name);
    if (idx !== -1) nodes[idx] = { id: idx, player: gk, x: 58, y: 225 };
  });

  const distribute = (
    list: MatchPlayer[],
    baseX: number,
    yMin: number,
    yMax: number,
    offsetFn: (p: MatchPlayer, i: number, total: number) => number
  ) => {
    if (list.length === 0) return;
    if (list.length === 1) {
      const idx = players.findIndex(p => p.id === list[0].id || p.name === list[0].name);
      if (idx !== -1) nodes[idx] = { id: idx, player: list[0], x: baseX, y: (yMin + yMax) / 2 };
      return;
    }
    const step = (yMax - yMin) / (list.length - 1);
    list.forEach((p, i) => {
      const idx = players.findIndex(x => x.id === p.id || x.name === p.name);
      if (idx !== -1) {
        nodes[idx] = {
          id: idx,
          player: p,
          x: Math.round(baseX + offsetFn(p, i, list.length)),
          y: Math.round(yMin + i * step)
        };
      }
    });
  };

  distribute(sortedDefs, 170, 75, 375, p => {
    const pos = (p.position || '').toUpperCase();
    if (pos.includes('DC')) return -18;
    if (pos.includes('L') || pos.includes('R')) return 22;
    return 0;
  });

  distribute(sortedMids, 345, 80, 370, (p, i) => {
    const pos = (p.position || '').toUpperCase();
    const name = p.name;
    if (name === 'Rodri' || name === 'Enzo Fernández' || pos.includes('DM')) return -45;
    if (name === 'Dani Olmo' || name === 'Alexis Mac Allister' || pos.includes('AM')) return 50;
    return i % 2 === 0 ? 12 : -12;
  });

  distribute(sortedFwds, 545, 95, 355, p => {
    const pos = (p.position || '').toUpperCase();
    if (pos === 'FW' || pos === 'CF' || pos === 'ST') return 55;
    return -18;
  });

  players.forEach((p, i) => {
    if (!nodes[i]) {
      nodes[i] = { id: i, player: p, x: 100 + ((i * 50) % 500), y: 70 + ((i * 45) % 310) };
    }
  });

  return nodes;
}

/**
 * Renders a pitch graph with passing/contextual affinity arcs as an SVG string.
 */
function renderPitchGraphSvg(
  players: MatchPlayer[],
  matrix: number[][],
  team: 'home' | 'away',
  teamName?: string,
  crestUrl?: string
): string {
  const nodes = layoutPitchPlayers(players);
  let maxVal = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && typeof v === 'number' && Number.isFinite(v) && v > maxVal) {
        maxVal = v;
      }
    });
  });
  if (maxVal === 0) maxVal = 1;

  const edges: Array<{ from: typeof nodes[0]; to: typeof nodes[0]; val: number; ratio: number }> = [];
  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j && typeof val === 'number' && val > 0 && nodes[i] && nodes[j]) {
        edges.push({
          from: nodes[i],
          to: nodes[j],
          val,
          ratio: Math.min(1, Math.max(0, val / maxVal))
        });
      }
    });
  });

  edges.sort((a, b) => a.val - b.val);

  const crestColors = getTeamCrestColors(team, teamName, crestUrl);
  const markerId = `pitch-arrow-${team}`;
  const strokeColor = crestColors.accent;
  const nodeFill = crestColors.primary;
  const nodeStroke = crestColors.border;
  const nodeTextColor = crestColors.text;

  let svgEdges = '';
  edges.forEach(e => {
    const dx = e.to.x - e.from.x;
    const dy = e.to.y - e.from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nodeRadius = 18;
    const sx = e.from.x + (dx / dist) * nodeRadius;
    const sy = e.from.y + (dy / dist) * nodeRadius;
    const ex = e.to.x - (dx / dist) * (nodeRadius + 4);
    const ey = e.to.y - (dy / dist) * (nodeRadius + 4);

    const sw = (0.75 + e.ratio * 2.5).toFixed(2);
    const op = (0.2 + e.ratio * 0.75).toFixed(2);

    svgEdges += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${strokeColor}" stroke-width="${sw}" stroke-opacity="${op}" marker-end="url(#${markerId})" />\n`;
  });

  let svgNodes = '';
  nodes.forEach(n => {
    const parts = n.player.name.trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

    svgNodes += `
      <g transform="translate(${n.x}, ${n.y})">
        <circle r="14" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="2" />
        <text y="4" fill="${nodeTextColor}" font-size="11" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">${n.player.shirtNo || ''}</text>
        <text y="24" fill="#f8fafc" font-size="9.5" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle" stroke="#000000" stroke-width="2" paint-order="stroke fill">${escapeHtml(lastName)}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 720 450" width="100%" height="auto" style="max-height: 380px; background: #0f3d23; border-radius: 12px; display: block; margin: 12px auto;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="${markerId}" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="${strokeColor}" />
        </marker>
      </defs>
      <!-- Pitch Lines -->
      <rect x="20" y="20" width="680" height="410" fill="#134e2a" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8" rx="6" />
      <line x1="360" y1="20" x2="360" y2="430" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <circle cx="360" cy="225" r="55" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <circle cx="360" cy="225" r="3" fill="#ffffff" fill-opacity="0.8" />
      <!-- Left Box -->
      <rect x="20" y="115" width="115" height="220" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <rect x="20" y="165" width="40" height="120" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <circle cx="95" cy="225" r="2.5" fill="#ffffff" fill-opacity="0.8" />
      <!-- Right Box -->
      <rect x="585" y="115" width="115" height="220" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <rect x="660" y="165" width="40" height="120" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.8" />
      <circle cx="625" cy="225" r="2.5" fill="#ffffff" fill-opacity="0.8" />

      ${svgEdges}
      ${svgNodes}
    </svg>
  `;
}

/**
 * Formats a number to 3 decimal places or '-' if invalid.
 */
function fmtNum(n: number | undefined | null, dec: number = 3): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '-';
  return n.toFixed(dec);
}

/**
 * Builds the entire HTML string of the official soccer match PDF report.
 */
export function generateSoccerPdfReportHtml(options: SoccerReportOptions): string {
  const { matchData, sourceUrl, timeline, matchInfo, config, language } = options;
  const isEs = language === 'es';

  const generatedDateStr = new Date().toLocaleString(isEs ? 'es-ES' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // 1. Compute Integrated Results at the end of the match
  const finalMinute = timeline.totalMinutes || 120;
  let integralResult: IntegralMatchAnalysisResult | null = null;
  let homeFinalAffinity: CumulativeAffinityResult | null = null;
  let awayFinalAffinity: CumulativeAffinityResult | null = null;

  try {
    integralResult = computeIntegralMatchCumulativeScores(
      timeline,
      matchData,
      'aggregate',
      config.owaConfig,
      config.dimAffinityMatrix,
      config.synergyConfigs,
      finalMinute,
      config.propagationConfig,
      config.blockingConfig,
      config.relativeConfig,
      config.equalizationConfig
    );
    homeFinalAffinity = computeIntegralCumulativeAffinity(
      timeline,
      matchData,
      'home',
      config.synergyConfigs['dribblesWon'] || { type: 'none', k: 1.0 },
      finalMinute,
      config.propagationConfig,
      config.blockingConfig
    );
    awayFinalAffinity = computeIntegralCumulativeAffinity(
      timeline,
      matchData,
      'away',
      config.synergyConfigs['dribblesWon'] || { type: 'none', k: 1.0 },
      finalMinute,
      config.propagationConfig,
      config.blockingConfig
    );
  } catch (err) {
    console.warn('Error computing integral match scores for PDF', err);
  }

  // 2. Precompute dimensional and aggregated analyses for all segments
  interface SegmentReportData {
    segment: TimelineSegment;
    dimAnalyses: any[];
    aggAnalysis: any;
    mvp: MatchPlayer | null;
  }

  const allSegments = [...timeline.homeSegments, ...timeline.awaySegments].sort(
    (a, b) => a.startMinute - b.startMinute
  );

  const segmentReports: SegmentReportData[] = [];
  allSegments.forEach(seg => {
    try {
      const dimAnalyses = SOCCER_CONCEPTS.map(cfg =>
        computeSoccerDimensionalAnalysis(
          matchData,
          seg,
          true,
          config.synergyConfigs[cfg.key] || { type: 'none', k: 1.0 },
          cfg.key,
          config.propagationConfig,
          config.blockingConfig,
          config.relativeConfig
        )
      );
      const aggAnalysis = computeSoccerAggregatedAnalysis(
        dimAnalyses,
        seg,
        config.owaConfig,
        config.dimAffinityMatrix,
        config.equalizationConfig
      );
      segmentReports.push({
        segment: seg,
        dimAnalyses,
        aggAnalysis,
        mvp: aggAnalysis?.mvpPlayer || null
      });
    } catch (e) {
      console.warn(`Failed computing segment ${seg.id} in report:`, e);
    }
  });

  // Table of Contents generator
  const tocEntries: Array<{ id: string; num: string; title: string }> = [
    { id: 'sec-config', num: '1', title: isEs ? 'Configuración General del Análisis' : 'General Analysis Configuration' },
    { id: 'sec-config-funcs', num: '1.1', title: isEs ? 'Funciones de Propagación, Bloqueo y Ajustes' : 'Propagation, Blocking & Adjustments' },
    { id: 'sec-config-owa', num: '1.2', title: isEs ? 'Perfil de Referencia (Operador OWA)' : 'Reference Profile (OWA Operator)' },
    { id: 'sec-config-matrix', num: '1.3', title: isEs ? 'Matriz de Afinidad Interdimensional (C)' : 'Interdimensional Affinity Matrix (C)' },
    { id: 'sec-config-graph', num: '1.4', title: isEs ? 'Grafo de Afinidad entre Dimensiones' : 'Dimension Affinity Graph' },
    { id: 'sec-segmented', num: '2', title: isEs ? 'Análisis Segmentado del Partido' : 'Segmented Match Analysis' },
    { id: 'sec-seg-timeline', num: '2.1', title: isEs ? 'Línea de Tiempo y Segmentos del Encuentro' : 'Match Timeline & Segments' },
    { id: 'sec-seg-details', num: '2.2', title: isEs ? 'Desglose Exhaustivo por Segmento' : 'Detailed Segment Breakdown' }
  ];

  segmentReports.forEach((sr, idx) => {
    const s = sr.segment;
    tocEntries.push({
      id: `sec-seg-${s.id}`,
      num: `2.2.${idx + 1}`,
      title: `${s.teamName} — ${s.startMinute}' a ${s.endMinute}' (${s.periodName})${s.startReason ? ` [${s.startReason.description}]` : ''}`
    });
  });

  tocEntries.push(
    { id: 'sec-integrated', num: '3', title: isEs ? 'Análisis Integrado (Final del Partido)' : 'Integrated Analysis (Final Outcome)' },
    { id: 'sec-int-rankings', num: '3.1', title: isEs ? 'Clasificación Final y Puntuaciones Acumuladas' : 'Final Cumulative Rankings & Scores' },
    { id: 'sec-int-mvp', num: '3.2', title: isEs ? 'Cuadro de Honor (MVP General y por Equipo)' : 'Honors Board (Match & Team MVPs)' },
    { id: 'sec-int-affinity', num: '3.3', title: isEs ? 'Matrices de Afinidad Contextual Acumulada Final' : 'Final Cumulative Affinity Matrices' }
  );

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <title>Ordomática — ${escapeHtml(matchInfo.homeTeam)} vs ${escapeHtml(matchInfo.awayTeam)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 18mm 15mm 18mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      font-size: 11pt;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      background: #ffffff;
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto 20px auto;
      padding: 20mm;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
      position: relative;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Toolbar (Non-printable) */
    .no-print {
      display: block;
    }
    @media print {
      body {
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .page {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: none !important;
        min-height: 0 !important;
      }
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #334155;
      color: #f1f5f9;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    /* Typography & Tables */
    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    h1 { font-size: 24pt; line-height: 1.2; }
    h2 { font-size: 16pt; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 13pt; margin-top: 18px; margin-bottom: 8px; color: #1e3a8a; }
    h4 { font-size: 11pt; margin-top: 14px; margin-bottom: 6px; color: #334155; }
    p { margin-bottom: 10px; text-align: justify; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-gray { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px 0;
      font-size: 8.5pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.data-table td.num {
      text-align: right;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
    table.matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px 0;
      font-size: 7.5pt;
      table-layout: fixed;
    }
    table.matrix-table th, table.matrix-table td {
      border: 1px solid #e2e8f0;
      padding: 3px 2px;
      text-align: center;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    table.matrix-table th {
      background: #e2e8f0;
      font-weight: 700;
      color: #334155;
    }
    table.matrix-table td.diag {
      background: #f1f5f9;
      font-weight: bold;
      color: #0f172a;
    }
    table.matrix-table td.high {
      background: #dbeafe;
      color: #1e40af;
      font-weight: bold;
    }
    /* Cover Page Specific Styles */
    .cover-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 250mm;
      padding: 30mm 15mm 15mm 15mm;
      text-align: center;
    }
    .cover-header {
      margin-bottom: 30px;
    }
    .cover-logo {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px auto;
    }
    .cover-title {
      font-size: 32pt;
      font-weight: 900;
      letter-spacing: 2px;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .cover-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    .cover-flavour {
      font-size: 10.5pt;
      color: #64748b;
      font-weight: 500;
    }
    .cover-match-box {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      margin: 30px auto;
      max-width: 540px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      text-align: center;
    }
    .cover-teams {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .cover-score {
      display: inline-block;
      padding: 4px 14px;
      background: #0f172a;
      color: #ffffff;
      font-family: monospace;
      font-size: 16pt;
      border-radius: 8px;
    }
    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 18px;
      text-align: left;
      font-size: 9.5pt;
      color: #475569;
    }
    .cover-meta-item strong {
      color: #0f172a;
      display: block;
      margin-bottom: 2px;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 9pt;
      color: #64748b;
    }
    /* TOC Styles */
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px dotted #cbd5e1;
      font-size: 10pt;
    }
    .toc-item a {
      color: #1e293b;
      text-decoration: none;
      font-weight: 600;
    }
    .toc-item a:hover {
      color: #2563eb;
    }
    .toc-item.sub {
      padding-left: 20px;
      font-size: 9pt;
    }
    .toc-item.sub a {
      font-weight: 400;
      color: #475569;
    }
    .toc-num {
      font-weight: 700;
      color: #2563eb;
      width: 48px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>

  <!-- Floating Non-Printable Header -->
  <div class="no-print toolbar">
    <div class="toolbar-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
      <span>Ordomática — ${escapeHtml(matchInfo.homeTeam)} vs ${escapeHtml(matchInfo.awayTeam)}</span>
    </div>
    <div class="toolbar-actions">
      <span style="font-size: 11px; opacity: 0.8; margin-right: 8px;">
        ${isEs ? 'Consejo: Active "Gráficos de fondo" en las opciones de impresión' : 'Tip: Enable "Background graphics" in print options'}
      </span>
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ ${isEs ? 'Imprimir / Guardar como PDF' : 'Print / Save as PDF'}
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✕ ${isEs ? 'Cerrar' : 'Close'}
      </button>
    </div>
  </div>

  <!-- PÁGINA 1: PORTADA -->
  <div class="page page-break">
    <div class="cover-container">
      <div class="cover-header">
        <svg class="cover-logo" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <div class="cover-title">ORDOMÁTICA</div>
        <div class="cover-subtitle">${isEs ? 'Informe Oficial de Análisis de Partido' : 'Official Match Analysis Report'}</div>
        <div class="cover-flavour">Ordomachine — Flavour Match Soccer MVP</div>
      </div>

      <div class="cover-match-box">
        <div class="cover-teams">
          <span>${escapeHtml(matchInfo.homeTeam)}</span>
          <span class="cover-score">${escapeHtml(matchInfo.score)}</span>
          <span>${escapeHtml(matchInfo.awayTeam)}</span>
        </div>

        <div class="cover-meta-grid">
          <div class="cover-meta-item">
            <strong>${isEs ? 'Competición' : 'Competition'}</strong>
            ${escapeHtml(matchInfo.competition)}
          </div>
          <div class="cover-meta-item">
            <strong>${isEs ? 'Fase / Jornada' : 'Stage / Round'}</strong>
            ${escapeHtml(matchInfo.stage)}
          </div>
          <div class="cover-meta-item">
            <strong>${isEs ? 'Fecha del Partido' : 'Match Date'}</strong>
            ${escapeHtml(matchInfo.date)}
          </div>
          <div class="cover-meta-item">
            <strong>${isEs ? 'Estadio / Sede' : 'Stadium / Venue'}</strong>
            ${escapeHtml(matchInfo.venue)}
          </div>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #64748b; word-break: break-all; text-align: left;">
          <strong>${isEs ? 'URL Fuente de Datos:' : 'Source Data URL:'}</strong><br>
          ${escapeHtml(sourceUrl)}
        </div>
      </div>

      <div class="cover-footer">
        <p style="text-align: center; margin-bottom: 6px;">
          <strong>${isEs ? 'Autor:' : 'Author:'}</strong> Carlos Cano Alegre ·
          <strong>${isEs ? 'Dominio:' : 'Domain:'}</strong> <a href="https://carloscanoalegre.com" target="_blank" style="color: #2563eb; text-decoration: underline;">carloscanoalegre.com</a> ·
          <strong>GitHub:</strong> <a href="https://github.com/carloscanale81/ordomati" target="_blank" style="color: #2563eb; text-decoration: underline;">github.com/carloscanale81/ordomati</a>
        </p>
        <p style="text-align: center; margin-bottom: 4px;">
          <strong>${isEs ? 'Fecha de Emisión:' : 'Issued Date:'}</strong> ${escapeHtml(generatedDateStr)}
        </p>
        <p style="text-align: center; font-size: 8pt; color: #94a3b8;">
          ${isEs ? 'Documento técnico generado mediante Ordomática v2.0 · Licencia CC BY-NC 4.0 (Atribución - No Comercial) · Prohibida la explotación lucrativa sin autorización previa' : 'Technical report generated by Ordomática v2.0 · CC BY-NC 4.0 License (Attribution - NonCommercial) · Lucrative use prohibited without prior permission'}
        </p>
      </div>
    </div>
  </div>

  <!-- PÁGINA 2: MARCO TEÓRICO Y LEGAL -->
  <div class="page page-break">
    <h2>${isEs ? 'Fundamentos Teóricos y Aviso Legal' : 'Theoretical Foundations & Legal Notice'}</h2>
    
    <div style="margin-top: 24px; space-y: 18px;">
      <div style="margin-bottom: 20px;">
        <h3>${isEs ? '1. Marco Teórico y Referencia Académica' : '1. Theoretical Framework & Academic Reference'}</h3>
        <p>
          ${isEs
            ? 'El presente informe se fundamenta en el marco metodológico y formal de la <strong>Tesis Doctoral sobre Ordomática: Modelado y Agregación de Preferencias Basado en Matrices de Afinidad Contextual, Vectores de Valores Propios y Operadores OWA Dinámicamente Ponderados</strong>. La arquitectura matemática permite capturar de manera integral las interacciones no lineales, de sinergia y bloqueo existentes entre los actores de una red compleja de interacción deportiva, proyectando el rendimiento táctico individual sobre el contexto global del colectivo.'
            : 'This report is based on the methodological and formal framework of the <strong>Doctoral Thesis on Ordomatics: Modeling and Aggregation of Preferences Based on Contextual Affinity Matrices, Eigenvalues, and Dynamically Weighted OWA Operators</strong>. The mathematical architecture captures non-linear synergy and blocking interactions between actors in complex sports networks, evaluating individual tactical performance projected onto team dynamics.'}
        </p>
        <p>
          ${isEs
            ? 'A diferencia de los enfoques estadísticos clásicos basados exclusivamente en conteos acumulativos directos, el análisis ordomático cuantifica el valor propio ($VP$) de cada jugador mediante la correspondencia autoconvectiva en la matriz de afinidad contextual ($A^C$), garantizando una evaluación ajustada al tiempo efectivo de juego de cada segmento táctico y a la influencia interdimensional cruzada.'
            : 'Unlike classical statistical models based solely on cumulative discrete counts, the ordomatic approach quantifies the eigenvalue ($VP$) of each player through self-convective mapping within the contextual affinity matrix ($A^C$), ensuring normalization by effective playing time across tactical segments and cross-dimensional influence.'}
        </p>
        <p style="margin-top: 10px; font-size: 8.5pt; color: #334155; line-height: 1.5; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          ${isEs
            ? '<strong>Referencias académicas oficiales de la Tesis:</strong><br/>'
              + '• Sistema TESEO (Ministerio de Ciencia e Innovación): <a href="https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle" target="_blank" style="color: #2563eb; text-decoration: underline;">https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle</a><br/>'
              + '• Repositorio BULERIA (Biblioteca Universidad de León): <a href="https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8" target="_blank" style="color: #2563eb; text-decoration: underline;">https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8</a>'
            : '<strong>Official Academic Thesis References:</strong><br/>'
              + '• TESEO System (Ministry of Science and Innovation): <a href="https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle" target="_blank" style="color: #2563eb; text-decoration: underline;">https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle</a><br/>'
              + '• BULERIA Repository (University of León Library): <a href="https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8" target="_blank" style="color: #2563eb; text-decoration: underline;">https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8</a>'}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3>${isEs ? '2. Licencia de Uso y Propiedad Intelectual' : '2. Terms of Use & Intellectual Property'}</h3>
        <p>
          ${isEs
            ? '<strong>Licencia Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0).</strong> © Carlos Cano Alegre (<a href="https://carloscanoalegre.com" target="_blank" style="color: #2563eb; text-decoration: underline;">carloscanoalegre.com</a>). Se autoriza la reproducción, distribución y adaptación no lucrativa de esta obra y de sus resultados siempre que se proporcione el crédito correspondiente a su autor original, con enlace a su licencia y especificando los cambios realizados. Queda expresamente prohibido su uso o explotación comercial con fines lucrativos sin autorización previa por escrito del autor.'
            : '<strong>Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License.</strong> © Carlos Cano Alegre (<a href="https://carloscanoalegre.com" target="_blank" style="color: #2563eb; text-decoration: underline;">carloscanoalegre.com</a>). Reproduction, distribution, and non-commercial adaptation are permitted provided that appropriate attribution is given to the author, with a link to the license and noting any changes. Any commercial or lucrative exploitation without prior written consent of the author is strictly prohibited.'}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3>${isEs ? '3. Reproducibilidad del Análisis' : '3. Analysis Reproducibility'}</h3>
        <p>
          ${isEs
            ? 'Para contrastar, reproducir o auditar las formulaciones matemáticas y la ejecución algorítmica que han dado lugar a este informe, se puede acceder al repositorio oficial de código abierto del proyecto en:'
            : 'To replicate, audit, or review the mathematical formulations and algorithmic execution that generated this report, access the official project open-source repository at:'}
        </p>
        <p style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 9.5pt; color: #1e3a8a; border: 1px solid #cbd5e1;">
          <a href="https://github.com/carloscanale81/ordomati" target="_blank" style="color: #1e3a8a; text-decoration: none;">https://github.com/carloscanale81/ordomati</a>
        </p>
        <p style="font-size: 9pt; color: #64748b; margin-top: 6px;">
          ${isEs ? 'Dominio web del autor:' : 'Author website domain:'} <a href="https://carloscanoalegre.com" target="_blank" style="color: #2563eb; text-decoration: underline;">carloscanoalegre.com</a>
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3>${isEs ? '4. Uso de Datos de Origen y Finalidad Académica' : '4. Source Data Notice & Academic Purpose'}</h3>
        <p>
          ${isEs
            ? `Se hace constar expresamente que los datos de eventos y métricas de este encuentro han sido extraídos de la fuente de referencia en la URL <code>${escapeHtml(sourceUrl)}</code> con fines <strong>exclusivamente académicos, científicos y docentes</strong>, bajo la doctrina de uso legítimo de información para investigación científica independiente, sin que exista relación o afiliación con los proveedores originales de dichos datos.`
            : `It is expressly stated that the event data and match metrics were extracted from the reference URL <code>${escapeHtml(sourceUrl)}</code> for <strong>strictly academic, scientific, and educational purposes</strong> under fair use principles for independent scientific research.`}
        </p>
      </div>
    </div>
  </div>

  <!-- PÁGINA 3: ÍNDICE DE CONTENIDOS -->
  <div class="page page-break">
    <h2>${isEs ? 'Índice de Contenidos' : 'Table of Contents'}</h2>
    <ul class="toc-list">
      ${tocEntries
        .map(entry => {
          const isSub = entry.num.includes('.');
          return `
            <li class="toc-item ${isSub ? 'sub' : ''}">
              <span class="toc-num">${entry.num}</span>
              <a href="#${entry.id}">${escapeHtml(entry.title)}</a>
            </li>
          `;
        })
        .join('')}
    </ul>
  </div>

  <!-- SECCIÓN 1: CONFIGURACIÓN GENERAL DEL ANÁLISIS -->
  <div class="page page-break" id="sec-config">
    <h2>1. ${isEs ? 'Configuración General del Análisis' : 'General Analysis Configuration'}</h2>
    
    <div id="sec-config-funcs" style="margin-bottom: 20px;">
      <h3>1.1 ${isEs ? 'Funciones de Propagación, Bloqueo, Sinergia y Ajustes' : 'Propagation, Blocking, Synergy & Adjustment Functions'}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isEs ? 'Parámetro de Configuración' : 'Configuration Parameter'}</th>
            <th>${isEs ? 'Tipo / Función Seleccionada' : 'Type / Selected Function'}</th>
            <th>${isEs ? 'Descripción Formal' : 'Formal Description'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${isEs ? 'Función de Propagación' : 'Propagation Function'}</strong></td>
            <td><code>${escapeHtml(config.propagationConfig.type)}</code></td>
            <td>${isEs ? 'Diagonal = 1, elementos fuera de diagonal = d(i,j) / d_max' : 'Diagonal = 1, off-diagonal = d(i,j) / d_max'}</td>
          </tr>
          <tr>
            <td><strong>${isEs ? 'Función de Bloqueo' : 'Blocking Function'}</strong></td>
            <td><code>${escapeHtml(config.blockingConfig.type)}</code></td>
            <td>${isEs ? 'Sin bloqueo (propagación continua sin atenuación por corte)' : 'No blocking (continuous propagation without threshold cutoff)'}</td>
          </tr>
          <tr>
            <td><strong>${isEs ? 'Ajuste por Equiparación' : 'Equalization Adjustment'}</strong></td>
            <td><code>${escapeHtml(config.equalizationConfig.type)}</code></td>
            <td>${isEs ? 'Ajuste relativo al valor máximo del vector propio de cada dimensión' : 'Normalization relative to maximum eigenvalue per dimension'}</td>
          </tr>
          <tr>
            <td><strong>${isEs ? 'Ajuste Relativo' : 'Relative Adjustment'}</strong></td>
            <td><code>${escapeHtml(config.relativeConfig.type)}</code></td>
            <td>${isEs ? 'Sin ajuste relativo adicional' : 'No additional relative adjustment'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="sec-config-owa" style="margin-bottom: 20px;">
      <h3>1.2 ${isEs ? 'Perfil de Referencia (Operador OWA)' : 'Reference Profile (OWA Operator)'}</h3>
      <p style="font-size: 9.5pt; color: #475569;">
        ${isEs
          ? `Perfil seleccionado: <strong>${escapeHtml(config.owaConfig.type)}</strong>. Los pesos ordenados determinan el grado de compensación u optimismo en la agregación multicriterio:`
          : `Selected profile: <strong>${escapeHtml(config.owaConfig.type)}</strong>. Ordered weights define compensation or optimism in multi-criteria aggregation:`}
      </p>
      <table class="data-table" style="table-layout: fixed;">
        <thead>
          <tr>
            ${config.owaConfig.weights.map((_, i) => `<th style="text-align: center;">w${i + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${config.owaConfig.weights.map(w => `<td class="num" style="text-align: center;">${fmtNum(w, 4)}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div id="sec-config-matrix" style="margin-bottom: 20px;">
      <h3>1.3 ${isEs ? 'Matriz de Afinidad Interdimensional (C)' : 'Interdimensional Affinity Matrix (C)'}</h3>
      <p style="font-size: 9pt; color: #475569;">
        ${isEs ? 'Afinidad conceptual entre las 12 dimensiones del juego analizadas:' : 'Conceptual affinity across the 12 tactical dimensions:'}
      </p>
      <table class="matrix-table">
        <thead>
          <tr>
            <th></th>
            ${SOCCER_CONCEPTS.map((c, i) => `<th title="${escapeHtml(c.name)}">D${i + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${config.dimAffinityMatrix
            .map((row, i) => {
              const cells = row
                .map((val, j) => {
                  const isDiag = i === j;
                  const isHigh = val >= 0.7 && !isDiag;
                  return `<td class="${isDiag ? 'diag' : isHigh ? 'high' : ''}">${fmtNum(val, 2)}</td>`;
                })
                .join('');
              return `<tr><th>D${i + 1}</th>${cells}</tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>

    <div id="sec-config-graph" class="avoid-break" style="margin-top: 24px;">
      <h3>1.4 ${isEs ? 'Grafo de Afinidad entre Dimensiones' : 'Dimension Affinity Graph'}</h3>
      ${renderDimensionAffinityGraphSvg(config.dimAffinityMatrix)}
    </div>
  </div>

  <!-- SECCIÓN 2: ANÁLISIS SEGMENTADO DEL PARTIDO -->
  <div class="page page-break" id="sec-segmented">
    <h2>2. ${isEs ? 'Análisis Segmentado del Partido' : 'Segmented Match Analysis'}</h2>

    <div id="sec-seg-timeline" style="margin-bottom: 24px;">
      <h3>2.1 ${isEs ? 'Segmentación Temporal del Encuentro' : 'Match Timeline & Segments'}</h3>
      <p style="font-size: 9.5pt; color: #475569;">
        ${isEs
          ? 'El partido se fragmenta en intervalos tácticos delimitados por sustituciones, goles o expulsiones:'
          : 'The match is segmented into tactical intervals bounded by substitutions, goals, or red cards:'}
      </p>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isEs ? 'Equipo' : 'Team'}</th>
            <th>${isEs ? 'Intervalo' : 'Interval'}</th>
            <th>${isEs ? 'Duración' : 'Duration'}</th>
            <th>${isEs ? 'Periodo' : 'Period'}</th>
            <th>${isEs ? 'Motivo Desencadenante' : 'Trigger Event'}</th>
            <th>${isEs ? 'MVP del Segmento' : 'Segment MVP'}</th>
          </tr>
        </thead>
        <tbody>
          ${segmentReports
            .map(sr => {
              const s = sr.segment;
              const reasonText = s.startReason
                ? `${s.startReason.type === 'goal' ? '⚽ ' : s.startReason.type === 'sub' ? '⇄ ' : '🟥 '}${s.startReason.description}`
                : isEs ? 'Inicio del Periodo' : 'Period Start';
              return `
                <tr>
                  <td><strong>${escapeHtml(s.teamName)}</strong></td>
                  <td>${s.startMinute}' – ${s.endMinute}'</td>
                  <td class="num">${s.duration}'</td>
                  <td>${escapeHtml(s.periodName)}</td>
                  <td>${escapeHtml(reasonText)}</td>
                  <td><span class="badge badge-green">${escapeHtml(sr.mvp?.name || '-')}</span></td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>

    <div id="sec-seg-details">
      <h3>2.2 ${isEs ? 'Desglose Pormenorizado por Segmento' : 'Detailed Segment Breakdown'}</h3>
      <p style="font-size: 9.5pt; color: #475569; margin-bottom: 20px;">
        ${isEs
          ? 'A continuación se presenta para cada intervalo táctico la alineación de jugadores activos, la matriz de afinidad contextual y la agregación OWA:'
          : 'The following section details for each interval the active lineup, contextual affinity matrix, and OWA aggregation:'}
      </p>
    </div>
  </div>

  <!-- SUBSECCIONES POR SEGMENTO -->
  ${segmentReports
    .map((sr, idx) => {
      const s = sr.segment;
      const players = s.activePlayers || [];
      const primaryAnalysis = sr.dimAnalyses[0];
      const AC = primaryAnalysis?.AC || [];
      const distMatrix = primaryAnalysis?.distMatrix || [];
      const scores: number[] = sr.aggAnalysis?.scores || [];
      const ranking: number[] = sr.aggAnalysis?.ranking || [];

      // Sort players by aggregated ranking descending
      const rankedPlayers = ranking
        .map(i => ({ player: players[i], score: scores[i], originalIdx: i }))
        .filter(x => x.player !== undefined);

      return `
        <div class="page page-break" id="sec-seg-${s.id}">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px;">
            <div>
              <span class="badge ${s.team === 'home' ? 'badge-blue' : 'badge-green'}">${escapeHtml(s.teamName)}</span>
              <h3 style="display: inline; margin-left: 8px;">
                ${isEs ? 'Segmento' : 'Segment'} ${idx + 1}: ${s.startMinute}' – ${s.endMinute}' (${s.duration} min)
              </h3>
            </div>
            <div>
              <span style="font-size: 10pt; color: #64748b;">${escapeHtml(s.periodName)}</span>
            </div>
          </div>

          ${
            s.startReason
              ? `<p style="font-size: 10pt; background: #f8fafc; padding: 6px 12px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 12px;">
                  <strong>${isEs ? 'Motivo del Segmento:' : 'Segment Trigger:'}</strong> ${escapeHtml(s.startReason.description)}
                </p>`
              : ''
          }

          <!-- Ranking & Scores Table -->
          <div class="avoid-break" style="margin-bottom: 16px;">
            <h4>${isEs ? 'Puntuaciones Agregadas OWA y MVP del Segmento' : 'OWA Aggregated Scores & Segment MVP'}</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">${isEs ? 'Pos' : 'Rank'}</th>
                  <th style="width: 45px; text-align: center;">#</th>
                  <th>${isEs ? 'Jugador' : 'Player'}</th>
                  <th style="width: 60px;">${isEs ? 'Demarcación' : 'Pos'}</th>
                  <th style="width: 80px; text-align: right;">${isEs ? 'Puntuación' : 'Score'}</th>
                  <th style="width: 100px; text-align: center;">${isEs ? 'Distinción' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                ${rankedPlayers
                  .map((rp, rIdx) => {
                    const isMvp = rIdx === 0;
                    return `
                      <tr ${isMvp ? 'style="background: #ecfdf5; font-weight: bold;"' : ''}>
                        <td style="text-align: center;">${rIdx + 1}</td>
                        <td style="text-align: center;">${rp.player.shirtNo || '-'}</td>
                        <td>${escapeHtml(rp.player.name)}</td>
                        <td>${escapeHtml(rp.player.position)}</td>
                        <td class="num">${fmtNum(rp.score, 4)}</td>
                        <td style="text-align: center;">
                          ${isMvp ? `<span class="badge badge-green">MVP</span>` : ''}
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Contextual Affinity Pitch Graph SVG -->
          <div class="avoid-break" style="margin-bottom: 16px;">
            <h4>${isEs ? 'Grafo de Afinidad Contextual sobre Terreno de Juego' : 'Contextual Affinity Pitch Graph'}</h4>
            ${renderPitchGraphSvg(players, AC, s.team, s.teamName, s.team === 'home' ? timeline.homeCrestUrl : timeline.awayCrestUrl)}
          </div>

          <!-- Contextual Affinity Matrix Table -->
          <div class="avoid-break" style="margin-bottom: 16px;">
            <h4>${isEs ? 'Matriz de Afinidad Contextual (A^C)' : 'Contextual Affinity Matrix (A^C)'}</h4>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th></th>
                  ${players.map(p => `<th title="${escapeHtml(p.name)}">${p.shirtNo || p.name.slice(0, 3)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${AC.map((row: number[], i: number) => {
                  const pFrom = players[i];
                  const cells = row
                    .map((val: number, j: number) => {
                      const isDiag = i === j;
                      const isHigh = val >= 0.7 && !isDiag;
                      return `<td class="${isDiag ? 'diag' : isHigh ? 'high' : ''}">${fmtNum(val, 2)}</td>`;
                    })
                    .join('');
                  return `<tr><th title="${escapeHtml(pFrom?.name || '')}">${pFrom?.shirtNo || ''}</th>${cells}</tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Raw Distance Matrix Table -->
          <div class="avoid-break">
            <h4>${isEs ? 'Matriz de Distancias Tácticas (D)' : 'Tactical Distance Matrix (D)'}</h4>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th></th>
                  ${players.map(p => `<th title="${escapeHtml(p.name)}">${p.shirtNo || p.name.slice(0, 3)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${distMatrix.map((row: number[], i: number) => {
                  const pFrom = players[i];
                  const cells = row
                    .map((val: number, j: number) => {
                      const isDiag = i === j;
                      return `<td class="${isDiag ? 'diag' : ''}">${fmtNum(val, 2)}</td>`;
                    })
                    .join('');
                  return `<tr><th title="${escapeHtml(pFrom?.name || '')}">${pFrom?.shirtNo || ''}</th>${cells}</tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join('')}

  <!-- SECCIÓN 3: ANÁLISIS INTEGRADO DEL PARTIDO -->
  <div class="page page-break" id="sec-integrated">
    <h2>3. ${isEs ? 'Análisis Integrado (Resultado Final del Partido)' : 'Integrated Analysis (Final Outcome)'}</h2>
    <p style="font-size: 9.5pt; color: #475569; margin-bottom: 20px;">
      ${isEs
        ? 'El análisis integrado agrega el rendimiento de cada futbolista a lo largo de todos los segmentos disputados, ponderando la puntuación OWA por la duración efectiva en el terreno de juego hasta el pitido final (minuto 120):'
        : 'The integrated analysis accumulates the performance of each player across all segments played, weighting the OWA score by effective pitch duration until the final whistle (minute 120):'}
    </p>

    <!-- Honours Board (MVPs) -->
    <div id="sec-int-mvp" class="avoid-break" style="margin-bottom: 24px;">
      <h3>3.1 ${isEs ? 'Cuadro de Honor y Jugadores Más Valiosos' : 'Honors Board & Most Valuable Players'}</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 10px;">
        <div style="background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 14px; text-align: center;">
          <span class="badge badge-green" style="margin-bottom: 6px;">${isEs ? 'MVP DEL PARTIDO' : 'MATCH MVP'}</span>
          <div style="font-size: 13pt; font-weight: 800; color: #065f46; margin: 4px 0;">
            ${escapeHtml(integralResult?.matchMvp?.player?.name || '-')}
          </div>
          <div style="font-size: 9pt; color: #047857;">
            ${escapeHtml(integralResult?.matchMvp?.player?.position || '')} · ${integralResult?.matchMvp?.team === 'home' ? escapeHtml(matchInfo.homeTeam) : escapeHtml(matchInfo.awayTeam)}
          </div>
        </div>

        <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 14px; text-align: center;">
          <span class="badge badge-blue" style="margin-bottom: 6px;">${isEs ? 'MVP LOCAL' : 'HOME MVP'}</span>
          <div style="font-size: 13pt; font-weight: 800; color: #1e40af; margin: 4px 0;">
            ${escapeHtml(integralResult?.homeMvp?.player?.name || '-')}
          </div>
          <div style="font-size: 9pt; color: #1d4ed8;">
            ${escapeHtml(matchInfo.homeTeam)}
          </div>
        </div>

        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center;">
          <span class="badge badge-amber" style="margin-bottom: 6px;">${isEs ? 'MVP VISITANTE' : 'AWAY MVP'}</span>
          <div style="font-size: 13pt; font-weight: 800; color: #92400e; margin: 4px 0;">
            ${escapeHtml(integralResult?.awayMvp?.player?.name || '-')}
          </div>
          <div style="font-size: 9pt; color: #b45309;">
            ${escapeHtml(matchInfo.awayTeam)}
          </div>
        </div>
      </div>
    </div>

    <!-- Final Cumulative Scores Table -->
    <div id="sec-int-rankings" class="avoid-break" style="margin-bottom: 24px;">
      <h3>3.2 ${isEs ? 'Clasificación Final Acumulada de Jugadores' : 'Final Cumulative Player Rankings'}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>${isEs ? 'Jugador' : 'Player'}</th>
            <th>${isEs ? 'Equipo' : 'Team'}</th>
            <th style="width: 60px;">${isEs ? 'Posición' : 'Pos'}</th>
            <th style="width: 80px; text-align: right;">${isEs ? 'Minutos' : 'Minutes'}</th>
            <th style="width: 90px; text-align: right;">${isEs ? 'Punt. Acum.' : 'Cum. Score'}</th>
            <th style="width: 80px; text-align: center;">${isEs ? 'Distinción' : 'Award'}</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const getMinutesPlayed = (player: MatchPlayer, team: 'home' | 'away'): number => {
              const segs = team === 'home' ? timeline.homeSegments : timeline.awaySegments;
              return segs
                .filter(s => s.activePlayers.some(ap => ap.id === player.id || ap.name === player.name))
                .reduce((sum, s) => sum + s.duration, 0);
            };

            const allPlayers = [
              ...(integralResult?.homePlayers || []).map(p => ({
                ...p,
                teamLabel: matchInfo.homeTeam,
                minutesPlayed: getMinutesPlayed(p.player, 'home')
              })),
              ...(integralResult?.awayPlayers || []).map(p => ({
                ...p,
                teamLabel: matchInfo.awayTeam,
                minutesPlayed: getMinutesPlayed(p.player, 'away')
              }))
            ];
            allPlayers.sort((a, b) => b.cumulativeScore - a.cumulativeScore);

            return allPlayers
              .map((p, i) => {
                const isMatchMvp = p.player.id === integralResult?.matchMvp?.player?.id;
                return `
                  <tr ${isMatchMvp ? 'style="background: #ecfdf5; font-weight: bold;"' : ''}>
                    <td style="text-align: center;">${i + 1}</td>
                    <td>${escapeHtml(p.player.name)}</td>
                    <td>${escapeHtml(p.teamLabel)}</td>
                    <td>${escapeHtml(p.player.position)}</td>
                    <td class="num">${p.minutesPlayed}'</td>
                    <td class="num">${fmtNum(p.cumulativeScore, 4)}</td>
                    <td style="text-align: center;">
                      ${isMatchMvp ? `<span class="badge badge-green">MVP</span>` : ''}
                    </td>
                  </tr>
                `;
              })
              .join('');
          })()}
        </tbody>
      </table>
    </div>

    <!-- Cumulative Affinity Matrices & Pitch Graphs -->
    <div id="sec-int-affinity" class="avoid-break">
      <h3>3.3 ${isEs ? 'Matrices de Afinidad Contextual Acumuladas al Final del Partido' : 'Final Cumulative Contextual Affinity Matrices'}</h3>
      
      <!-- Home Cumulative Pitch -->
      ${
        homeFinalAffinity && homeFinalAffinity.players.length > 0
          ? `
            <div style="margin-top: 14px;">
              <h4>${escapeHtml(matchInfo.homeTeam)} — ${isEs ? 'Afinidad Contextual Acumulada Final' : 'Final Cumulative Contextual Affinity'}</h4>
              ${renderPitchGraphSvg(homeFinalAffinity.players, homeFinalAffinity.AC_cum, 'home', matchInfo.homeTeam, timeline.homeCrestUrl)}
              <table class="matrix-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th></th>
                    ${homeFinalAffinity.players.map(p => `<th title="${escapeHtml(p.name)}">${p.shirtNo || p.name.slice(0, 3)}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${homeFinalAffinity.AC_cum.map((row: number[], i: number) => {
                    const p = homeFinalAffinity!.players[i];
                    const cells = row.map((v: number, j: number) => `<td class="${i === j ? 'diag' : v >= 0.7 ? 'high' : ''}">${fmtNum(v, 2)}</td>`).join('');
                    return `<tr><th>${p?.shirtNo || ''}</th>${cells}</tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `
          : ''
      }

      <!-- Away Cumulative Pitch -->
      ${
        awayFinalAffinity && awayFinalAffinity.players.length > 0
          ? `
            <div style="margin-top: 24px;">
              <h4>${escapeHtml(matchInfo.awayTeam)} — ${isEs ? 'Afinidad Contextual Acumulada Final' : 'Final Cumulative Contextual Affinity'}</h4>
              ${renderPitchGraphSvg(awayFinalAffinity.players, awayFinalAffinity.AC_cum, 'away', matchInfo.awayTeam, timeline.awayCrestUrl)}
              <table class="matrix-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th></th>
                    ${awayFinalAffinity.players.map(p => `<th title="${escapeHtml(p.name)}">${p.shirtNo || p.name.slice(0, 3)}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${awayFinalAffinity.AC_cum.map((row: number[], i: number) => {
                    const p = awayFinalAffinity!.players[i];
                    const cells = row.map((v: number, j: number) => `<td class="${i === j ? 'diag' : v >= 0.7 ? 'high' : ''}">${fmtNum(v, 2)}</td>`).join('');
                    return `<tr><th>${p?.shirtNo || ''}</th>${cells}</tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `
          : ''
      }
    </div>
  </div>

  <script>
    // Automatic print dialog trigger when opened in new window/tab
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print skipped', e);
        }
      }, 700);
    });
  </script>
</body>
</html>
`;
}

/**
 * Triggers opening or printing of the Soccer PDF report in a new browser window/tab,
 * falling back to an HTML file download if popups are blocked.
 */
export function openSoccerPdfReport(options: SoccerReportOptions): void {
  const html = generateSoccerPdfReportHtml(options);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // If popups are blocked, download HTML file directly
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_ordomatica_${options.matchInfo.homeTeam}_vs_${options.matchInfo.awayTeam}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

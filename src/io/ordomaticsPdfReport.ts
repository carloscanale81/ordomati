import { OrdomaticaDataset, OrdomaticaCalculationResult } from '../logic/types';

export interface OrdomaticsReportOptions {
  dataset: OrdomaticaDataset;
  calculation: OrdomaticaCalculationResult;
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

function fmtNum(val: number | undefined | null, prec: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val).toFixed(prec);
}

/**
 * Builds printable standalone HTML for the generic Ordomatics Case Report.
 */
export function generateOrdomaticsPdfReportHtml(options: OrdomaticsReportOptions): string {
  const { dataset, calculation, language } = options;
  const isEs = language === 'es';
  const prec = dataset.decimalPrecision ?? 2;
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(isEs ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const { elements, characteristics } = dataset;
  const { chars, agg } = calculation;
  const aggregableChars = characteristics.filter(c => c.type !== 'adjustment');
  const aggregableIndices = characteristics.map((c, i) => (c.type !== 'adjustment' ? i : -1)).filter(i => i !== -1);
  const n = elements.length;
  const m = aggregableChars.length;

  const topIdx = agg.ranking && agg.ranking.length > 0 ? agg.ranking[0] : 0;
  const topElement = elements[topIdx] || 'N/A';
  const topScore = agg.A_final && agg.A_final[topIdx] !== undefined ? agg.A_final[topIdx] : 0;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <title>${isEs ? 'Informe Ordomática' : 'Ordomatics Report'} — ${escapeHtml(topElement)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-size: 8pt;
        color: #6b7280;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.45;
    }

    .report-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      color: #2563eb;
    }

    .brand-title {
      font-size: 17pt;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #1e3a8a;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4b5563;
      margin-top: 2px;
    }

    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #6b7280;
      line-height: 1.35;
    }

    .meta-date {
      font-weight: 600;
      color: #1f2937;
    }

    .legal-banner {
      margin-top: 10px;
      padding: 6px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .legal-banner a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }

    .license-badge {
      display: inline-block;
      padding: 1px 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      color: #1e40af;
      font-weight: 700;
      font-size: 7pt;
    }

    /* Executive Summary Hero */
    .summary-hero {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .hero-winner {
      flex: 2;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .hero-winner-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 9999px;
      margin-bottom: 4px;
    }

    .hero-winner-name {
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .hero-winner-score {
      font-size: 10pt;
      font-weight: 600;
      opacity: 0.92;
      margin-top: 4px;
    }

    .hero-stats {
      flex: 1.3;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .stat-val {
      font-size: 16pt;
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1;
    }

    .stat-lbl {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 3px;
    }

    /* Section Styles */
    .section {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1e3a8a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-badge {
      font-size: 7.5pt;
      padding: 1px 6px;
      border-radius: 4px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6px;
    }

    th, td {
      padding: 5px 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    tr:nth-child(even) td {
      background: #fcfdfe;
    }

    .num-col {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
    }

    .center-col {
      text-align: center;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-weight: 800;
      font-size: 7.5pt;
    }

    .rank-1 { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .rank-2 { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .rank-3 { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    .rank-other { background: #f8fafc; color: #64748b; }

    /* Characteristic mini block */
    .char-block {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .char-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }

    .char-name {
      font-size: 9.5pt;
      font-weight: 800;
      color: #1e3a8a;
    }

    .char-tag {
      font-size: 7pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: #eff6ff;
      color: #2563eb;
    }

    .matrix-mini {
      font-size: 7.5pt;
      margin-top: 6px;
    }

    .matrix-mini th, .matrix-mini td {
      padding: 3px 5px;
      font-size: 7pt;
      text-align: center;
    }

    .matrix-mini td.diag {
      background: #eff6ff;
      font-weight: 700;
      color: #1d4ed8;
    }

    .progress-bar-bg {
      background: #e2e8f0;
      border-radius: 9999px;
      height: 6px;
      width: 100%;
      overflow: hidden;
    }

    .progress-bar-fill {
      background: #2563eb;
      height: 100%;
      border-radius: 9999px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- REPORT HEADER -->
  <header class="report-header">
    <div class="header-top">
      <div class="brand-group">
        <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <div>
          <h1 class="brand-title">ORDOMÁTICA</h1>
          <div class="brand-subtitle">${isEs ? 'Informe de Análisis y Decisión Multicriterio' : 'Multi-Criteria Decision & Analysis Report'}</div>
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-date">${escapeHtml(dateFormatted)}</div>
        <div>${isEs ? 'Versión del Sistema' : 'System Version'}: <strong>v1.0.0</strong></div>
        <div>${isEs ? 'Precisión Decimal' : 'Decimal Precision'}: <strong>${prec}</strong></div>
      </div>
    </div>

    <div class="legal-banner">
      <div>
        <span>${isEs ? 'Autoría e Investigación' : 'Author & Research'}: <strong>Carlos Cano Alegre</strong></span>
        &bull; <a href="https://carloscanoalegre.com" target="_blank" rel="noopener noreferrer">carloscanoalegre.com</a>
        &bull; <a href="https://github.com/carloscanale81/ordomati" target="_blank" rel="noopener noreferrer">github.com/carloscanale81/ordomati</a>
        &bull; <a href="https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">TESEO</a>
        &bull; <a href="https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">BULERIA (ULe)</a>
      </div>
      <div>
        <span class="license-badge">CC BY-NC 4.0</span>
        <span style="font-size: 7pt; margin-left: 4px;">${isEs ? 'Atribución - No Comercial' : 'Attribution - NonCommercial'}</span>
      </div>
    </div>
  </header>

  <!-- EXECUTIVE SUMMARY HERO -->
  <section class="summary-hero">
    <div class="hero-winner">
      <span class="hero-winner-badge">🏆 ${isEs ? 'Alternativa Ganadora (Ranking #1)' : 'Top Alternative (Ranking #1)'}</span>
      <div class="hero-winner-name">${escapeHtml(topElement)}</div>
      <div class="hero-winner-score">${isEs ? 'Puntuación Final Agregada' : 'Final Aggregated Score'}: <strong>${fmtNum(topScore, prec)}</strong></div>
    </div>

    <div class="hero-stats">
      <div class="stat-card">
        <div class="stat-val">${n}</div>
        <div class="stat-lbl">${isEs ? 'Alternativas' : 'Alternatives'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${m}</div>
        <div class="stat-lbl">${isEs ? 'Dimensiones' : 'Dimensions'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${prec}</div>
        <div class="stat-lbl">${isEs ? 'Decimales' : 'Decimals'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">OWA</div>
        <div class="stat-lbl">${isEs ? 'Agregación' : 'Aggregation'}</div>
      </div>
    </div>
  </section>

  <!-- FASE 3: RANKING FINAL Y AGREGACIÓN MULTICRITERIO -->
  <section class="section">
    <h2 class="section-title">
      <span class="section-badge">FASE 3</span>
      ${isEs ? 'Resultados del Análisis Agregado y Clasificación Final' : 'Aggregated Analysis Results and Final Ranking'}
    </h2>

    <table>
      <thead>
        <tr>
          <th style="width: 45px;" class="center-col">${isEs ? 'Pos' : 'Rank'}</th>
          <th>${isEs ? 'Alternativa' : 'Alternative'}</th>
          <th class="num-col" style="width: 110px;">${isEs ? 'Puntuación Final' : 'Final Score'}</th>
          <th style="width: 180px;">${isEs ? 'Desempeño Relativo' : 'Relative Performance'}</th>
        </tr>
      </thead>
      <tbody>
        ${(agg.ranking || []).map((idx, rankOrder) => {
          const el = elements[idx] || `A${idx + 1}`;
          const score = agg.A_final?.[idx] ?? 0;
          const ratio = topScore > 0 ? Math.min(100, Math.max(0, (score / topScore) * 100)) : 0;
          const rankClass = rankOrder === 0 ? 'rank-1' : rankOrder === 1 ? 'rank-2' : rankOrder === 2 ? 'rank-3' : 'rank-other';

          return `
            <tr>
              <td class="center-col">
                <span class="rank-badge ${rankClass}">${rankOrder + 1}</span>
              </td>
              <td><strong>${escapeHtml(el)}</strong></td>
              <td class="num-col">${fmtNum(score, prec)}</td>
              <td>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${ratio}%;"></div>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </section>

  <!-- MATRIZ V (VALORES PROPIOS O CONTEXTUALES NORMALIZADOS) -->
  ${
    agg.V && agg.V.length > 0 && aggregableChars.length > 0
      ? `
      <section class="section">
        <h2 class="section-title">
          <span class="section-badge">FASE 3</span>
          ${isEs ? 'Matriz de Evaluación de Alternativas por Dimensión (V)' : 'Alternative Evaluation Matrix by Dimension (V)'}
        </h2>
        <table>
          <thead>
            <tr>
              <th>${isEs ? 'Alternativa' : 'Alternative'}</th>
              ${aggregableChars.map((c, j) => `<th class="num-col" title="${escapeHtml(c.name)}">${escapeHtml(c.name || `D${j + 1}`)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${elements.map((el, i) => `
              <tr>
                <td><strong>${escapeHtml(el)}</strong></td>
                ${aggregableChars.map((_, j) => `<td class="num-col">${fmtNum(agg.V[i]?.[j], prec)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      `
      : ''
  }

  <!-- MATRIZ DE AFINIDAD ENTRE DIMENSIONES C Y PESOS OWA -->
  ${
    dataset.cMatrix && dataset.cMatrix.length > 0 && aggregableChars.length > 0
      ? `
      <section class="section">
        <h2 class="section-title">
          <span class="section-badge">FASE 3</span>
          ${isEs ? 'Afinidad Interdimensional (C) y Operador OWA' : 'Interdimensional Affinity (C) and OWA Operator'}
        </h2>
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="flex: 2;">
            <table class="matrix-mini">
              <thead>
                <tr>
                  <th></th>
                  ${aggregableChars.map((c, j) => `<th title="${escapeHtml(c.name)}">${escapeHtml(c.name?.slice(0, 4) || `D${j + 1}`)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${aggregableChars.map((c, i) => `
                  <tr>
                    <th>${escapeHtml(c.name?.slice(0, 4) || `D${i + 1}`)}</th>
                    ${aggregableChars.map((_, j) => `<td class="${i === j ? 'diag' : ''}">${fmtNum(dataset.cMatrix[aggregableIndices[i]]?.[aggregableIndices[j]], 2)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="flex: 1;">
            <table>
              <thead>
                <tr>
                  <th>${isEs ? 'Posición OWA' : 'OWA Position'}</th>
                  <th class="num-col">${isEs ? 'Peso' : 'Weight'}</th>
                </tr>
              </thead>
              <tbody>
                ${aggregableChars.map((_, idx) => `
                  <tr>
                    <td><strong>w${idx + 1}</strong></td>
                    <td class="num-col">${fmtNum(dataset.owa[aggregableIndices[idx]], 4)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      `
      : ''
  }

  <!-- FASE 2: DETALLE DE DIMENSIONES Y VECTORES PROPIOS -->
  <section class="section" style="page-break-before: always;">
    <h2 class="section-title">
      <span class="section-badge">FASE 2</span>
      ${isEs ? 'Detalle Dimensional: Valores Propios (V^P) y Contextuales (V^C)' : 'Dimensional Detail: Own Values (V^P) and Contextual Values (V^C)'}
    </h2>

    ${chars.map((charCalc, cIdx) => {
      const char = characteristics[cIdx];
      const name = char?.name || `Dimensión ${cIdx + 1}`;
      const isAdjustment = char?.type === 'adjustment';
      const vp = charCalc.vp || [];
      const vc = charCalc.VC || [];

      return `
        <div class="char-block">
          <div class="char-header">
            <div>
              <span class="char-name">${cIdx + 1}. ${escapeHtml(name)}</span>
              <span style="font-size: 7.5pt; color: #6b7280; margin-left: 6px;">(${escapeHtml(char?.type || 'quantitative')})</span>
            </div>
            <span class="char-tag">${escapeHtml(isAdjustment ? (isEs ? 'AJUSTE' : 'ADJUSTMENT') : (char?.calcTarget?.toUpperCase() || 'VC'))}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>${isEs ? 'Alternativa' : 'Alternative'}</th>
                ${isAdjustment ? `
                  <th class="num-col">${isEs ? 'Valor' : 'Value'}</th>
                ` : `
                  <th class="num-col">${isEs ? 'Valor Propio (V^P)' : 'Own Value (V^P)'}</th>
                  <th class="num-col">${isEs ? 'Valor Contextual (V^C)' : 'Contextual Value (V^C)'}</th>
                `}
              </tr>
            </thead>
            <tbody>
              ${elements.map((el, i) => `
                <tr>
                  <td>${escapeHtml(el)}</td>
                  ${isAdjustment ? `
                    <td class="num-col">${fmtNum(vp[i], prec)}</td>
                  ` : `
                    <td class="num-col">${fmtNum(vp[i], prec)}</td>
                    <td class="num-col">${fmtNum(vc[i], prec)}</td>
                  `}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('')}
  </section>

  <script>
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
 * Opens or downloads the printable Ordomatics Case Report in a new window/tab.
 */
export function openOrdomaticsPdfReport(options: OrdomaticsReportOptions): void {
  const html = generateOrdomaticsPdfReportHtml(options);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `informe_ordomatica_${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

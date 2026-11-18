import { calculateOrdomatica } from '../logic/engine';
import { FlavourAnalysisCase, FlavourId, isFlavourId } from '../logic/flavours';
import { deserializeFullCase } from './serializer';

/**
 * Localized labels passed into the HTML report builder.
 */
export interface FlavourReportStrings {
  documentTitle: string;
  flavourLabel: string;
  flavourTitle: string;
  flavourDescription: string;
  generatedAtLabel: string;
  sourceUrlLabel: string;
  noUrlProvided: string;
  statusSectionTitle: string;
  statusConfigured: string;
  statusEmpty: string;
  rankingSectionTitle: string;
  rankColumn: string;
  elementColumn: string;
  scoreColumn: string;
  dimensionsSectionTitle: string;
  dimensionColumn: string;
  typeColumn: string;
  quantitativeLabel: string;
  qualitativeLabel: string;
  weightColumn: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

/**
 * Serializes a flavour analysis case into formatted JSON ready for download.
 */
export const serializeFlavourCase = (flavourCase: FlavourAnalysisCase): string => {
  const payload: FlavourAnalysisCase = {
    version: flavourCase.version || '1.0.0',
    flavour: flavourCase.flavour,
    ...(flavourCase.description ? { description: flavourCase.description } : {}),
    sourceUrl: flavourCase.sourceUrl ?? '',
    ...(flavourCase.matchDataJson ? { matchDataJson: flavourCase.matchDataJson } : {}),
    updatedAt: flavourCase.updatedAt || new Date().toISOString(),
    exportedAt: new Date().toISOString(),
    ...(flavourCase.dataset ? { dataset: flavourCase.dataset } : {}),
    ...(flavourCase.soccerModelConfig ? { soccerModelConfig: flavourCase.soccerModelConfig } : {})
  };
  return JSON.stringify(payload, null, 2);
};

/**
 * Parses and validates an imported JSON object into a FlavourAnalysisCase.
 * Supports dedicated flavour case files as well as standalone Ordomatics datasets.
 */
export const parseFlavourCase = (rawInput: unknown, expectedFlavour: FlavourId): FlavourAnalysisCase => {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new Error('INVALID_FLAVOUR_CASE');
  }

  const record = rawInput as Record<string, unknown>;

  if ('flavour' in record) {
    if (record.flavour !== expectedFlavour) {
      throw new Error('FLAVOUR_MISMATCH');
    }
    if (!isFlavourId(record.flavour)) {
      throw new Error('INVALID_FLAVOUR_CASE');
    }
    if (typeof record.sourceUrl !== 'string') {
      throw new Error('INVALID_FLAVOUR_CASE');
    }

    const restoredDataset = record.dataset ? deserializeFullCase(record.dataset) : undefined;
    return {
      version: typeof record.version === 'string' ? record.version : '1.0.0',
      flavour: expectedFlavour,
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      sourceUrl: record.sourceUrl,
      ...(typeof record.matchDataJson === 'string' ? { matchDataJson: record.matchDataJson } : {}),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
      ...(restoredDataset ? { dataset: restoredDataset } : {}),
      ...(record.soccerModelConfig && typeof record.soccerModelConfig === 'object'
        ? { soccerModelConfig: record.soccerModelConfig as any }
        : {})
    };
  }

  // Allow importing raw match data directly into the soccer flavour
  if (
    expectedFlavour === 'match-soccer-mvp' &&
    ((record.events && Array.isArray(record.events)) || (record.home && record.away) || record.matchCentreData)
  ) {
    return {
      version: '1.0.0',
      flavour: expectedFlavour,
      sourceUrl: typeof record.sourceUrl === 'string' ? record.sourceUrl : '',
      matchDataJson: JSON.stringify(record, null, 2),
      updatedAt: new Date().toISOString()
    };
  }

  // Allow importing a standalone Ordomatics dataset/case file directly into the flavour
  const hasElements =
    Array.isArray(record.elements) ||
    (record.dataset && typeof record.dataset === 'object' && Array.isArray((record.dataset as any).elements));
  if (hasElements) {
    const restoredDataset = deserializeFullCase(record);
    return {
      version: '1.0.0',
      flavour: expectedFlavour,
      sourceUrl: typeof record.sourceUrl === 'string' ? record.sourceUrl : '',
      ...(typeof record.matchDataJson === 'string' ? { matchDataJson: record.matchDataJson } : {}),
      updatedAt: new Date().toISOString(),
      dataset: restoredDataset
    };
  }

  throw new Error('INVALID_FLAVOUR_CASE');
};

/**
 * Builds a clean, standalone, human-readable HTML report of the flavour analysis case.
 */
export const buildFlavourReportHtml = (
  flavourCase: FlavourAnalysisCase,
  strings: FlavourReportStrings,
  language: string
): string => {
  const trimmedUrl = flavourCase.sourceUrl.trim();
  const formattedDate = new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
  const precision = flavourCase.dataset?.decimalPrecision ?? 4;
  const calculation = flavourCase.dataset ? calculateOrdomatica(flavourCase.dataset) : null;

  const sourceUrlHtml = trimmedUrl
    ? isHttpUrl(trimmedUrl)
      ? `<a href="${escapeHtml(trimmedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(trimmedUrl)}</a>`
      : `<code>${escapeHtml(trimmedUrl)}</code>`
    : `<span class="muted">${escapeHtml(strings.noUrlProvided)}</span>`;

  const rankingRowsHtml =
    flavourCase.dataset && calculation
      ? calculation.agg.ranking
          .map((elemIdx, rankPos) => {
            const name = flavourCase.dataset!.elements[elemIdx] ?? `#${elemIdx + 1}`;
            const score = calculation.agg.A_final[elemIdx] ?? 0;
            return `<tr>
              <td>#${rankPos + 1}</td>
              <td><strong>${escapeHtml(name)}</strong></td>
              <td class="num">${score.toFixed(precision)}</td>
            </tr>`;
          })
          .join('\n')
      : '';

  const dimensionRowsHtml =
    flavourCase.dataset
      ? flavourCase.dataset.characteristics
          .map((char, idx) => {
            const typeText =
              char.type === 'qualitative' ? strings.qualitativeLabel : strings.quantitativeLabel;
            const weight = flavourCase.dataset!.owa[idx] ?? 0;
            return `<tr>
              <td>${escapeHtml(char.name || `#${idx + 1}`)}</td>
              <td>${escapeHtml(typeText)}</td>
              <td class="num">${weight.toFixed(precision)}</td>
            </tr>`;
          })
          .join('\n')
      : '';

  const datasetSectionsHtml =
    flavourCase.dataset && calculation
      ? `<section class="card">
          <h2>${escapeHtml(strings.rankingSectionTitle)}</h2>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(strings.rankColumn)}</th>
                <th>${escapeHtml(strings.elementColumn)}</th>
                <th class="num">${escapeHtml(strings.scoreColumn)}</th>
              </tr>
            </thead>
            <tbody>
              ${rankingRowsHtml}
            </tbody>
          </table>
        </section>
        <section class="card">
          <h2>${escapeHtml(strings.dimensionsSectionTitle)}</h2>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(strings.dimensionColumn)}</th>
                <th>${escapeHtml(strings.typeColumn)}</th>
                <th class="num">${escapeHtml(strings.weightColumn)}</th>
              </tr>
            </thead>
            <tbody>
              ${dimensionRowsHtml}
            </tbody>
          </table>
        </section>`
      : `<section class="card">
          <h2>${escapeHtml(strings.statusSectionTitle)}</h2>
          <p>${escapeHtml(trimmedUrl ? strings.statusConfigured : strings.statusEmpty)}</p>
        </section>`;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(strings.documentTitle)} — ${escapeHtml(strings.flavourTitle)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #f9fafb;
      color: #111827;
      line-height: 1.5;
    }
    .container { max-width: 880px; margin: 0 auto; }
    .header {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 28px;
      margin-bottom: 20px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      margin-bottom: 6px;
    }
    h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: #111827; }
    .subtitle { margin: 0 0 18px 0; color: #4b5563; font-size: 14px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
      font-size: 13px;
    }
    .meta-label { display: block; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    .meta-value { color: #111827; word-break: break-word; }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 22px 24px;
      margin-bottom: 18px;
    }
    h2 { margin: 0 0 14px 0; font-size: 16px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: left; }
    th { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; background: #f9fafb; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #6b7280; font-style: italic; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .header, .card { border-color: #d1d5db; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="eyebrow">${escapeHtml(strings.documentTitle)}</div>
      <h1>${escapeHtml(strings.flavourTitle)}</h1>
      <p class="subtitle">${escapeHtml(strings.flavourDescription)}</p>
      <div class="meta-grid">
        <div>
          <span class="meta-label">${escapeHtml(strings.flavourLabel)}</span>
          <span class="meta-value">${escapeHtml(strings.flavourTitle)}</span>
        </div>
        <div>
          <span class="meta-label">${escapeHtml(strings.generatedAtLabel)}</span>
          <span class="meta-value">${escapeHtml(formattedDate)}</span>
        </div>
        <div>
          <span class="meta-label">${escapeHtml(strings.sourceUrlLabel)}</span>
          <span class="meta-value">${sourceUrlHtml}</span>
        </div>
      </div>
      ${flavourCase.description ? `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #f3f4f6;">
        <span class="meta-label" style="display: block; font-size: 11px; font-weight: 600; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;">
          ${language === 'es' ? 'Descripción del Análisis' : 'Analysis Description'}
        </span>
        <div class="meta-value" style="color: #374151; line-height: 1.5; font-size: 13px;">${escapeHtml(flavourCase.description)}</div>
      </div>` : ''}
    </header>
    ${datasetSectionsHtml}
  </div>
</body>
</html>`;
};

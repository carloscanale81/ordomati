import { Characteristic, InputEvaluationResult, TokenEvaluationResult } from './types';

/**
 * Representation of a 4-parameter trapezoidal/triangular fuzzy number (a, b, c, d)
 * defined on the normalized domain [0, 1].
 * - a: Left support boundary (membership = 0)
 * - b: Left core boundary (membership = 1)
 * - c: Right core boundary (membership = 1)
 * - d: Right support boundary (membership = 0)
 * When b === c, it represents a symmetrical or asymmetrical triangular fuzzy number.
 */
export interface FuzzyLabelInterval {
  a: number;
  b: number;
  c: number;
  d: number;
}

/**
 * Returns standard linguistic label symbols for a given granularity (g).
 * For example:
 * - g=3: ['B', 'M', 'A'] (Low, Medium, High)
 * - g=5: ['MB', 'B', 'M', 'A', 'MA'] (Very Low, Low, Medium, High, Very High)
 * - g=7: ['N', 'MB', 'B', 'M', 'A', 'MA', 'P'] (Null, ..., Perfect)
 */
export const getLabels = (g: number): string[] => {
  const dictionary: Record<number, string[]> = {
    3: ['B', 'M', 'A'],
    5: ['MB', 'B', 'M', 'A', 'MA'],
    7: ['N', 'MB', 'B', 'M', 'A', 'MA', 'P']
  };
  return dictionary[g] || Array.from({ length: g }, (_, i) => 's' + i);
};

/**
 * Generates uniformly distributed triangular fuzzy sets representing n linguistic terms across [0, 1].
 * The step width is h = 1 / (n - 1).
 * Each term s_k is centered at k * h with support [(k-1)*h, (k+1)*h].
 */
export const getLabelFuzzySets = (n: number): FuzzyLabelInterval[] => {
  const h = 1 / (n - 1);
  return Array.from({ length: n }, (_, k) => ({
    a: Math.max(0, (k - 1) * h),
    b: k * h,
    c: k * h,
    d: Math.min(1, (k + 1) * h)
  }));
};

/**
 * Piecewise linear membership function mu_s(v) for a fuzzy set s = (a, b, c, d).
 * Returns:
 * - 0 if v < a or v > d
 * - 1 if b <= v <= c
 * - (v - a) / (b - a) if a <= v < b (ascending slope)
 * - (d - v) / (d - c) if c < v <= d (descending slope)
 */
export const computeMembership = (s: FuzzyLabelInterval, v: number): number => {
  if (v < s.a || v > s.d) return 0;
  if (v >= s.b && v <= s.c) return 1;
  return v < s.b ? (v - s.a) / (s.b - s.a) : (s.d - v) / (s.d - s.c);
};

/**
 * Computes the membership vector tau(v, S) = [mu_s0(v), mu_s1(v), ..., mu_sn(v)].
 * Projects a normalized crisp value v in [0, 1] onto the linguistic label set S.
 */
export const tau = (v: number, S: FuzzyLabelInterval[]): number[] => {
  return S.map(s => computeMembership(s, v));
};

/**
 * Fuzzy extension operator for intervals [x1, x2].
 * Computes the joint membership profile across labels by taking the lower and upper bounds,
 * setting the interior to 1, and preserving boundary slopes.
 */
export const tauInterval = (a1: number[], a2: number[]): number[] => {
  const idx = a1.map((x, i) => (x > 0 || a2[i] > 0 ? i : -1)).filter(i => i >= 0);
  if (idx.length === 0) return a1.map(() => 0);
  const lo = Math.min(...idx);
  const hi = Math.max(...idx);
  return a1.map((x, i) => (i < lo || i > hi ? 0 : i > lo && i < hi ? 1 : Math.min(1, x + a2[i])));
};

/**
 * Discrete center-of-gravity defuzzification function phi(alpha).
 * Computes the weighted average term index:
 *   phi(alpha) = sum(i * alpha_i) / sum(alpha_i)
 * Transforms a vector of membership degrees back into a continuous index beta in [0, g - 1].
 */
export const phi = (alpha: number[]): number => {
  const sum = alpha.reduce((s, a) => s + a, 0);
  return sum === 0 ? 0 : alpha.reduce((s, a, i) => s + i * a, 0) / sum;
};

export type ParsedToken =
  | { t: 'int'; a: number; b: number; raw: string }
  | { t: 'real'; v: number; raw: string }
  | { t: 'tup'; i: number; gamma: number; g: number; raw: string; pure: boolean }
  | { t: 'err'; msg: string; msgKey: string; msgParams: Record<string, string | number> };

/**
 * Parses a heterogeneous input token string.
 * Supports:
 * 1. Crisp numbers: "35", "-4.2"
 * 2. Numeric intervals: "[40, 46]"
 * 3. Pure linguistic labels: "B", "MA", "B@3"
 * 4. 2-tuples with explicit granularity: "(MA, -0.2)@5", "(B, 0.1)@3", "(MA, -0.2)"
 */
export const parseToken = (tok: string, defaultGranularity: number): ParsedToken => {
  let t = tok.trim();
  let g = defaultGranularity;
  
  // Extract custom granularity syntax '@g' at the end, e.g., "(MA, -0.2)@5" or "B@3"
  const granularityMatch = t.match(/@\s*(\d+)\s*$/);
  if (granularityMatch) {
    g = +granularityMatch[1];
    t = t.slice(0, granularityMatch.index).trim();
    if (g > defaultGranularity) {
      return {
        t: 'err',
        msg: `Granularidad @${g} no puede superar la máxima definida (${defaultGranularity})`,
        msgKey: 'trace.err.granularityExceeded',
        msgParams: { g, max: defaultGranularity }
      };
    }
    if (g < 2) {
      return {
        t: 'err',
        msg: `Granularidad inválida (@${g})`,
        msgKey: 'trace.err.invalidGranularity',
        msgParams: { g }
      };
    }
  }

  // Check for numeric interval syntax [a, b]
  const intervalMatch = t.match(/^\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]$/);
  if (intervalMatch) {
    return { t: 'int', a: +intervalMatch[1], b: +intervalMatch[2], raw: tok };
  }

  // Check for crisp real number
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    return { t: 'real', v: +t, raw: tok };
  }

  // Check for 2-tuple (label, symbolic translation gamma)
  let label = t;
  let gamma = 0;
  const tupleMatch = t.match(/^\(\s*([^,]+?)\s*,\s*(-?[\d.]+)\s*\)$/);
  if (tupleMatch) {
    label = tupleMatch[1].trim();
    gamma = +tupleMatch[2];
  }

  const labelList = getLabels(g);
  const termIndex = labelList.findIndex(x => x.toLowerCase() === label.toLowerCase());
  if (termIndex < 0) {
    return {
      t: 'err',
      msg: `'${label}' no reconocido (g=${g})`,
      msgKey: 'trace.err.unrecognizedLabel',
      msgParams: { label, g }
    };
  }

  return { t: 'tup', i: termIndex, gamma, g, raw: tok, pure: !tupleMatch };
};

/**
 * Evaluates the heterogeneous inputs for an alternative in a given characteristic.
 * Translates qualitative or quantitative inputs into a normalized own-value V^P in [0, 1].
 */
export const evaluateElementInput = (
  rawInput: string,
  char: Characteristic
): InputEvaluationResult => {
  const tokens = rawInput ? rawInput.split(';') : [''];
  let sum = 0;
  let validCount = 0;
  const tokenResults: TokenEvaluationResult[] = [];

  const g = char.g || 5;
  let min = char.min ?? 0;
  let max = char.max ?? 100;

  // If dynamic scale mode is enabled independently for min and/or max, dynamically determine bounds from raw inputs
  const isMinDynamic = char.minMode === 'dynamic' || (char.scaleMode === 'dynamic' && char.minMode !== 'manual');
  const isMaxDynamic = char.maxMode === 'dynamic' || (char.scaleMode === 'dynamic' && char.maxMode !== 'manual');

  if ((isMinDynamic || isMaxDynamic) && char.rawInputs) {
    const rawNums: number[] = [];
    char.rawInputs.forEach(inp => {
      if (inp) {
        inp.split(';').forEach(t => {
          const num = parseFloat(t.trim());
          if (Number.isFinite(num)) rawNums.push(num);
        });
      }
    });
    if (rawNums.length > 0) {
      const dynMin = Math.min(...rawNums);
      let dynMax = Math.max(...rawNums);
      if (dynMin === dynMax) {
        dynMax = dynMin + (dynMin === 0 ? 1 : Math.abs(dynMin) * 0.2);
      }
      if (isMinDynamic) min = dynMin;
      if (isMaxDynamic) max = dynMax;
    }
  }
  const fuzzySets = getLabelFuzzySets(g);

  // Normalization helper: maps physical domain [min, max] to [0, 1]
  const norm = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min || 1)));

  // Scaling helper: maps normalized [0, 1] back to physical domain [min, max]
  const scale = (x: number) => min + (max - min) * x;

  tokens.forEach(tok => {
    const cleanTok = tok.trim();
    if (!cleanTok) {
      tokenResults.push({ raw: tok, trace: 'Empty', valid: false });
      return;
    }

    const parsed = parseToken(cleanTok, g);
    if (parsed.t === 'err') {
      tokenResults.push({
        raw: tok,
        trace: parsed.msg,
        traceKey: parsed.msgKey,
        traceParams: parsed.msgParams,
        valid: false
      });
      return;
    }

    let traceStr = '';
    let traceKey = '';
    let traceParams: Record<string, string | number> = {};
    let finalTokenVal = 0;

    if (char.type === 'qualitative') {
      // Qualitative characteristic: compute continuous linguistic index beta in [0, g - 1]
      let beta: number;

      if (parsed.t === 'real') {
        // Project crisp number onto fuzzy partitions and defuzzify
        const x = norm(parsed.v);
        const alpha = tau(x, fuzzySets);
        beta = phi(alpha);
        traceStr = `Norm=${x.toFixed(2)} → β=${beta.toFixed(2)}`;
        traceKey = 'trace.val.norm';
        traceParams = { x: x.toFixed(2), beta: beta.toFixed(2) };
      } else if (parsed.t === 'int') {
        // Project interval [a, b] onto fuzzy partitions and defuzzify
        const x1 = norm(parsed.a);
        const x2 = norm(parsed.b);
        const alpha1 = tau(x1, fuzzySets);
        const alpha2 = tau(x2, fuzzySets);
        const alpha = tauInterval(alpha1, alpha2);
        beta = phi(alpha);
        traceStr = `Norm=[${x1.toFixed(2)},${x2.toFixed(2)}] → β=${beta.toFixed(2)}`;
        traceKey = 'trace.val.normInterval';
        traceParams = { x1: x1.toFixed(2), x2: x2.toFixed(2), beta: beta.toFixed(2) };
      } else {
        // 2-tuple or linguistic label: beta = index + gamma
        const rawBeta = parsed.i + parsed.gamma;
        if (parsed.g === g) {
          beta = rawBeta;
          traceStr = `2-tuple (g=${parsed.g}) → β=${beta.toFixed(2)}`;
          traceKey = 'trace.val.twoTupleQual';
          traceParams = { g: parsed.g, beta: beta.toFixed(2) };
        } else {
          // Multigranular transformation: scale beta to the characteristic's target granularity
          beta = (rawBeta / (parsed.g - 1)) * (g - 1);
          traceStr = `Multigranularity (g=${parsed.g}) → β=${beta.toFixed(2)}`;
          traceKey = 'trace.val.multigranularity';
          traceParams = { g: parsed.g, beta: beta.toFixed(2) };
        }
      }

      finalTokenVal = beta;
      sum += beta;
      validCount++;
    } else if (char.type === 'adjustment') {
      // Adjustment characteristic: directly evaluate numeric or interval values
      let val = 0;
      if (parsed.t === 'real') {
        val = parsed.v;
        traceStr = `Precise → ${parsed.v}`;
        traceKey = 'trace.val.precise';
        traceParams = { val: parsed.v };
      } else if (parsed.t === 'int') {
        val = (parsed.a + parsed.b) / 2;
        traceStr = `Interval [${parsed.a},${parsed.b}] → Avg=${val.toFixed(2)}`;
        traceKey = 'trace.val.interval';
        traceParams = { lo: parsed.a, hi: parsed.b, avg: val.toFixed(2) };
      } else {
        tokenResults.push({
          raw: tok,
          trace: 'Ajuste solo admite valores numéricos o intervalos',
          traceKey: 'trace.err.adjustmentNumericOnly',
          valid: false
        });
        return;
      }

      finalTokenVal = val;
      sum += val;
      validCount++;
    } else {
      // Quantitative characteristic: evaluate physical value within allowed interval [min, max]
      let lo: number;
      let hi: number;

      if (parsed.t === 'real') {
        lo = hi = Math.max(min, Math.min(max, parsed.v));
        traceStr = parsed.v < min || parsed.v > max
          ? `${parsed.v} (Clamped [${min},${max}] → ${lo})`
          : `Precise → ${parsed.v}`;
        traceKey = 'trace.val.precise';
        traceParams = { val: lo };
      } else if (parsed.t === 'int') {
        lo = Math.max(min, Math.min(max, parsed.a));
        hi = Math.max(min, Math.min(max, parsed.b));
        const avg = ((lo + hi) / 2).toFixed(2);
        traceStr = `Interval [${lo},${hi}] → Avg=${avg}`;
        traceKey = 'trace.val.interval';
        traceParams = { lo, hi, avg };
      } else {
        // Linguistic term provided for quantitative variable: dereference using core or support semantics
        // and scale directly from [0, 1] into physical interval [min, max]
        if (parsed.pure) {
          const sDef = getLabelFuzzySets(parsed.g)[parsed.i];
          const x1 = (char.sem || 'core') === 'support' ? sDef.a : sDef.b;
          const x2 = (char.sem || 'core') === 'support' ? sDef.d : sDef.c;
          lo = scale(x1);
          hi = scale(x2);
          traceStr = `Label → [${lo.toFixed(2)},${hi.toFixed(2)}]`;
          traceKey = 'trace.val.label';
          traceParams = { lo: lo.toFixed(2), hi: hi.toFixed(2) };
        } else {
          // 2-tuple scaled directly from [0, 1] to [min, max]
          const x = (parsed.i + parsed.gamma) / (parsed.g - 1);
          lo = hi = scale(x);
          traceStr = `2-tuple → ${lo.toFixed(2)}`;
          traceKey = 'trace.val.twoTupleQuant';
          traceParams = { val: lo.toFixed(2) };
        }
      }

      const midpoint = (lo + hi) / 2;
      finalTokenVal = midpoint;
      sum += midpoint;
      validCount++;
    }

    tokenResults.push({
      raw: tok,
      trace: traceStr,
      traceKey,
      traceParams,
      valid: true,
      val: finalTokenVal
    });
  });

  // Aggregate multiple values/evaluations
  let finalVal = 0;
  let summaryTrace = 'Empty → 0';

  if (validCount > 0) {
    if (char.type === 'qualitative') {
      const avgBeta = sum / validCount;
      // Normalize beta in [0, g - 1] to V^P in [0, 1]
      finalVal = avgBeta / (g - 1);
      finalVal = Math.max(0, Math.min(1, isNaN(finalVal) ? 0 : finalVal));
      summaryTrace = `μ(β)=${avgBeta.toFixed(2)} ⇒ V^P = ${finalVal.toFixed(4)}`;
    } else if (char.type === 'adjustment') {
      const avg = sum / validCount;
      finalVal = isNaN(avg) ? 0 : avg;
      summaryTrace = `μ(val)=${avg.toFixed(2)} ⇒ Valor = ${finalVal.toFixed(2)}`;
    } else {
      // Quantitative: min and max define permitted interval; value remains in physical scale
      const avg = sum / validCount;
      finalVal = isNaN(avg) ? 0 : Math.max(min, Math.min(max, avg));
      summaryTrace = `μ(val)=${avg.toFixed(2)} ⇒ V^P = ${finalVal.toFixed(2)}`;
    }
  }

  return { val: finalVal, tokens: tokenResults, summaryTrace };
};

/**
 * Computes the own-value vector V^P for all alternatives within a characteristic.
 */
export const computeCharacteristicVP = (
  char: Characteristic,
  elementsCount: number
): { parsedInputs: InputEvaluationResult[]; vp: number[] } => {
  const parsedInputs: InputEvaluationResult[] = [];
  const vp: number[] = [];

  for (let i = 0; i < elementsCount; i++) {
    const raw = char.rawInputs ? char.rawInputs[i] || '' : '';
    const res = evaluateElementInput(raw, char);
    parsedInputs.push(res);
    vp.push(res.val);
  }

  return { parsedInputs, vp };
};

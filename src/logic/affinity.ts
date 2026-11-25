import {
  BlockingConfig,
  Characteristic,
  EqualizationConfig,
  EqualizationOptions,
  PropagationConfig,
  RelativeAdjustmentConfig,
  SynergyConfig
} from './types';
import { evaluateMathExpression } from './mathExpression';

export interface ComputeAffinityMatrixOptions {
  extraScope?: Record<string, number>;
  precision?: number;
}

export interface RelativeAdjustmentOptions {
  type?: 'byPop' | 'byMinutes' | 'byTouches' | 'byMean' | 'none' | 'custom';
  byPop?: number;
  customExpr?: string;
  populationVC?: number[];
  duration?: number;
  totalDuration?: number;
  playerMinutes?: number[];
  touches?: number[];
  meanVC?: number;
  extraScope?: Record<string, number>;
}

const MATH_SCOPE: Record<string, any> = {
  exp: Math.exp,
  pow: Math.pow,
  sqrt: Math.sqrt,
  log: Math.log,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  sin: Math.sin,
  cos: Math.cos,
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
  Math
};

const MATH_KEYS = Object.keys(MATH_SCOPE);
const MATH_VALS = Object.values(MATH_SCOPE);

/**
 * Evaluates a custom propagation mathematical expression f(d, L, L1, L2).
 * Allowed variables: d, L (or L2), L1.
 * Supported math functions: exp, pow, sqrt, log, abs, min, max, sin, cos, pi, e.
 */
export const evaluateCustomPropagation = (
  d: number,
  limit: number,
  l1: number,
  expr: string,
  extraScope?: Record<string, number>
): number => {
  if (!expr || !expr.trim()) return 0;
  const res = evaluateMathExpression(
    expr,
    { d, L: limit, L1: l1, L2: limit, cut: limit, ...extraScope },
    0
  );
  return Math.max(0, Math.min(1, Number.isFinite(res) ? res : 0));
};

/**
 * Computes the Affinity Matrix A from the Distance Matrix D and the Propagation Function F_P.
 * 
 * In Ordomatics, distance d_ij represents the conceptual or physical divergence between
 * alternatives i and j. The propagation function F_P maps distance to affinity a_ij in [0, 1]:
 * - Self-affinity is strictly reflexive: a_ii = 1 (when d_ii = 0).
 * - Triangular: a_ij = (L - d) / L for d <= L, else 0.
 * - Rectangular (step): a_ij = 1 for d <= L, else 0.
 * - Trapezoidal: a_ij = 1 for d <= L1, (L2 - d) / (L2 - L1) for L1 < d <= L2, else 0.
 * - Sinusoidal: a_ij = 0.5 * (1 + cos(pi * d / L)) for d <= L, else 0.
 * - Custom: user-defined mathematical function f(d, L).
 * - Inhibited: no propagation occurs between distinct elements (a_ij = 0 for i != j).
 */
export const computeAffinityMatrix = (
  d: (number | null | undefined)[][],
  prop: PropagationConfig,
  options?: ComputeAffinityMatrixOptions
): number[][] => {
  const l1 = prop.l1 || 0;
  const l2 = (typeof prop.limit === 'number' && prop.limit > 0) ? prop.limit : 1;
  const precision = options?.precision ?? 4;

  return d.map((row, i) =>
    row.map((val, j) => {
      // Direct self-identity: identical elements always have full affinity
      if (i === j) return 1.0;

      // When there are no distance values entered for distinct elements (val is null/undefined/NaN),
      // it represents no distance data, yielding 0 affinity.
      if (val === null || val === undefined || !Number.isFinite(val)) {
        return 0.0;
      }

      // Max ratio propagation (e.g. passes / maxPasses or interaction counts)
      if (prop.type === 'maxRatio') {
        const ratio = l2 > 0 ? val / l2 : 0;
        const clamped = Math.max(0, Math.min(1, ratio));
        return options?.precision !== undefined ? Number(clamped.toFixed(options.precision)) : clamped;
      }

      // Explicit distance 0 between distinct elements in physical distance metric
      if (val === 0) return 1.0;

      let result = 0;
      switch (prop.type) {
        case 'triangular':
          result = val <= l2 ? (l2 - val) / l2 : 0;
          break;
        case 'rectangular': {
          const cut = options?.extraScope?.cut;
          result = cut !== undefined ? (val >= cut ? 1.0 : 0.0) : (val <= l2 ? 1.0 : 0.0);
          break;
        }
        case 'trapezoidal':
          result = val <= l1 ? 1.0 : val <= l2 ? (l2 - val) / (l2 - l1 || 1) : 0;
          break;
        case 'sinusoidal':
          result = val <= l2 ? 0.5 * (1 + Math.cos(Math.PI * (val / l2))) : 0;
          break;
        case 'custom':
          result = evaluateCustomPropagation(
            val,
            l2,
            l1,
            prop.customExpr || 'exp(-d / 2)',
            options?.extraScope
          );
          break;
        case 'inhibited':
          result = 0;
          break;
        default:
          result = l2 > 0 ? val / l2 : 0;
      }
      const clamped = Math.max(0, Math.min(1, result));
      return options?.precision !== undefined ? Number(clamped.toFixed(options.precision)) : clamped;
    })
  );
};

/**
 * Computes the Autoinduced Affinity Matrix A^A from affinity A and blocking vector V^B (or custom blocking function).
 * 
 * Mathematical Formulation:
 * - Standard Blocking (Doctoral Thesis):
 *   FB(A, V^B, i, j) =
 *     - For i = j:   (1 / sum_k(a_ik))^(1 - v_i^b)
 *     - For i != j:  [a_ij / (sum_k(a_ik) - 1)] * (1 - (1 / sum_k(a_ik))^(1 - v_i^b))
 * - Threshold Blocking:
 *     - For i = j:   1.0
 *     - For i != j:  a_ij < theta ? 0.0 : a_ij
 * - None:
 *     - A^A = A directly.
 * - Custom:
 *     - User-defined expression f(a, S, vb, theta, i, j).
 */
export const computeAutoinducedAffinity = (
  A: number[][],
  vb: number[] = [],
  blockConfig?: BlockingConfig
): number[][] => {
  const blockType = blockConfig?.type || 'standard';
  const theta = typeof blockConfig?.threshold === 'number' ? blockConfig.threshold : 0.15;

  return A.map((rawRow, i) => {
    // If threshold blocking is active, prune connections below threshold theta first
    const row = blockType === 'threshold'
      ? rawRow.map((val, j) => (i === j ? 1.0 : val < theta ? 0.0 : val))
      : rawRow;

    const rowSum = row.reduce((acc, v) => acc + v, 0);

    // If an alternative has no connection with any other element
    if (rowSum - 1 < 1e-12) {
      return row.map((_, j) => (i === j ? 1 : 0));
    }

    // In 'none' blocking, blocking factor is strictly 0 (no blocking / pure proportional distribution)
    const blockFactor = blockType === 'none' ? 0 : (blockConfig?.vb !== undefined ? blockConfig.vb : (vb[i] ?? 0));

    if (blockType === 'custom' && blockConfig?.customExpr) {
      const customExpr = blockConfig.customExpr;
      return row.map((val, j) => {
        const s_val = Math.pow(1 / rowSum, 1 - blockFactor);
        const defaultVal = i === j ? s_val : (val / (rowSum - 1)) * (1 - s_val);
        const scope = {
          a: val,
          aij: val,
          S: rowSum,
          s: rowSum,
          sum: rowSum,
          vb: blockFactor,
          v: blockFactor,
          theta,
          umbral: theta,
          i,
          j
        };
        const res = evaluateMathExpression(customExpr, scope, defaultVal);
        return Math.max(0, Number.isFinite(res) ? res : defaultVal);
      });
    }

    // Standard blocking: power formula from doctoral thesis
    // For blockFactor = 0 (or 'none'), s_val = 1 / rowSum, and each cell is val / rowSum (row sum = 1.0)
    const s_val = Math.pow(1 / rowSum, 1 - blockFactor);

    return row.map((val, j) => (i === j ? s_val : (val / (rowSum - 1)) * (1 - s_val)));
  });
};

/**
 * Evaluates a custom synergy mathematical expression.
 * Supports both modern signature f(a) without k: evaluateCustomSynergy(a, expr, k?)
 * and legacy signature: evaluateCustomSynergy(a, k, expr).
 */
export function evaluateCustomSynergy(a: number, expr: string, k?: number): number;
export function evaluateCustomSynergy(a: number, k: number, expr: string): number;
export function evaluateCustomSynergy(
  a: number,
  first: string | number,
  second?: string | number
): number {
  let expr = '';
  let k: number | undefined;

  if (typeof first === 'string') {
    expr = first;
    if (typeof second === 'number') k = second;
  } else {
    k = first;
    if (typeof second === 'string') expr = second;
  }

  if (!expr || !expr.trim()) return a;
  const scope: Record<string, number> = { a };
  if (typeof k === 'number' && Number.isFinite(k)) scope.k = k;
  const res = evaluateMathExpression(expr, scope, a);
  return Math.max(0, Number.isFinite(res) ? res : a);
}

/**
 * Computes the Contextual Affinity Matrix A^C by applying synergy function F_S to A^A.
 * 
 * Mathematical Formulation:
 * - Synergy models contextual reinforcement or damping among different alternatives.
 * - Diagonal elements (self-affinity) remain unchanged: a^C_ii = a^A_ii.
 * - When synergy type is 'factor', non-diagonal entries are modulated:
 *   a^C_ij = max(0, a^A_ij * k)
 * - When synergy type is 'custom', user-defined function f(a) modulates non-diagonal entries without factor k.
 * - When synergy type is 'none', the matrix remains identical: A^C = A^A.
 */
export const computeContextualAffinity = (AA: number[][], syn: SynergyConfig): number[][] => {
  return AA.map((row, i) =>
    row.map((val, j) => {
      if (i === j) return val;
      if (syn.type === 'factor') return Math.max(0, val * syn.k);
      if (syn.type === 'custom') {
        return evaluateCustomSynergy(val, syn.customExpr || 'min(1, a * 1.2)', syn.k);
      }
      return val;
    })
  );
};

/**
 * Computes the Contextual Value Vector V^C = V^P * A^C.
 * 
 * Mathematical Formulation:
 * V^C_j = sum_{k=1}^n (V^P_k * a^C_kj)
 * 
 * Represents the total value accumulated by alternative j when value flows
 * across the contextual affinity network from all other alternatives k.
 */
export const computeContextualValue = (vp: number[], AC: number[][]): number[] => {
  const n = vp.length;
  const VC: number[] = [];
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += (vp[k] || 0) * (AC[k]?.[j] || 0);
    }
    VC.push(sum);
  }
  return VC;
};

/**
 * Inverts a square matrix A using Gauss-Jordan elimination with partial pivoting.
 * Includes diagonal regularization fallback if near-singular.
 */
export interface MatrixInversionResult {
  matrix: number[][];
  isInvertible: boolean;
  isQuasiInverse: boolean;
  minSingularValue?: number;
  maxSingularValue?: number;
}

/**
 * Computes SVD (Singular Value Decomposition) A = U * S * V^T using one-sided Jacobi rotations.
 */
function svd(A: number[][]): { U: number[][]; S: number[]; V: number[][] } {
  const m = A.length;
  const n = A[0]?.length || 0;
  if (m === 0 || n === 0) return { U: [], S: [], V: [] };

  const U = A.map(row => [...row]);
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  const singularValues = new Array(n).fill(0);
  const maxIter = 100;
  const tol = 1e-15;

  for (let iter = 0; iter < maxIter; iter++) {
    let maxDiff = 0;
    for (let j = 0; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        let p = 0;
        let q = 0;
        let r = 0;
        for (let i = 0; i < m; i++) {
          p += U[i][j] * U[i][k];
          q += U[i][j] * U[i][j];
          r += U[i][k] * U[i][k];
        }
        maxDiff = Math.max(maxDiff, Math.abs(p));
        if (Math.abs(p) <= tol) continue;

        const alpha = (q - r) / (2 * p);
        const t = alpha === 0 ? 1 : Math.sign(alpha) / (Math.abs(alpha) + Math.sqrt(1 + alpha * alpha));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;

        for (let i = 0; i < m; i++) {
          const u_ij = U[i][j];
          const u_ik = U[i][k];
          U[i][j] = c * u_ij + s * u_ik;
          U[i][k] = -s * u_ij + c * u_ik;
        }

        for (let i = 0; i < n; i++) {
          const v_ij = V[i][j];
          const v_ik = V[i][k];
          V[i][j] = c * v_ij + s * v_ik;
          V[i][k] = -s * v_ij + c * v_ik;
        }
      }
    }
    if (maxDiff < tol) break;
  }

  for (let j = 0; j < n; j++) {
    let norm = 0;
    for (let i = 0; i < m; i++) norm += U[i][j] * U[i][j];
    norm = Math.sqrt(norm);
    singularValues[j] = norm;
    if (norm > 1e-14) {
      for (let i = 0; i < m; i++) U[i][j] /= norm;
    }
  }

  return { U, S: singularValues, V };
}

/**
 * Computes the Moore-Penrose Pseudoinverse (Cuasi-inversa) of a matrix via SVD:
 * A^+ = V * S^+ * U^T
 */
export function computeMoorePenrosePseudoinverse(A: number[][]): { pinv: number[][]; minS: number; maxS: number } {
  const m = A.length;
  const n = A[0]?.length || 0;
  if (m === 0 || n === 0) return { pinv: [], minS: 0, maxS: 0 };

  const { U, S, V } = svd(A);
  const maxS = S.length > 0 ? Math.max(...S) : 0;
  const minS = S.length > 0 ? Math.min(...S) : 0;
  const tol = Math.max(m, n) * (maxS > 0 ? maxS : 1) * 1e-10;

  const S_inv = S.map(s => (s > tol ? 1 / s : 0));
  const pinv: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        if (S_inv[k] > 0) {
          sum += V[i][k] * S_inv[k] * U[j][k];
        }
      }
      pinv[i][j] = sum;
    }
  }

  return { pinv, minS, maxS };
}

/**
 * Computes exact matrix inverse if regular, or Moore-Penrose pseudoinverse (cuasi-inversa)
 * if singular or ill-conditioned, flagging whether cuasi-inversa was required.
 */
export const invertMatrixDetailed = (A: number[][]): MatrixInversionResult => {
  const n = A.length;
  if (n === 0) return { matrix: [], isInvertible: true, isQuasiInverse: false };
  if (n === 1) {
    const val = A[0][0];
    if (Math.abs(val) > 1e-10) {
      return { matrix: [[1 / val]], isInvertible: true, isQuasiInverse: false };
    }
    return { matrix: [[0]], isInvertible: false, isQuasiInverse: true };
  }

  // Check condition via SVD
  const { pinv, minS, maxS } = computeMoorePenrosePseudoinverse(A);
  const isIllConditioned = minS < 1e-8 || (maxS > 0 && minS / maxS < 1e-8);

  if (isIllConditioned) {
    return {
      matrix: pinv,
      isInvertible: false,
      isQuasiInverse: true,
      minSingularValue: minS,
      maxSingularValue: maxS
    };
  }

  // Regular matrix: perform standard Gauss-Jordan with partial pivoting for exact inversion
  const M: number[][] = A.map((row, i) => {
    const aug = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      aug[j] = row[j] ?? 0;
    }
    aug[n + i] = 1;
    return aug;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-10) {
      // Numerical breakdown fallback to SVD pseudoinverse
      return {
        matrix: pinv,
        isInvertible: false,
        isQuasiInverse: true,
        minSingularValue: minS,
        maxSingularValue: maxS
      };
    }

    if (maxRow !== i) {
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;
    }

    const pivot = M[i][i];
    for (let j = 0; j < 2 * n; j++) {
      M[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < 2 * n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv.push(M[i].slice(n, 2 * n));
  }

  return {
    matrix: inv,
    isInvertible: true,
    isQuasiInverse: false,
    minSingularValue: minS,
    maxSingularValue: maxS
  };
};

export const invertMatrix = (A: number[][]): number[][] => {
  return invertMatrixDetailed(A).matrix;
};

/**
 * Computes the Own Value Vector V^P from Contextual Values V^C and Contextual Affinity A^C.
 * Mathematical Formulation:
 * V^P = V^C * (A^C)^(-1) [or (A^C)^+ if singular]
 * V^P_j = sum_{k=1}^n (V^C_k * (A^C)^(-1)_kj)
 */
export const computeInverseContextualValue = (
  VC: number[],
  AC: number[][],
  options?: { preserveSum?: boolean }
): { vp: number[]; isQuasiInverse: boolean; invAC: number[][] } => {
  const n = VC.length;
  if (n === 0) return { vp: [], isQuasiInverse: false, invAC: [] };
  const { matrix: invAC, isQuasiInverse } = invertMatrixDetailed(AC);
  const unconstrained: number[] = [];
  let unconstrainedSum = 0;
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += (VC[k] || 0) * (invAC[k]?.[j] || 0);
    }
    unconstrained.push(sum);
    unconstrainedSum += sum;
  }

  const hasNegative = unconstrained.some(v => v < 0);
  if (!hasNegative) {
    return { vp: unconstrained.map(v => Math.max(0, v)), isQuasiInverse, invAC };
  }

  // Non-negative projection with unit value conservation:
  // When matrix inversion produces negative components due to cross-coupling,
  // proportional scaling ensures non-negativity (vp >= 0) while strictly conserving
  // the exact total system value (sum(vp) == unconstrainedSum).
  const positive = unconstrained.map(v => Math.max(0, v));
  const positiveSum = positive.reduce((a, b) => a + b, 0);

  let vp: number[];
  if (options?.preserveSum ?? true) {
    if (positiveSum > 0 && unconstrainedSum > 0) {
      const scale = unconstrainedSum / positiveSum;
      vp = positive.map(v => v * scale);
    } else {
      vp = positive;
    }
  } else {
    vp = positive;
  }

  return { vp, isQuasiInverse, invAC };
};

/**
 * Creates default linearly independent sample matrices of Own Values (sampleVP)
 * and corresponding Contextual Values (sampleVC) for dimension n.
 *
 * Mathematical properties:
 * - sampleVP has non-zero diagonal and small non-zero off-diagonal terms, ensuring
 *   strict linear independence and regularity (det(sampleVP) != 0).
 * - sampleVC is initially computed as baseAC * sampleVP, guaranteeing that
 *   sampleVC * (sampleVP)^(-1) reconstructs baseAC cleanly.
 */
export function createDefaultSampleMatrices(
  n: number,
  baseVP?: number[],
  baseAC?: number[][]
): { sampleVP: number[][]; sampleVC: number[][] } {
  if (n <= 0) return { sampleVP: [], sampleVC: [] };

  const sampleVP: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) {
        const val = baseVP?.[i];
        return typeof val === 'number' && Number.isFinite(val) && val > 0 ? val : 1.0;
      }
      return 0.1;
    })
  );

  const sampleVC: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, k) => {
      let sum = 0;
      for (let m = 0; m < n; m++) {
        const acVal = baseAC?.[i]?.[m] ?? (i === m ? 1.0 : 0.0);
        sum += acVal * sampleVP[m][k];
      }
      return sum;
    })
  );

  return { sampleVP, sampleVC };
}

/**
 * Computes the Contextual Affinity Matrix A^C from a sampling of linearly independent
 * Own Value vectors (sampleVP) and their corresponding Contextual Value vectors (sampleVC).
 *
 * Mathematical Formulation:
 * M_VC = A^C * M_VP
 * A^C = M_VC * (M_VP)^(-1)   [or (M_VP)^+ if singular]
 *
 * Cell-by-cell dot product:
 * A^C_ij = sum_{k=1}^n (M_VC_ik * (M_VP)^(-1)_kj)
 */
export function computeACFromSampling(
  sampleVP: number[][],
  sampleVC: number[][]
): {
  AC: number[][];
  invSampleVP: number[][];
  isQuasiInverse: boolean;
} {
  const n = sampleVP.length;
  if (n === 0) return { AC: [], invSampleVP: [], isQuasiInverse: false };

  // Invert sampleVP
  const { matrix: invSampleVP, isQuasiInverse } = invertMatrixDetailed(sampleVP);

  // Compute A^C = sampleVC * invSampleVP
  const AC: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += (sampleVC[i]?.[k] ?? 0) * (invSampleVP[k]?.[j] ?? 0);
      }
      return sum;
    })
  );

  return { AC, invSampleVP, isQuasiInverse };
}

/**
 * Computes relative adjustment factors (ca) and adjusts contextual values: V^CR = V^C * ca.
 *
 * Mathematical Formulation:
 * 1. By reference characteristic (byPop):
 *    ca_i = 1 / V^C_{pop, i} (if V^C_{pop, i} > 0, else 0).
 * 2. By elapsed minutes vs total match time:
 *    ca_i = duration / totalDuration (default 90).
 * 3. By relative interaction/touches:
 *    ca_i = avgTouches / touches_i.
 * 4. By mean contextual value:
 *    ca_i = 1 / mean(V^C).
 * 5. Custom mathematical expression:
 *    f(m, minutos, T, minutos_totales, toques, media_toques, vc, media_vc, i).
 * 6. None:
 *    ca_i = 1.0.
 */
export const computeRelativeAdjustment = (
  VC: number[],
  options?: RelativeAdjustmentOptions
): { ca: number[]; VCR: number[] } => {
  const n = VC.length;
  const ca: number[] = Array(n).fill(1.0);
  const type = options?.type || (options?.byPop !== undefined && options.byPop !== -1 ? 'byPop' : 'none');

  if (type === 'byPop' && options?.populationVC) {
    const pop = options.populationVC;
    for (let i = 0; i < n; i++) {
      ca[i] = pop[i] && pop[i] > 0 ? 1 / pop[i] : 0;
    }
  } else if (type === 'byMinutes') {
    const dur = options?.duration ?? 90;
    const playerMins = options?.playerMinutes;
    if (playerMins && playerMins.length === n) {
      for (let i = 0; i < n; i++) {
        const pm = playerMins[i];
        ca[i] = pm > 0 ? dur / pm : 1.0;
      }
    } else {
      const total = options?.totalDuration ?? 90;
      const factor = total > 0 ? dur / total : 1.0;
      for (let i = 0; i < n; i++) ca[i] = factor;
    }
  } else if (type === 'byTouches') {
    const touches = options?.touches || Array(n).fill(1);
    const avgTouches = touches.reduce((a, b) => a + b, 0) / (n || 1);
    for (let i = 0; i < n; i++) {
      ca[i] = touches[i] > 0 ? avgTouches / touches[i] : 1.0;
    }
  } else if (type === 'byMean') {
    const mean = options?.meanVC ?? (VC.reduce((a, b) => a + b, 0) / (n || 1));
    const factor = mean > 0 ? 1 / mean : 1.0;
    for (let i = 0; i < n; i++) ca[i] = factor;
  } else if (type === 'custom' && options?.customExpr) {
    const touches = options?.touches || Array(n).fill(1);
    const avgTouches = touches.reduce((a, b) => a + b, 0) / (n || 1);
    const mean = options?.meanVC ?? (VC.reduce((a, b) => a + b, 0) / (n || 1));
    const dur = options?.duration ?? 90;
    const total = options?.totalDuration ?? 90;

    for (let i = 0; i < n; i++) {
      const scope = {
        m: dur,
        minutos: dur,
        T: total,
        minutos_totales: total,
        toques: touches[i],
        media_toques: avgTouches,
        vc: VC[i],
        media_vc: mean,
        i,
        ...options?.extraScope
      };
      const res = evaluateMathExpression(options.customExpr, scope, 1.0);
      ca[i] = Math.max(0, Number.isFinite(res) ? res : 1.0);
    }
  }

  const VCR = VC.map((v, i) => v * ca[i]);
  return { ca, VCR };
};

/**
 * Computes equalization / scale normalization on a 1D vector of values to [0, 1].
 *
 * Supported methods:
 * - 'max' | 'maximum': v_i / max(V)
 * - 'sum': v_i / sum(V)
 * - 'target': min(1, max(0, v_i / targetObj))
 * - 'custom': user-defined mathematical function f(vp, max_vp, sum_vp, i)
 * - 'none': keeps raw values unchanged
 */
export const computeEqualizationVector = (
  values: number[],
  options?: EqualizationOptions
): { equalized: number[]; factor: number } => {
  const n = values.length;
  if (n === 0) return { equalized: [], factor: 1 };

  const type = options?.type || 'max';
  const precision = options?.precision ?? 4;

  if (type === 'none') {
    return { equalized: [...values], factor: 1 };
  }

  if (type === 'max' || type === 'maximum') {
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
      if (values[i] > maxVal) maxVal = values[i];
    }
    const factor = maxVal > 0 ? 1 / maxVal : 1;
    const equalized = values.map(v =>
      maxVal > 0 ? Number((v / maxVal).toFixed(precision)) : 0
    );
    return { equalized, factor };
  }

  if (type === 'sum') {
    let sumVal = 0;
    for (let i = 0; i < n; i++) sumVal += values[i];
    const factor = sumVal > 0 ? 1 / sumVal : 1;
    const equalized = values.map(v =>
      sumVal > 0 ? Number((v / sumVal).toFixed(precision)) : 0
    );
    return { equalized, factor };
  }

  if (type === 'target') {
    const obj = options?.obj && options.obj > 0 ? options.obj : 1;
    const factor = 1 / obj;
    const equalized = values.map(v =>
      Number(Math.min(1, Math.max(0, v * factor)).toFixed(precision))
    );
    return { equalized, factor };
  }

  if (type === 'custom') {
    let maxVal = 0;
    let sumVal = 0;
    for (let i = 0; i < n; i++) {
      if (values[i] > maxVal) maxVal = values[i];
      sumVal += values[i];
    }
    const expr = options?.customExpr || 'vp / max_vp';
    const equalized = values.map((v, i) => {
      const scope = {
        vp: v,
        vc: v,
        v,
        max_vp: maxVal || 1,
        max_vc: maxVal || 1,
        max: maxVal || 1,
        sum_vp: sumVal || 1,
        sum_vc: sumVal || 1,
        sum: sumVal || 1,
        i
      };
      const res = evaluateMathExpression(expr, scope, v);
      return Math.max(0, Number.isFinite(res) ? Number(res.toFixed(precision)) : v);
    });
    return { equalized, factor: 1 };
  }

  return { equalized: [...values], factor: 1 };
};

/**
 * Computes equalization across a 2D matrix (n alternatives x m criteria).
 * Equalizes each criterion column j according to its equalization configuration.
 */
export const computeEqualizationMatrix = (
  matrix: number[][],
  configs?: EqualizationOptions | EqualizationOptions[]
): number[][] => {
  const n = matrix.length;
  if (n === 0) return [];
  const m = matrix[0]?.length || 0;
  if (m === 0) return Array.from({ length: n }, () => []);

  const equalizedCols: number[][] = [];
  for (let j = 0; j < m; j++) {
    const colValues = matrix.map(row => row[j] ?? 0);
    const cfg = Array.isArray(configs) ? configs[j] : configs;
    const { equalized } = computeEqualizationVector(colValues, cfg);
    equalizedCols.push(equalized);
  }

  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => equalizedCols[j][i])
  );
};

/**
 * Computes relative population adjustments (ca), relative contextual values (V^CR),
 * scale normalization factor (cn), and final equiparated values (V^CRN).
 */
export const computeCharacteristicAdjustment = (
  char: Characteristic,
  VC: number[],
  allVCs: number[][]
): { ca: number[]; VCR: number[]; cn: number; VCRN: number[] } => {
  const popVC = char.adj.byPop !== -1 && allVCs[char.adj.byPop] ? allVCs[char.adj.byPop] : undefined;
  const { ca, VCR } = computeRelativeAdjustment(VC, {
    type: 'byPop',
    byPop: char.adj.byPop,
    populationVC: popVC
  });

  const { equalized: VCRN, factor: cn } = computeEqualizationVector(VCR, {
    type: char.adj.normType,
    obj: char.adj.obj,
    customExpr: char.adj.customExpr
  });

  return { ca, VCR, cn, VCRN };
};

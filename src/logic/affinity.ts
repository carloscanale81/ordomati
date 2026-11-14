import { Characteristic, PropagationConfig, SynergyConfig } from './types';

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
  expr: string
): number => {
  if (!expr || !expr.trim()) return 0;
  try {
    if (!/^[a-zA-Z0-9_\s.+\-*/%(),^]+$/.test(expr)) return 0;
    const jsExpr = expr.replace(/\^/g, '**');
    const fn = new Function(
      ...MATH_KEYS,
      'd',
      'L',
      'L1',
      'L2',
      `"use strict"; return (${jsExpr});`
    );
    const res = Number(fn(...MATH_VALS, d, limit, l1, limit));
    if (!Number.isFinite(res)) return 0;
    return Math.max(0, Math.min(1, res));
  } catch {
    return 0;
  }
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
export const computeAffinityMatrix = (d: (number | null | undefined)[][], prop: PropagationConfig): number[][] => {
  return d.map((row, i) =>
    row.map((val, j) => {
      // Direct self-identity: identical elements always have full affinity
      if (i === j) return 1;

      // When there are no distance values entered for distinct elements (val is null/undefined/NaN),
      // it is not distance 0 (not full affinity); it represents no distance data, yielding 0 affinity.
      if (val === null || val === undefined || !Number.isFinite(val)) {
        return 0;
      }

      // Explicit distance 0 between distinct elements
      if (val === 0) return 1;

      const l1 = prop.l1 || 0;
      const l2 = prop.limit || 1;

      switch (prop.type) {
        case 'triangular':
          return val <= l2 ? (l2 - val) / l2 : 0;
        case 'rectangular':
          return val <= l2 ? 1 : 0;
        case 'trapezoidal':
          return val <= l1 ? 1 : val <= l2 ? (l2 - val) / (l2 - l1 || 1) : 0;
        case 'sinusoidal':
          return val <= l2 ? 0.5 * (1 + Math.cos(Math.PI * (val / l2))) : 0;
        case 'custom':
          return evaluateCustomPropagation(val, l2, l1, prop.customExpr || 'exp(-d / 2)');
        case 'inhibited':
          return 0;
        default:
          return 0;
      }
    })
  );
};

/**
 * Computes the Autoinduced Affinity Matrix A^A from affinity A and blocking vector V^B.
 * 
 * Mathematical Formulation:
 * 1. For each row i, compute total affinity S_i = sum_j(a_ij).
 * 2. If S_i - 1 < 1e-12 (element has no exterior affinities):
 *    Row i collapses to the identity vector (a_ii = 1, a_ij = 0 for j != i).
 * 3. Compute the internal self-retention coefficient:
 *    s_i = 1 - (1 - V^B_i) * (1 - 1 / S_i)
 *    - When V^B_i = 1 (full block), s_i = 1 (complete self-retention, no outward flow).
 *    - When V^B_i = 0 (no block), s_i = 1 / S_i (proportional balance).
 * 4. Populate autoinduced matrix:
 *    - Diagonal: a^A_ii = s_i
 *    - Non-diagonal: a^A_ij = [a_ij / (S_i - 1)] * (1 - s_i)
 *    This ensures that each row preserves unit conservation: sum_j(a^A_ij) = 1.
 */
export const computeAutoinducedAffinity = (A: number[][], vb: number[]): number[][] => {
  return A.map((row, i) => {
    const rowSum = row.reduce((acc, v) => acc + v, 0);

    // If an alternative has no connection with any other element
    if (rowSum - 1 < 1e-12) {
      return row.map((_, j) => (i === j ? 1 : 0));
    }

    const blockFactor = vb[i] ?? 0;
    const s_val = 1 - (1 - blockFactor) * (1 - 1 / rowSum);

    return row.map((val, j) => (i === j ? s_val : (val / (rowSum - 1)) * (1 - s_val)));
  });
};

/**
 * Evaluates a custom synergy mathematical expression f(a, k).
 * Allowed variables: a (autoinduced affinity), k (synergy factor).
 * Supported math functions: exp, pow, sqrt, log, abs, min, max, sin, cos, pi, e.
 */
export const evaluateCustomSynergy = (
  a: number,
  k: number,
  expr: string
): number => {
  if (!expr || !expr.trim()) return a;
  try {
    if (!/^[a-zA-Z0-9_\s.+\-*/%(),^]+$/.test(expr)) return a;
    const jsExpr = expr.replace(/\^/g, '**');
    const fn = new Function(
      ...MATH_KEYS,
      'a',
      'k',
      `"use strict"; return (${jsExpr});`
    );
    const res = Number(fn(...MATH_VALS, a, k));
    if (!Number.isFinite(res)) return a;
    return Math.max(0, res);
  } catch {
    return a;
  }
};

/**
 * Computes the Contextual Affinity Matrix A^C by applying synergy function F_S to A^A.
 * 
 * Mathematical Formulation:
 * - Synergy models contextual reinforcement or damping among different alternatives.
 * - Diagonal elements (self-affinity) remain unchanged: a^C_ii = a^A_ii.
 * - When synergy type is 'factor', non-diagonal entries are modulated:
 *   a^C_ij = max(0, a^A_ij * k)
 * - When synergy type is 'custom', user-defined function f(a, k) modulates non-diagonal entries.
 * - When synergy type is 'none', the matrix remains identical: A^C = A^A.
 */
export const computeContextualAffinity = (AA: number[][], syn: SynergyConfig): number[][] => {
  return AA.map((row, i) =>
    row.map((val, j) => {
      if (i === j) return val;
      if (syn.type === 'factor') return Math.max(0, val * syn.k);
      if (syn.type === 'custom') {
        return evaluateCustomSynergy(val, syn.k, syn.customExpr || 'min(1, a * k)');
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
  AC: number[][]
): { vp: number[]; isQuasiInverse: boolean; invAC: number[][] } => {
  const n = VC.length;
  if (n === 0) return { vp: [], isQuasiInverse: false, invAC: [] };
  const { matrix: invAC, isQuasiInverse } = invertMatrixDetailed(AC);
  const vp: number[] = [];
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += (VC[k] || 0) * (invAC[k]?.[j] || 0);
    }
    vp.push(Math.max(0, sum));
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
 * Computes relative population adjustments (ca), relative contextual values (V^CR),
 * scale normalization factor (cn), and final equiparated values (V^CRN).
 * 
 * Mathematical Formulation:
 * 1. Relative Population Adjustment:
 *    - If a population reference characteristic is chosen (adj.byPop !== -1):
 *      ca_i = 1 / V^C_{pop, i} (if V^C_{pop, i} > 0, else 0).
 *    - Otherwise, ca_i = 1 (no relative scaling).
 *    - Relative Contextual Value: V^CR_i = V^C_i * ca_i.
 * 
 * 2. Equalization / Normalization (cn):
 *    - If normType is 'target' and obj > 0:
 *      cn = 1 / obj
 *    - If normType is 'maximum':
 *      cn = 1 / max(V^CR_i, 1e-9)
 * 
 * 3. Equiparated Contextual Value:
 *    - V^CRN_i = min(1, max(0, V^CR_i * cn))
 *    Guarantees that criterion evaluations are bounded in [0, 1] for subsequent OWA aggregation.
 */
export const computeCharacteristicAdjustment = (
  char: Characteristic,
  VC: number[],
  allVCs: number[][]
): { ca: number[]; VCR: number[]; cn: number; VCRN: number[] } => {
  const n = VC.length;
  let ca = Array(n).fill(1);

  // Apply population weighting if a reference characteristic is specified
  if (char.adj.byPop !== -1 && allVCs[char.adj.byPop]) {
    const populationContextualValues = allVCs[char.adj.byPop];
    ca = populationContextualValues.map(p => (p > 0 ? 1 / p : 0));
  }

  // Multiply by relative adjustment coefficient
  const VCR = VC.map((vc, i) => vc * ca[i]);

  // Compute scale normalization factor
  let cn = 1;
  if (char.adj.normType === 'target' && char.adj.obj > 0) {
    cn = 1 / char.adj.obj;
  } else {
    const maxVCR = Math.max(...VCR, 1e-9);
    cn = 1 / maxVCR;
  }

  // Clip equiparated value in [0, 1]
  const VCRN = VCR.map(v => Math.min(1, Math.max(0, v * cn)));

  return { ca, VCR, cn, VCRN };
};

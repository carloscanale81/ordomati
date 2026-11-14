import { AggregationResult } from './types';

/**
 * Normalizes the criteria correlation matrix C column-wise.
 * 
 * Mathematical Formulation:
 * - Each entry c_ij represents the mutual influence or correlation from criterion i to criterion j.
 * - Each column sum S_j = sum_i(c_ij).
 * - Normalized entry: c'_ij = c_ij / S_j (if S_j > 0, else 0).
 * This ensures that the weights received by each criterion are normalized to sum to 1.
 */
export const normalizeCorrelationMatrix = (cMatrix: number[][], m: number): number[][] => {
  const colSums = Array.from({ length: m }, (_, j) =>
    cMatrix.reduce((sum, row) => sum + (row[j] || 0), 0)
  );

  return cMatrix.map(row =>
    row.map((val, j) => (colSums[j] > 0 ? val / colSums[j] : 0))
  );
};

/**
 * Computes Reordered OWA Weights (OWA') for each alternative.
 * 
 * Mathematical Formulation:
 * In Ordered Weighted Averaging (Yager, 1988), weights are associated with order positions,
 * not with criteria identities.
 * 1. For each alternative i, the evaluation vector across criteria V_i = [V_i1, ..., V_im]
 *    is sorted in descending order:
 *      V_{i, pi(1)} >= V_{i, pi(2)} >= ... >= V_{i, pi(m)}
 * 2. If criterion j occupies rank r in the sorted sequence of alternative i,
 *    its assigned OWA weight is:
 *      OWA'_{ij} = owa[r]
 * This allows decision makers to model orness/andness attitudes (optimism vs. pessimism).
 */
export const computeReorderedOWA = (V: number[][], owa: number[]): number[][] => {
  return V.map(row => {
    // Sort criteria indexes by descending value of their performance for this alternative
    const sorted = row
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val);

    const ranks: number[] = [];
    sorted.forEach((item, r) => {
      ranks[item.idx] = r;
    });

    // Assign position-based OWA weight to the corresponding criterion
    return row.map((_, j) => owa[ranks[j]] || 0);
  });
};

/**
 * Computes Redistributed Weights (RWA) by projecting reordered OWA weights through C'.
 * 
 * Mathematical Formulation:
 * RWA_ij = sum_{k=1}^m (OWA'_{ik} * C'_{kj})
 * 
 * Combines the preferential position weights of the decision maker (from OWA')
 * with the structural interdependence and mutual support of criteria (from C').
 */
export const computeRedistributedWeights = (OWAp: number[][], Cn: number[][]): number[][] => {
  const m = Cn.length;
  return OWAp.map(row =>
    Array.from({ length: m }, (_, j) =>
      row.reduce((sum, val, k) => sum + val * (Cn[k]?.[j] || 0), 0)
    )
  );
};

/**
 * Computes the final aggregated score A_final and the overall ranking of alternatives.
 * 
 * Mathematical Formulation:
 * 1. Final score for alternative i:
 *    A_{final, i} = sum_{j=1}^m (V_ij * RWA_ij)
 * 2. Ranking:
 *    Permutation of alternative indices sorted by A_{final, i} in descending order.
 */
export const computeFinalAggregation = (
  V: number[][],
  Cn: number[][],
  OWAp: number[][],
  RWA: number[][]
): { A_final: number[]; ranking: number[] } => {
  const A_final = V.map((row, i) =>
    row.reduce((sum, val, j) => sum + val * (RWA[i]?.[j] || 0), 0)
  );

  const ranking = [...A_final]
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val)
    .map(item => item.idx);

  return { A_final, ranking };
};

/**
 * Executes the complete aggregation phase pipeline.
 * Coordinates matrix V construction, correlation normalization, OWA reordering,
 * weight redistribution, and final ranking calculation.
 */
export const aggregateResults = (
  elementsCount: number,
  characteristicsCount: number,
  VCRN_by_char: number[][], // List of m arrays of length n
  cMatrix: number[][],
  owa: number[]
): AggregationResult => {
  const n = elementsCount;
  const m = characteristicsCount;

  // Evaluation Matrix V (n x m): rows = alternatives, columns = criteria
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => VCRN_by_char[j]?.[i] || 0)
  );

  // Step 1: Column normalization of criterion correlation matrix C
  const Cn = normalizeCorrelationMatrix(cMatrix, m);

  // Step 2: Reorder OWA weights according to descending performance
  const OWAp = computeReorderedOWA(V, owa);

  // Step 3: Redistribute weights using the correlation matrix
  const RWA = computeRedistributedWeights(OWAp, Cn);

  // Step 4: Final dot product aggregation and descending ranking
  const { A_final, ranking } = computeFinalAggregation(V, Cn, OWAp, RWA);

  return {
    V,
    Cn,
    OWAp,
    RWA,
    A_final,
    ranking
  };
};

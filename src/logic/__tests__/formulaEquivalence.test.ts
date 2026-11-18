import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAffinityMatrix,
  computeAutoinducedAffinity,
  computeContextualAffinity,
  computeInverseContextualValue,
  invertMatrixDetailed,
  evaluateCustomPropagation,
  evaluateCustomSynergy
} from '../affinity';
import { evaluateMathExpression } from '../mathExpression';
import { PropagationConfig, BlockingConfig, SynergyConfig } from '../types';

test('Formula Equivalence: Propagation pre-configured formulas match custom evaluation', () => {
  const distances = [0, 0.5, 1, 2, 3, 5, 8, 10, 15, 20];
  const L = 10;
  const L1 = 3;

  // 1. Triangular
  const triangularCode = 'd <= L ? (L - d) / L : 0';
  const propTri: PropagationConfig = { type: 'triangular', limit: L };
  const dMatrix = [distances];
  const triResults = computeAffinityMatrix(dMatrix, propTri)[0];

  distances.forEach((d, idx) => {
    // For i !== j (and d > 0):
    if (idx === 0) return; // self-identity is always 1
    const expected = triResults[idx];
    const customResult = evaluateCustomPropagation(d, L, 0, triangularCode);
    assert.strictEqual(
      customResult,
      expected,
      `Triangular at d=${d}: expected ${expected}, got ${customResult}`
    );
  });

  // 2. Rectangular
  const rectangularCode = 'd <= L ? 1 : 0';
  const propRect: PropagationConfig = { type: 'rectangular', limit: L };
  const rectResults = computeAffinityMatrix(dMatrix, propRect)[0];

  distances.forEach((d, idx) => {
    if (idx === 0) return;
    const expected = rectResults[idx];
    const customResult = evaluateCustomPropagation(d, L, 0, rectangularCode);
    assert.strictEqual(
      customResult,
      expected,
      `Rectangular at d=${d}: expected ${expected}, got ${customResult}`
    );
  });

  // 3. Trapezoidal
  const trapezoidalCode = 'd <= L1 ? 1 : (d <= L ? (L - d) / (L - L1) : 0)';
  const propTrap: PropagationConfig = { type: 'trapezoidal', limit: L, l1: L1 };
  const trapResults = computeAffinityMatrix(dMatrix, propTrap)[0];

  distances.forEach((d, idx) => {
    if (idx === 0) return;
    const expected = trapResults[idx];
    const customResult = evaluateCustomPropagation(d, L, L1, trapezoidalCode);
    assert.strictEqual(
      customResult,
      expected,
      `Trapezoidal at d=${d}: expected ${expected}, got ${customResult}`
    );
  });

  // 4. Sinusoidal
  const sinusoidalCode = 'd <= L ? 0.5 * (1 + cos(pi * d / L)) : 0';
  const propSin: PropagationConfig = { type: 'sinusoidal', limit: L };
  const sinResults = computeAffinityMatrix(dMatrix, propSin)[0];

  distances.forEach((d, idx) => {
    if (idx === 0) return;
    const expected = sinResults[idx];
    const customResult = evaluateCustomPropagation(d, L, 0, sinusoidalCode);
    assert.ok(
      Math.abs(customResult - expected) < 1e-12,
      `Sinusoidal at d=${d}: expected ${expected}, got ${customResult}`
    );
  });

  // 5. Inhibited
  const inhibitedCode = '0';
  const propInh: PropagationConfig = { type: 'inhibited', limit: L };
  const inhResults = computeAffinityMatrix(dMatrix, propInh)[0];

  distances.forEach((d, idx) => {
    if (idx === 0) return;
    const expected = inhResults[idx];
    const customResult = evaluateCustomPropagation(d, L, 0, inhibitedCode);
    assert.strictEqual(
      customResult,
      expected,
      `Inhibited at d=${d}: expected ${expected}, got ${customResult}`
    );
  });
});

test('Formula Equivalence: Blocking standard formula matches custom evaluation', () => {
  const A = [
    [1.0, 0.4, 0.2],
    [0.4, 1.0, 0.8],
    [0.2, 0.8, 1.0]
  ];
  const vb = [0.2, 0.5, 0.9];
  const standardCode = 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))';

  const autoinducedStandard = computeAutoinducedAffinity(A, vb, { type: 'standard' });
  const autoinducedCustom = computeAutoinducedAffinity(A, vb, { type: 'custom', customExpr: standardCode });

  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[i].length; j++) {
      assert.ok(
        Math.abs(autoinducedStandard[i][j] - autoinducedCustom[i][j]) < 1e-12,
        `Blocking at [${i},${j}]: standard=${autoinducedStandard[i][j]}, custom=${autoinducedCustom[i][j]}`
      );
    }
  }
});

test('Formula Equivalence: Synergy none and factor formulas match custom evaluation', () => {
  const AA = [
    [0.6, 0.25, 0.15],
    [0.2, 0.5, 0.3],
    [0.1, 0.4, 0.5]
  ];
  const k = 1.35;

  // 1. None
  const noneCode = 'a';
  const synNone = computeContextualAffinity(AA, { type: 'none', k: 1 });
  const synCustomNone = computeContextualAffinity(AA, { type: 'custom', customExpr: noneCode, k: 1 });
  assert.deepStrictEqual(synNone, synCustomNone, 'Synergy None matches customExpr "a"');

  // 2. Factor
  const factorCode = 'a * k';
  const synFactor = computeContextualAffinity(AA, { type: 'factor', k });
  const synCustomFactor = computeContextualAffinity(AA, { type: 'custom', customExpr: factorCode, k });
  for (let i = 0; i < AA.length; i++) {
    for (let j = 0; j < AA[i].length; j++) {
      assert.ok(
        Math.abs(synFactor[i][j] - synCustomFactor[i][j]) < 1e-12,
        `Synergy Factor at [${i},${j}]: factor=${synFactor[i][j]}, custom=${synCustomFactor[i][j]}`
      );
    }
  }
});

test('Formula Equivalence: Soccer MVP formulas match custom evaluation', () => {
  // Blocking threshold
  const A_val = 0.3;
  const theta = 0.25;
  const blockThresholdCode = 'a < theta ? 0 : a';
  const expectedBlock = A_val < theta ? 0 : A_val;
  const customBlock = evaluateMathExpression(blockThresholdCode, { a: A_val, theta, umbral: theta });
  assert.strictEqual(customBlock, expectedBlock);

  // Relative byMinutes
  const m = 45;
  const T = 90;
  const relMinutesCode = 'minutos / minutos_totales';
  const expectedRel = m / T;
  const customRel = evaluateMathExpression(relMinutesCode, { minutos: m, minutos_totales: T });
  assert.strictEqual(customRel, expectedRel);

  // Equalization max
  const vp = 3.5;
  const max_vp = 7.0;
  const eqMaxCode = 'vp / max_vp';
  const expectedEq = vp / max_vp;
  const customEq = evaluateMathExpression(eqMaxCode, { vp, max_vp });
  assert.strictEqual(customEq, expectedEq);
});

import { createRecreationMatchData2007644 } from '../matchScraper';
import { parseSoccerTimeline, computeSoccerDimensionalAnalysis } from '../soccerAnalysis';

test('Formula Equivalence: Value Conservation in SoccerDimensionalAnalysis without synergy', () => {
  const match = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(match);
  const seg = timeline.homeSegments[0];
  const analysis = computeSoccerDimensionalAnalysis(match, seg, true, { type: 'none', k: 1.0 }, 'dribblesWon');

  // Verify AC has unit row sums
  analysis.AC.forEach((row, i) => {
    const sum = row.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-4, `Row ${i} of AC must sum to 1.0`);
  });

  // Verify total value conservation: sum(VP) == sum(VC)
  const sumVC = analysis.VC.reduce((a, b) => a + b, 0);
  const sumVP = analysis.VP!.reduce((a, b) => a + b, 0);
  assert.ok(
    Math.abs(sumVP - sumVC) < 1e-3,
    `Total value must be conserved: sum(VP)=${sumVP} vs sum(VC)=${sumVC}`
  );
});

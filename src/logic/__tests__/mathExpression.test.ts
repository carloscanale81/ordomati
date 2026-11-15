import { test } from 'node:test';
import assert from 'node:assert';
import { evaluateMathExpression } from '../mathExpression';
import { createEmptyDataset } from '../defaults';
import { calculateOrdomatica } from '../engine';
import { computeAutoinducedAffinity, computeContextualAffinity } from '../affinity';

test('Math.js Evaluator: evaluates basic arithmetic and exponentiation', () => {
  assert.strictEqual(evaluateMathExpression('2 + 3 * 4', {}), 14);
  assert.strictEqual(evaluateMathExpression('2 ^ 3', {}), 8);
  assert.strictEqual(evaluateMathExpression('(10 - 4) / 2', {}), 3);
});

test('Math.js Evaluator: evaluates math functions and constants', () => {
  assert.strictEqual(evaluateMathExpression('abs(-5)', {}), 5);
  assert.strictEqual(evaluateMathExpression('sqrt(16)', {}), 4);
  assert.strictEqual(evaluateMathExpression('max(2, 8, 3)', {}), 8);
  assert.strictEqual(evaluateMathExpression('min(2, 8, 3)', {}), 2);
  const expVal = evaluateMathExpression('exp(0)', {});
  assert.strictEqual(expVal, 1);
});

test('Math.js Evaluator: evaluates ternary conditional expressions', () => {
  assert.strictEqual(evaluateMathExpression('d <= L ? 1 : 0', { d: 5, L: 10 }), 1);
  assert.strictEqual(evaluateMathExpression('d <= L ? 1 : 0', { d: 15, L: 10 }), 0);
  assert.strictEqual(evaluateMathExpression('a < theta ? 0 : a', { a: 0.05, theta: 0.15 }), 0);
  assert.strictEqual(evaluateMathExpression('a < theta ? 0 : a', { a: 0.25, theta: 0.15 }), 0.25);
});

test('Math.js Evaluator: evaluates gaussian propagation formula exp(-(d / L)^2)', () => {
  const val = evaluateMathExpression('exp(- (d / L)^2)', { d: 0, L: 10 });
  assert.strictEqual(val, 1);

  const valHalf = evaluateMathExpression('exp(- (d / L)^2)', { d: 10, L: 10 });
  assert.ok(Math.abs(valHalf - Math.exp(-1)) < 1e-4);
});

test('Math.js Evaluator: safely handles invalid or malicious expressions with fallback', () => {
  assert.strictEqual(evaluateMathExpression('console.log("hacked")', {}, 42), 42);
  assert.strictEqual(evaluateMathExpression('process.exit(1)', {}, 0), 0);
  assert.strictEqual(evaluateMathExpression('invalid syntax +++', {}, 99), 99);
});

test('calculateOrdomatica handles empty initial dataset without crashing', () => {
  const emptyDataset = createEmptyDataset();
  assert.strictEqual(emptyDataset.elements.length, 0);
  assert.strictEqual(emptyDataset.characteristics.length, 0);

  const result = calculateOrdomatica(emptyDataset);
  assert.deepStrictEqual(result.chars, []);
  assert.deepStrictEqual(result.agg.A_final, []);
  assert.deepStrictEqual(result.agg.ranking, []);
});

test('Blocking: Standard Thesis Power Formula preserves unit row sum and matches image', () => {
  // 3 alternatives, affinity matrix A
  const A = [
    [1, 0.5, 0.5], // Row sum = 2
    [0.5, 1, 0.5],
    [0.5, 0.5, 1]
  ];

  // 1. Full block vb = 1
  const AA_full = computeAutoinducedAffinity(A, [1, 0, 0.5], { type: 'standard' });
  // Row 0: vb=1 -> diagonal is (1/2)^(1-1) = 1, off-diagonal = 0
  assert.strictEqual(AA_full[0][0], 1);
  assert.strictEqual(AA_full[0][1], 0);
  assert.strictEqual(AA_full[0][2], 0);

  // Row 1: vb=0 -> diagonal is (1/2)^(1-0) = 0.5, off-diagonal = 0.5 / (2-1) * (1 - 0.5) = 0.25
  assert.strictEqual(AA_full[1][1], 0.5);
  assert.strictEqual(AA_full[1][0], 0.25);
  assert.strictEqual(AA_full[1][2], 0.25);
  const row1Sum = AA_full[1].reduce((sum, v) => sum + v, 0);
  assert.ok(Math.abs(row1Sum - 1) < 1e-12);

  // Row 2: vb=0.5 -> diagonal is (1/2)^0.5 = 1/sqrt(2) = 0.707106...
  const expectedDiag = Math.pow(0.5, 0.5);
  assert.ok(Math.abs(AA_full[2][2] - expectedDiag) < 1e-10);
  const expectedOff = (0.5 / (2 - 1)) * (1 - expectedDiag);
  assert.ok(Math.abs(AA_full[2][0] - expectedOff) < 1e-10);
  const row2Sum = AA_full[2].reduce((sum, v) => sum + v, 0);
  assert.ok(Math.abs(row2Sum - 1) < 1e-12);
});

test('Blocking: Custom function evaluates user-defined expression', () => {
  const A = [
    [1, 0.6, 0.4],
    [0.6, 1, 0.2],
    [0.4, 0.2, 1]
  ];
  const customExpr = 'i == j ? 1 : (a < 0.5 ? 0 : a)';
  const AA_custom = computeAutoinducedAffinity(A, [0, 0, 0], { type: 'custom', customExpr });
  assert.strictEqual(AA_custom[0][0], 1);
  assert.strictEqual(AA_custom[0][1], 0.6);
  assert.strictEqual(AA_custom[0][2], 0); // 0.4 < 0.5 filtered out
});

test('Synergy: Custom function operates without factor K', () => {
  const AA = [
    [1, 0.4],
    [0.4, 1]
  ];
  // Custom formula independent of k: sqrt(a)
  const AC = computeContextualAffinity(AA, { type: 'custom', k: 999, customExpr: 'sqrt(a)' });
  assert.strictEqual(AC[0][0], 1); // Diagonal unchanged
  assert.ok(Math.abs(AC[0][1] - Math.sqrt(0.4)) < 1e-6);
});

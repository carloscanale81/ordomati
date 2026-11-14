import { test } from 'node:test';
import assert from 'node:assert';
import { parseToken, evaluateElementInput } from '../fuzzy';
import { Characteristic } from '../types';

test('parseToken: supports standard numbers, intervals and labels', () => {
  const real = parseToken('42.5', 5);
  assert.strictEqual(real.t, 'real');
  if (real.t === 'real') assert.strictEqual(real.v, 42.5);

  const int = parseToken('[10, 20]', 5);
  assert.strictEqual(int.t, 'int');
  if (int.t === 'int') {
    assert.strictEqual(int.a, 10);
    assert.strictEqual(int.b, 20);
  }

  const label = parseToken('B', 5);
  assert.strictEqual(label.t, 'tup');
  if (label.t === 'tup') {
    assert.strictEqual(label.i, 1);
    assert.strictEqual(label.gamma, 0);
    assert.strictEqual(label.pure, true);
  }
});

test('parseToken: supports 2-tuples with explicit granularity lower or equal to max', () => {
  // (MA, -0.2)@5 with max granularity 5
  const tup5 = parseToken('(MA, -0.2)@5', 5);
  assert.strictEqual(tup5.t, 'tup');
  if (tup5.t === 'tup') {
    assert.strictEqual(tup5.i, 4);
    assert.strictEqual(tup5.gamma, -0.2);
    assert.strictEqual(tup5.g, 5);
    assert.strictEqual(tup5.pure, false);
  }

  // (B, 0.1)@3 with max granularity 7 (3 <= 7)
  const tup3 = parseToken('(B, 0.1)@3', 7);
  assert.strictEqual(tup3.t, 'tup');
  if (tup3.t === 'tup') {
    assert.strictEqual(tup3.i, 0);
    assert.strictEqual(tup3.gamma, 0.1);
    assert.strictEqual(tup3.g, 3);
  }

  // Pure label with explicit granularity: B@3 with max 5
  const labelWithG = parseToken('B@3', 5);
  assert.strictEqual(labelWithG.t, 'tup');
  if (labelWithG.t === 'tup') {
    assert.strictEqual(labelWithG.i, 0);
    assert.strictEqual(labelWithG.g, 3);
    assert.strictEqual(labelWithG.pure, true);
  }
});

test('parseToken: rejects granularity higher than defined maximum', () => {
  // Max granularity is 5, but input requests @7
  const res = parseToken('(MA, -0.2)@7', 5);
  assert.strictEqual(res.t, 'err');
  if (res.t === 'err') {
    assert.match(res.msg, /no puede superar la máxima definida/);
  }
});

test('evaluateElementInput: evaluates qualitative with multigranularity 2-tuple', () => {
  const char: Characteristic = {
    id: 1,
    name: 'Cualitativa',
    type: 'qualitative',
    min: 0,
    max: 100,
    g: 7,
    rawInputs: [],
    d: [[0]],
    vb: [0],
    prop: { type: 'inhibited', limit: 0 },
    syn: { type: 'none', k: 1 },
    adj: { byPop: -1, normType: 'maximum', obj: 1 }
  };

  // On g=5, (MA, -0.2) has beta = 4 + (-0.2) = 3.8 (ratio = 3.8/4 = 0.95)
  // Scaled to g=7: beta_7 = 0.95 * 6 = 5.7
  // Normalized V^P = 5.7 / 6 = 0.95
  const evalResult = evaluateElementInput('(MA, -0.2)@5', char);
  assert.strictEqual(evalResult.tokens[0].valid, true);
  assert.strictEqual(evalResult.tokens[0].trace.includes('Multigranularity (g=5)'), true);
  assert.ok(Math.abs(evalResult.val - 0.95) < 1e-4);
});

test('evaluateElementInput: supports independent dynamic min and manual max', () => {
  const char: Characteristic = {
    id: 2,
    name: 'Cuantitativa',
    type: 'quantitative',
    min: 0,
    max: 100, // manual max = 100
    minMode: 'dynamic', // dynamic min
    maxMode: 'manual',
    g: 5,
    rawInputs: ['10', '20', '50'], // dynMin = 10, dynMax = 50
    d: [[0]],
    vb: [0],
    prop: { type: 'triangular', limit: 10 },
    syn: { type: 'none', k: 1 },
    adj: { byPop: -1, normType: 'maximum', obj: 1 }
  };

  // With min=10 and max=100: for input 55, norm = (55 - 10) / (100 - 10) = 45 / 90 = 0.5
  const res = evaluateElementInput('55', char);
  assert.strictEqual(res.tokens[0].valid, true);
  assert.ok(Math.abs(res.val - 0.5) < 1e-4);
});

test('custom propagation and synergy evaluate custom math functions', async () => {
  const { evaluateCustomPropagation, evaluateCustomSynergy } = await import('../affinity');

  // Propagation custom formula: exp(-d / L)
  // For d = 10, L = 10: exp(-1) = 0.367879...
  const pVal = evaluateCustomPropagation(10, 10, 0, 'exp(-d / L)');
  assert.ok(Math.abs(pVal - Math.exp(-1)) < 1e-4);

  // Synergy custom formula: min(1, a * k)
  // For a = 0.4, k = 1.5: 0.6
  const sVal = evaluateCustomSynergy(0.4, 1.5, 'min(1, a * k)');
  assert.ok(Math.abs(sVal - 0.6) < 1e-6);
});

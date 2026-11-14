import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSampleMatrices, computeACFromSampling } from '../affinity';
import { calculateOrdomatica } from '../engine';
import { createDefaultDataset } from '../defaults';

test('Sampling AC: Linearly independent vectors calculation suite', async (t) => {
  await t.test('createDefaultSampleMatrices generates regular invertible sampleVP and matching sampleVC', () => {
    const n = 3;
    const baseVP = [0.8, 0.4, 0.6];
    const baseAC = [
      [1.0, 0.3, 0.2],
      [0.3, 1.0, 0.4],
      [0.2, 0.4, 1.0]
    ];

    const { sampleVP, sampleVC } = createDefaultSampleMatrices(n, baseVP, baseAC);
    assert.equal(sampleVP.length, n);
    assert.equal(sampleVC.length, n);

    const { AC, isQuasiInverse } = computeACFromSampling(sampleVP, sampleVC);
    assert.equal(isQuasiInverse, false, 'sampleVP should be regular / invertible');
    assert.equal(AC.length, n);

    // Verify AC matches baseAC within precision
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        assert.ok(
          Math.abs(AC[i][j] - baseAC[i][j]) < 1e-4,
          `AC[${i}][${j}] should match baseAC[${i}][${j}]`
        );
      }
    }
  });

  await t.test('calculateOrdomatica executes cleanly with calcTarget === "ac"', () => {
    const dataset = createDefaultDataset();
    dataset.characteristics[0].calcTarget = 'ac';

    const result = calculateOrdomatica(dataset);
    assert.ok(result.chars[0]);
    assert.ok(result.chars[0].sampleVP);
    assert.ok(result.chars[0].sampleVC);
    assert.ok(result.chars[0].invSampleVP);
    assert.equal(result.chars[0].isSampleQuasiInverse, false);
    assert.equal(result.chars[0].AC.length, dataset.elements.length);
  });
});

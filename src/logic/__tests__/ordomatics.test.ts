import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultDataset, calculateOrdomatica } from '../index';
import { serializeFullCase, deserializeFullCase } from '../../io/serializer';

test('Full Case Serialization & Deserialization preserves complete state', () => {
  const original = createDefaultDataset();
  
  // Add an empty characteristic to test that empty/unpopulated fields are fully preserved
  original.characteristics.push({
    id: 99,
    name: 'EmptyChar',
    type: 'quantitative',
    min: 0,
    max: 50,
    g: 3,
    sem: 'core',
    rawInputs: ['', '', '', ''],
    d: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    vb: [0, 0, 0, 0],
    prop: { type: 'inhibited', limit: 0, l1: 0 },
    syn: { type: 'none', k: 1 },
    adj: { byPop: -1, normType: 'maximum', obj: 1 }
  });

  // Expand cMatrix and owa to 3 characteristics
  original.cMatrix = [
    [1, 0.3, 0],
    [0.3, 1, 0],
    [0, 0, 1]
  ];
  original.owa = [1, 0.9, 0.8];

  const serialized = serializeFullCase(original);
  assert.ok(typeof serialized === 'string', 'Serialized result should be a string');

  const restored = deserializeFullCase(serialized);

  assert.equal(restored.elements.length, original.elements.length, 'Element count matches');
  assert.deepEqual(restored.elements, original.elements, 'Element names match exactly');

  assert.equal(restored.characteristics.length, original.characteristics.length, 'Characteristic count matches');
  assert.equal(restored.characteristics[2].name, 'EmptyChar', 'Empty characteristic is preserved');
  assert.deepEqual(restored.characteristics[2].rawInputs, ['', '', '', ''], 'Empty raw inputs preserved');
  assert.deepEqual(restored.characteristics[0].d, original.characteristics[0].d, 'Distance matrix preserved');
  assert.deepEqual(restored.characteristics[0].vb, original.characteristics[0].vb, 'Blocking vector preserved');
  assert.deepEqual(restored.characteristics[0].prop, original.characteristics[0].prop, 'Propagation config preserved');
  assert.deepEqual(restored.characteristics[0].syn, original.characteristics[0].syn, 'Synergy config preserved');
  assert.deepEqual(restored.characteristics[0].adj, original.characteristics[0].adj, 'Adjustment config preserved');
  assert.deepEqual(restored.cMatrix, original.cMatrix, 'Correlation matrix preserved');
  assert.deepEqual(restored.owa, original.owa, 'OWA weights preserved');
});

test('calculateOrdomatica executes cleanly on full case', () => {
  const dataset = createDefaultDataset();
  const result = calculateOrdomatica(dataset);

  assert.ok(result.chars.length === dataset.characteristics.length, 'All characteristics processed');
  assert.ok(result.agg.A_final.length === dataset.elements.length, 'Scores calculated for all elements');
  assert.ok(result.agg.ranking.length === dataset.elements.length, 'Ranking has all element indices');
  
  // All final scores should be non-negative real numbers
  result.agg.A_final.forEach(score => {
    assert.ok(Number.isFinite(score) && score >= 0, 'Score is finite and non-negative');
  });
});

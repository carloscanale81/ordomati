import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTimestampVersion, APP_BUILD_VERSION } from '../version';

test('Version: Timestamp-based version generator', async (t) => {
  await t.test('formats date correctly as YYYYMMDDhhmmss', () => {
    // 2026-03-05 09:07:04
    const d = new Date(2026, 2, 5, 9, 7, 4);
    const v = generateTimestampVersion(d);
    assert.equal(v, '20260305090704');
    assert.equal(v.length, 14);
  });

  await t.test('APP_BUILD_VERSION is a 14-digit timestamp string', () => {
    assert.ok(typeof APP_BUILD_VERSION === 'string');
    assert.match(APP_BUILD_VERSION, /^\d{14}$/);
  });
});

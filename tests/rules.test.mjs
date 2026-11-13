import assert from "node:assert/strict";
import test from "node:test";

import { distributeSum, getSumSupport, isValidSum } from "../scripts/rules.mjs";

test("a plain 16d10 term exposes the expected sum range", () => {
  const support = getSumSupport({ number: 16, minResult: 1, maxResult: 10 });
  assert.deepEqual(support, { supported: true, min: 16, max: 160, hasReroll: false });
  assert.equal(isValidSum(16, support), true);
  assert.equal(isValidSum(160, support), true);
  assert.equal(isValidSum(15, support), false);
  assert.equal(isValidSum(161, support), false);
});

test("a valid sum is internally distributed without changing its total", () => {
  const values = distributeSum(94, { number: 16, minResult: 1, maxResult: 10 });
  assert.equal(values.length, 16);
  assert.equal(values.reduce((total, value) => total + value, 0), 94);
  assert.ok(values.every(value => value >= 1 && value <= 10));
});

test("rerolls can be entered as an already resolved physical sum", () => {
  const support = getSumSupport({ number: 2, minResult: 1, maxResult: 6, modifiers: ["r1"] });
  assert.equal(support.supported, true);
  assert.equal(support.hasReroll, true);
});

test("keep, drop, and exploding modifiers stay in individual mode", () => {
  for (const modifier of ["kh1", "dl1", "x"]) {
    const support = getSumSupport({ number: 2, minResult: 1, maxResult: 6, modifiers: [modifier] });
    assert.deepEqual(support, { supported: false, reason: "modifier", modifier });
  }
});

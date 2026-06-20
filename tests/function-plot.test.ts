import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFunctionPlotData, normalizeFunctionPlot } from '../src/lib/function-plot.js';

test('evaluates whitelisted Math expressions', () => {
  const data = generateFunctionPlotData({
    expression: 'Math.sin(x) + Math.cos(0)',
    xMin: 0,
    xMax: 0,
    step: 1,
    yMin: -10,
    yMax: 10,
  });

  assert.deepEqual(data, [[0, 1]]);
});

test('supports exponent operators and bare constants', () => {
  const data = generateFunctionPlotData({
    expression: 'x^2 + PI - Math.PI',
    xMin: -2,
    xMax: 2,
    step: 2,
    yMin: -10,
    yMax: 10,
  });

  assert.deepEqual(data, [[-2, 4], [0, 0], [2, 4]]);
});

test('falls back safely for non-whitelisted expressions', () => {
  const data = generateFunctionPlotData({
    expression: 'globalThis.alert(1)',
    xMin: 0,
    xMax: 0,
    step: 1,
    yMin: -10,
    yMax: 10,
  });

  assert.deepEqual(data, [[0, 0]]);
});

test('caps generated samples for extreme ranges', () => {
  const data = generateFunctionPlotData({
    expression: 'x',
    xMin: 0,
    xMax: 1_000_000,
    step: 0.01,
    yMin: 0,
    yMax: 1_000_000,
  });

  assert.ok(data.length <= 5001);
});

test('normalizes invalid numeric config to defaults', () => {
  const plot = normalizeFunctionPlot({
    expression: '',
    xMin: Number.NaN,
    xMax: Number.POSITIVE_INFINITY,
    step: 0,
    yMin: Number.NaN,
    yMax: Number.NEGATIVE_INFINITY,
  });

  assert.equal(plot.expression.length > 0, true);
  assert.equal(Number.isFinite(plot.xMin), true);
  assert.equal(Number.isFinite(plot.xMax), true);
  assert.equal(plot.step > 0, true);
  assert.equal(Number.isFinite(plot.yMin), true);
  assert.equal(Number.isFinite(plot.yMax), true);
});

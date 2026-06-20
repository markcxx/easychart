import { ChartFunctionPlot } from '@/types';

export const DEFAULT_FUNCTION_PLOT: ChartFunctionPlot = {
  expression: 'Math.sin(x / 10) * Math.cos((x / 10) * 2 + 1) * Math.sin((x / 10) * 3 + 2) * 50',
  xMin: -200,
  xMax: 200,
  step: 0.5,
  yMin: -100,
  yMax: 100,
};

export function normalizeFunctionPlot(config?: Partial<ChartFunctionPlot>): ChartFunctionPlot {
  const merged = { ...DEFAULT_FUNCTION_PLOT, ...(config || {}) };

  return {
    expression: merged.expression || DEFAULT_FUNCTION_PLOT.expression,
    xMin: Number.isFinite(merged.xMin) ? merged.xMin : DEFAULT_FUNCTION_PLOT.xMin,
    xMax: Number.isFinite(merged.xMax) ? merged.xMax : DEFAULT_FUNCTION_PLOT.xMax,
    step: Number.isFinite(merged.step) && merged.step > 0 ? merged.step : DEFAULT_FUNCTION_PLOT.step,
    yMin: Number.isFinite(merged.yMin) ? merged.yMin : DEFAULT_FUNCTION_PLOT.yMin,
    yMax: Number.isFinite(merged.yMax) ? merged.yMax : DEFAULT_FUNCTION_PLOT.yMax,
  };
}

export function generateFunctionPlotData(config?: Partial<ChartFunctionPlot>) {
  const plot = normalizeFunctionPlot(config);
  const data: number[][] = [];
  const expression = plot.expression.trim() || DEFAULT_FUNCTION_PLOT.expression;

  let evaluator: (x: number, Math: Math) => number;

  try {
    evaluator = new Function('x', 'Math', `"use strict"; return (${expression});`) as (x: number, Math: Math) => number;
  } catch {
    evaluator = new Function('x', 'Math', `"use strict"; return (${DEFAULT_FUNCTION_PLOT.expression});`) as (x: number, Math: Math) => number;
  }

  const start = Math.min(plot.xMin, plot.xMax);
  const end = Math.max(plot.xMin, plot.xMax);
  const step = Math.max(plot.step, 0.01);

  for (let x = start; x <= end; x += step) {
    try {
      const y = evaluator(x, Math);
      if (Number.isFinite(y)) {
        data.push([Number(x.toFixed(4)), Number(y.toFixed(4))]);
      }
    } catch {
      return generateFunctionPlotData(DEFAULT_FUNCTION_PLOT);
    }
  }

  return data;
}

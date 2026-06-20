import type { ChartFunctionPlot } from '../types.js';

export const DEFAULT_FUNCTION_PLOT: ChartFunctionPlot = {
  expression: 'Math.sin(x / 10) * Math.cos((x / 10) * 2 + 1) * Math.sin((x / 10) * 3 + 2) * 50',
  xMin: -200,
  xMax: 200,
  step: 0.5,
  yMin: -100,
  yMax: 100,
};

const MAX_FUNCTION_PLOT_POINTS = 5000;
const MIN_FUNCTION_PLOT_STEP = 0.01;
const MAX_EXPRESSION_LENGTH = 500;

type Evaluator = (x: number) => number;

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '%' | '^' | '**' }
  | { type: 'leftParen' }
  | { type: 'rightParen' }
  | { type: 'comma' }
  | { type: 'dot' };

const MATH_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  abs: Math.abs,
  acos: Math.acos,
  acosh: Math.acosh,
  asin: Math.asin,
  asinh: Math.asinh,
  atan: Math.atan,
  atan2: Math.atan2,
  atanh: Math.atanh,
  cbrt: Math.cbrt,
  ceil: Math.ceil,
  cos: Math.cos,
  cosh: Math.cosh,
  exp: Math.exp,
  expm1: Math.expm1,
  floor: Math.floor,
  hypot: Math.hypot,
  log: Math.log,
  log10: Math.log10,
  log1p: Math.log1p,
  log2: Math.log2,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  round: Math.round,
  sign: Math.sign,
  sin: Math.sin,
  sinh: Math.sinh,
  sqrt: Math.sqrt,
  tan: Math.tan,
  tanh: Math.tanh,
  trunc: Math.trunc,
};

const FUNCTION_ARITY: Record<string, { min: number; max: number }> = {
  atan2: { min: 2, max: 2 },
  hypot: { min: 1, max: 8 },
  max: { min: 1, max: 8 },
  min: { min: 1, max: 8 },
  pow: { min: 2, max: 2 },
};

const CONSTANTS: Record<string, number> = {
  E: Math.E,
  PI: Math.PI,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
  SQRT1_2: Math.SQRT1_2,
  SQRT2: Math.SQRT2,
};

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const numberMatch = input
      .slice(index)
      .match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);

    if (numberMatch) {
      tokens.push({ type: 'number', value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = input.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);

    if (identifierMatch) {
      tokens.push({ type: 'identifier', value: identifierMatch[0] });
      index += identifierMatch[0].length;
      continue;
    }

    if (input.startsWith('**', index)) {
      tokens.push({ type: 'operator', value: '**' });
      index += 2;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%' || char === '^') {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'leftParen' });
      index += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rightParen' });
      index += 1;
      continue;
    }

    if (char === ',') {
      tokens.push({ type: 'comma' });
      index += 1;
      continue;
    }

    if (char === '.') {
      tokens.push({ type: 'dot' });
      index += 1;
      continue;
    }

    return null;
  }

  return tokens;
}

class ExpressionParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Evaluator | null {
    const evaluator = this.parseExpression();
    if (!evaluator || this.peek()) return null;
    return evaluator;
  }

  private parseExpression(): Evaluator | null {
    return this.parseAdditive();
  }

  private parseAdditive(): Evaluator | null {
    let left = this.parseMultiplicative();
    if (!left) return null;

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous() as Extract<Token, { type: 'operator' }>;
      const right = this.parseMultiplicative();
      if (!right) return null;
      const currentLeft: Evaluator = left;
      left = operator.value === '+'
        ? ((x: number) => currentLeft(x) + right(x))
        : ((x: number) => currentLeft(x) - right(x));
    }

    return left;
  }

  private parseMultiplicative(): Evaluator | null {
    let left = this.parsePower();
    if (!left) return null;

    while (this.matchOperator('*') || this.matchOperator('/') || this.matchOperator('%')) {
      const operator = this.previous() as Extract<Token, { type: 'operator' }>;
      const right = this.parsePower();
      if (!right) return null;
      const currentLeft: Evaluator = left;

      if (operator.value === '*') {
        left = (x: number) => currentLeft(x) * right(x);
      } else if (operator.value === '/') {
        left = (x: number) => currentLeft(x) / right(x);
      } else {
        left = (x: number) => currentLeft(x) % right(x);
      }
    }

    return left;
  }

  private parsePower(): Evaluator | null {
    const left = this.parseUnary();
    if (!left) return null;

    if (!this.matchOperator('^') && !this.matchOperator('**')) return left;

    const right = this.parsePower();
    if (!right) return null;

    return (x) => Math.pow(left(x), right(x));
  }

  private parseUnary(): Evaluator | null {
    if (this.matchOperator('+')) return this.parseUnary();

    if (this.matchOperator('-')) {
      const evaluator = this.parseUnary();
      return evaluator ? (x) => -evaluator(x) : null;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Evaluator | null {
    const token = this.advance();
    if (!token) return null;

    if (token.type === 'number') return () => token.value;

    if (token.type === 'leftParen') {
      const evaluator = this.parseExpression();
      if (!evaluator || !this.match('rightParen')) return null;
      return evaluator;
    }

    if (token.type !== 'identifier') return null;

    const identifier = this.readIdentifierPath(token.value);

    if (this.match('leftParen')) {
      return this.parseFunctionCall(identifier);
    }

    if (identifier === 'x') return (x) => x;

    const constantName = identifier.startsWith('Math.')
      ? identifier.slice('Math.'.length)
      : identifier;
    const constant = CONSTANTS[constantName];

    return constant == null ? null : () => constant;
  }

  private parseFunctionCall(identifier: string): Evaluator | null {
    const functionName = identifier.startsWith('Math.')
      ? identifier.slice('Math.'.length)
      : identifier;
    const fn = MATH_FUNCTIONS[functionName];
    if (!fn) return null;

    const args: Evaluator[] = [];

    if (!this.check('rightParen')) {
      do {
        const arg = this.parseExpression();
        if (!arg) return null;
        args.push(arg);
      } while (this.match('comma'));
    }

    if (!this.match('rightParen')) return null;

    const arity = FUNCTION_ARITY[functionName] || { min: 1, max: 1 };
    if (args.length < arity.min || args.length > arity.max) return null;

    return (x) => fn(...args.map(arg => arg(x)));
  }

  private readIdentifierPath(initial: string) {
    if (!this.match('dot')) return initial;

    const property = this.advance();
    if (property?.type !== 'identifier') return initial;

    return `${initial}.${property.value}`;
  }

  private matchOperator(value: Extract<Token, { type: 'operator' }>['value']) {
    const token = this.peek();
    if (token?.type !== 'operator' || token.value !== value) return false;
    this.index += 1;
    return true;
  }

  private match(type: Token['type']) {
    if (!this.check(type)) return false;
    this.index += 1;
    return true;
  }

  private check(type: Token['type']) {
    return this.peek()?.type === type;
  }

  private advance() {
    const token = this.peek();
    if (token) this.index += 1;
    return token;
  }

  private previous() {
    return this.tokens[this.index - 1];
  }

  private peek() {
    return this.tokens[this.index];
  }
}

function createSafeEvaluator(expression: string): Evaluator | null {
  const source = expression.trim().slice(0, MAX_EXPRESSION_LENGTH);
  if (!source) return null;

  const tokens = tokenize(source);
  if (!tokens) return null;

  return new ExpressionParser(tokens).parse();
}

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
  const evaluator = createSafeEvaluator(plot.expression)
    || createSafeEvaluator(DEFAULT_FUNCTION_PLOT.expression)
    || (() => 0);

  const start = Math.min(plot.xMin, plot.xMax);
  const end = Math.max(plot.xMin, plot.xMax);
  const range = end - start;
  const step = Math.max(
    plot.step,
    MIN_FUNCTION_PLOT_STEP,
    range > 0 ? range / MAX_FUNCTION_PLOT_POINTS : MIN_FUNCTION_PLOT_STEP
  );

  let count = 0;

  for (let x = start; x <= end && count <= MAX_FUNCTION_PLOT_POINTS; x += step) {
    try {
      const y = evaluator(x);
      if (Number.isFinite(y)) {
        data.push([Number(x.toFixed(4)), Number(y.toFixed(4))]);
      }
    } catch {
      return generateFunctionPlotData(DEFAULT_FUNCTION_PLOT);
    }

    count += 1;
  }

  return data;
}

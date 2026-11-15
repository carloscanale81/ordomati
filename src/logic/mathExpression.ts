/**
 * Standard Mathematical Expression Evaluator based on Math.js Syntax.
 * Official Documentation: https://mathjs.org/docs/expressions/syntax.html
 * 
 * Supports standard algebraic notation, power operator (^), relational operators
 * (<, <=, >, >=, ==, !=), ternary conditionals (cond ? a : b), and standard math functions
 * (min, max, sin, cos, tan, exp, log, sqrt, abs, round, floor, ceil, pi, e).
 */

const MATH_FUNCTIONS: Record<string, any> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  exp: Math.exp,
  log: Math.log,
  log10: Math.log10,
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E
};

const MATH_KEYS = Object.keys(MATH_FUNCTIONS);
const MATH_VALS = Object.values(MATH_FUNCTIONS);

/**
 * Safely evaluates a mathematical expression string using standard Math.js syntax
 * against a dictionary of variable scope values.
 */
export function evaluateMathExpression(
  expr: string,
  scope: Record<string, number> = {},
  fallback: number = 0
): number {
  if (!expr || typeof expr !== 'string') return fallback;
  const cleanExpr = expr.trim();
  if (!cleanExpr) return fallback;

  try {
    // Whitelist check: allow alphanumeric characters, math operators, ternary, parentheses, commas
    if (!/^[a-zA-Z0-9_\s.+\-*/%(),^?:<>=!&|]+$/.test(cleanExpr)) {
      return fallback;
    }

    // Security check: ensure all identifier tokens are strictly either known math functions/constants,
    // logical keywords, or provided scope variables. Prevents access to global objects (process, console, globalThis, etc.)
    const tokens = cleanExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const allowedTokens = new Set([
      ...MATH_KEYS,
      ...Object.keys(scope),
      'and',
      'or',
      'not'
    ]);
    for (const token of tokens) {
      if (!allowedTokens.has(token)) {
        return fallback;
      }
    }

    // Replace ^ with ** for power exponentiation (Math.js convention)
    let jsExpr = cleanExpr.replace(/\^/g, '**');

    // Handle unary minus before expressions or exponentiation by converting to (0 - 1) *
    // Avoids JS syntax error when unary negation precedes exponentiation (e.g., `- (d / L)^2`)
    jsExpr = jsExpr.replace(/(^|[+\-*/%?:<=>!&|,(]\s*)-\s*(?=[a-zA-Z0-9_(])/g, (_m, p1) => `${p1}(0 - 1) * `);

    // Replace textual logical keywords 'and', 'or', 'not' if used
    jsExpr = jsExpr
      .replace(/\band\b/gi, '&&')
      .replace(/\bor\b/gi, '||')
      .replace(/\bnot\b/gi, '!');

    const scopeKeys = Object.keys(scope);
    const scopeVals = Object.values(scope);

    // Compile dynamic evaluator function in strict mode
    const fn = new Function(
      ...MATH_KEYS,
      ...scopeKeys,
      `"use strict"; return (${jsExpr});`
    );

    const result = Number(fn(...MATH_VALS, ...scopeVals));
    if (!Number.isFinite(result)) {
      return fallback;
    }
    return result;
  } catch {
    return fallback;
  }
}

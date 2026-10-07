/**
 * ═══════════════════════════════════════════════════════
 * Math Engine — Bézier evaluation, expression parser,
 * coordinate transforms
 * ═══════════════════════════════════════════════════════
 */

import { expressionWithPowerOptions } from './power-options.js';
import { state } from './state.js';
import { evaluateExpression } from './expression-graph-builder.js';

// ── Cubic Bézier Evaluation ──

export function evalBezier(u, p0, p1, p2, p3) {
  const u2 = u * u;
  const u3 = u2 * u;
  const omt = 1 - u;
  const omt2 = omt * omt;
  const omt3 = omt2 * omt;

  return {
    x: omt3 * p0.x + 3 * omt2 * u * p1.x + 3 * omt * u2 * p2.x + u3 * p3.x,
    y: omt3 * p0.y + 3 * omt2 * u * p1.y + 3 * omt * u2 * p2.y + u3 * p3.y
  };
}

export function solveBezierYForX(t, p0, p1, p2, p3) {
  if (t <= p0.x) return p0.y;
  if (t >= p3.x) return p3.y;

  let lo = 0, hi = 1;
  for (let i=0;i<24;i++) {
    const u=(lo+hi)/2;
    if (evalBezier(u,p0,p1,p2,p3).x < t) lo=u; else hi=u;
  }
  return evalBezier((lo+hi)/2,p0,p1,p2,p3).y;
}

export function evalCustomExpression(tVal, expr, paramValues = {}) {
  try {
    const result = evaluateExpression(expr, tVal, paramValues);
    return Number.isFinite(result) ? result : 0;
  } catch { return 0; }
}

// ── Unified Graph Evaluator ──

export function evaluateGraph(t) {
  if (state.mode === 'bezier') {
    const { p0, p1, p2, p3 } = state.handles;
    return evalBezier(t, p0, p1, p2, p3).y;
  } else {
    const exprToEval = state.parameterizedExpr || state.customExpr;
    return evalCustomExpression(t, expressionWithPowerOptions(exprToEval,state.customParams,state.multiplyIntegerPowers), state.customParams);
  }
}

// ── Canvas Coordinate Transforms ──

export const view = {
  minX: -0.1,
  maxX: 1.1,
  minY: -0.4,
  maxY: 1.6,
  padding: 36
};

export function toScreen(canvas, x, y) {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  const plotW = w - view.padding * 2;
  const plotH = h - view.padding * 2;

  return {
    x: view.padding + ((x - view.minX) / (view.maxX - view.minX)) * plotW,
    y: h - (view.padding + ((y - view.minY) / (view.maxY - view.minY)) * plotH)
  };
}

export function toWorld(canvas, sx, sy) {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  const plotW = w - view.padding * 2;
  const plotH = h - view.padding * 2;

  return {
    x: view.minX + ((sx - view.padding) / plotW) * (view.maxX - view.minX),
    y: view.minY + (((h - sy) - view.padding) / plotH) * (view.maxY - view.minY)
  };
}

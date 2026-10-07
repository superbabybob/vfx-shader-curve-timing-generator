/**
 * ═══════════════════════════════════════════════════════
 * Math Engine — Bézier evaluation, expression parser,
 * coordinate transforms
 * ═══════════════════════════════════════════════════════
 */

import { state } from './state.js';

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

  let u = t;
  for (let i = 0; i < 8; i++) {
    const pt = evalBezier(u, p0, p1, p2, p3);
    const dx = pt.x - t;
    if (Math.abs(dx) < 1e-4) return pt.y;

    const omt = 1 - u;
    const dxdt = 3 * omt * omt * (p1.x - p0.x) +
                 6 * omt * u * (p2.x - p1.x) +
                 3 * u * u * (p3.x - p2.x);
    if (Math.abs(dxdt) < 1e-5) break;
    u -= dx / dxdt;
    u = Math.max(0, Math.min(1, u));
  }
  return evalBezier(u, p0, p1, p2, p3).y;
}

// ── Custom Expression Evaluator ──

export function evalCustomExpression(tVal, expr) {
  try {
    const saturate = (v) => Math.min(1, Math.max(0, v));
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const smoothstep = (min, max, x) => {
      const v = Math.min(1, Math.max(0, (x - min) / (max - min)));
      return v * v * (3 - 2 * v);
    };
    const pow = (a, b) => Math.pow(Math.max(0, a), b);
    const frac = (x) => x - Math.floor(x);
    const floor = Math.floor;
    const ceil = Math.ceil;
    const sin = Math.sin;
    const cos = Math.cos;
    const abs = Math.abs;
    const min = Math.min;
    const max = Math.max;
    const exp = Math.exp;
    const PI = Math.PI;

    const fn = new Function(
      't', 'saturate', 'clamp', 'smoothstep', 'pow', 'frac',
      'floor', 'ceil', 'sin', 'cos', 'abs', 'min', 'max', 'exp', 'PI',
      `return (${expr});`
    );
    const result = fn(tVal, saturate, clamp, smoothstep, pow, frac,
                      floor, ceil, sin, cos, abs, min, max, exp, PI);
    return isNaN(result) ? 0 : result;
  } catch {
    return 0;
  }
}

// ── Unified Graph Evaluator ──

export function evaluateGraph(t) {
  if (state.mode === 'bezier') {
    const { p0, p1, p2, p3 } = state.handles;
    return solveBezierYForX(t, p0, p1, p2, p3);
  } else {
    return evalCustomExpression(t, state.customExpr);
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

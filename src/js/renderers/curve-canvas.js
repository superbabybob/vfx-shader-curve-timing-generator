/**
 * ═══════════════════════════════════════════════════════
 * Curve Canvas Renderer — Interactive Bézier curve editor
 * ═══════════════════════════════════════════════════════
 */

import { state } from '../state.js';
import { evaluateGraph, toScreen, view } from '../math-engine.js';

export function renderCurveCanvas(canvas, ctx) {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const style = getComputedStyle(document.documentElement);
  const colorPrimary = style.getPropertyValue('--vfx-curve-primary').trim() || '#4C9AFF';
  const colorSecondary = style.getPropertyValue('--vfx-curve-secondary').trim() || '#A78BFA';
  const colorAxis = style.getPropertyValue('--vfx-canvas-axis').trim() || '#475062';
  const colorGrid = style.getPropertyValue('--vfx-border').trim() || '#39404F';
  const colorMuted = style.getPropertyValue('--vfx-muted').trim() || '#979EAC';
  const colorBoxBg = style.getPropertyValue('--vfx-canvas-box').trim();
  const colorBoxStroke = style.getPropertyValue('--vfx-canvas-box-stroke').trim();

  const _toScreen = (x, y) => toScreen(canvas, x, y);

  // Normalization Box [0..1]
  const boxP0 = _toScreen(0, 1);
  const boxP1 = _toScreen(1, 0);
  ctx.fillStyle = colorBoxBg;
  ctx.fillRect(boxP0.x, boxP0.y, boxP1.x - boxP0.x, boxP1.y - boxP0.y);

  // Grid steps
  ctx.strokeStyle = colorGrid;
  ctx.lineWidth = 1;
  for (let xStep = 0.0; xStep <= 1.05; xStep += 0.25) {
    const pA = _toScreen(xStep, view.minY);
    const pB = _toScreen(xStep, view.maxY);
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();

    ctx.fillStyle = colorMuted;
    ctx.font = '10px Fira Code';
    const labelPos = _toScreen(xStep, 0);
    ctx.fillText(xStep.toFixed(2), labelPos.x - 12, labelPos.y + 15);
  }

  for (let yStep = 0.0; yStep <= 1.05; yStep += 0.25) {
    const pA = _toScreen(view.minX, yStep);
    const pB = _toScreen(view.maxX, yStep);
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();

    ctx.fillStyle = colorMuted;
    ctx.font = '10px Fira Code';
    const labelPos = _toScreen(0, yStep);
    ctx.fillText(yStep.toFixed(2), labelPos.x - 28, labelPos.y + 3);
  }

  // Main Axes
  ctx.strokeStyle = colorAxis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const axisX1 = _toScreen(view.minX, 0);
  const axisX2 = _toScreen(view.maxX, 0);
  ctx.moveTo(axisX1.x, axisX1.y);
  ctx.lineTo(axisX2.x, axisX2.y);
  const axisY1 = _toScreen(0, view.minY);
  const axisY2 = _toScreen(0, view.maxY);
  ctx.moveTo(axisY1.x, axisY1.y);
  ctx.lineTo(axisY2.x, axisY2.y);
  ctx.stroke();

  // [0..1] boundary border
  ctx.strokeStyle = colorBoxStroke;
  ctx.strokeRect(boxP0.x, boxP0.y, boxP1.x - boxP0.x, boxP1.y - boxP0.y);

  // Draw Main Curve
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorPrimary;
  ctx.shadowColor = colorPrimary;
  ctx.shadowBlur = 10;
  ctx.beginPath();

  const samples = 120;
  for (let i = 0; i <= samples; i++) {
    const tVal = i / samples;
    const yVal = evaluateGraph(tVal);
    const pt = _toScreen(tVal, yVal);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw Bézier Handles
  if (state.mode === 'bezier') {
    const { p0, p1, p2, p3 } = state.handles;
    const s0 = _toScreen(p0.x, p0.y);
    const s1 = _toScreen(p1.x, p1.y);
    const s2 = _toScreen(p2.x, p2.y);
    const s3 = _toScreen(p3.x, p3.y);

    ctx.strokeStyle = colorPrimary;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.stroke();

    ctx.strokeStyle = colorSecondary;
    ctx.beginPath();
    ctx.moveTo(s3.x, s3.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    drawHandle(ctx, s0, colorMuted, 'P0', 6);
    drawHandle(ctx, s1, colorPrimary, 'P1', 7);
    drawHandle(ctx, s2, colorSecondary, 'P2', 7);
    drawHandle(ctx, s3, colorMuted, 'P3', 6);
  }

  // Draw Scrubber Indicator Line
  const curT = state.currentTime;
  const curY = evaluateGraph(curT);
  const curPt = _toScreen(curT, curY);

  ctx.strokeStyle = colorSecondary + 'b3';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  const topTracker = _toScreen(curT, view.maxY);
  const bottomTracker = _toScreen(curT, view.minY);
  ctx.moveTo(topTracker.x, topTracker.y);
  ctx.lineTo(bottomTracker.x, bottomTracker.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Glow Ball
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = colorSecondary;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(curPt.x, curPt.y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHandle(ctx, pt, color, label, radius) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1626';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '10px Fira Code';
  ctx.fillText(label, pt.x + 8, pt.y - 8);
}

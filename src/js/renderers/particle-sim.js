/**
 * ═══════════════════════════════════════════════════════
 * Particle Simulation Renderer — Multi-mode VFX viewport
 * Modes: burst, linear1d, slash, orbit, float, core
 * ═══════════════════════════════════════════════════════
 */

import { state } from '../state.js';
import { evaluateGraph } from '../math-engine.js';

export function renderParticleSimulation(particleCanvas, pctx) {
  const w = particleCanvas.parentElement.clientWidth;
  const h = particleCanvas.parentElement.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  if (particleCanvas.width !== w * dpr || particleCanvas.height !== h * dpr) {
    particleCanvas.width = w * dpr;
    particleCanvas.height = h * dpr;
  }
  pctx.resetTransform?.();
  pctx.scale(dpr, dpr);
  pctx.clearRect(0, 0, w, h);

  const style = getComputedStyle(document.documentElement);
  const colorPrimary = style.getPropertyValue('--vfx-curve-primary').trim() || '#4C9AFF';

  const centerX = w * 0.5;
  const centerY = h * 0.5;
  const mainT = state.currentTime;
  const mainY = evaluateGraph(mainT);

  const applyPos = document.getElementById('apply-pos')?.checked ?? true;
  const applyScale = document.getElementById('apply-scale')?.checked ?? true;
  const applyAlpha = document.getElementById('apply-alpha')?.checked ?? true;

  // --- LINEAR 1D ---
  if (state.vfxMode === 'linear1d') {
    renderLinear1D(pctx, w, h, centerY, mainT, mainY, applyPos, applyScale, applyAlpha, colorPrimary);
    return;
  }

  // --- SWORD SLASH ---
  if (state.vfxMode === 'slash') {
    renderSlash(pctx, w, h, centerX, centerY, mainT, mainY, applyScale, applyAlpha, colorPrimary);
    return;
  }

  // --- CORE EMITTER & RADIAL PARTICLES ---
  const coreY = Math.max(0, mainY);
  const coreRadius = applyScale ? (8 + coreY * 18) : 14;
  const coreAlpha = applyAlpha ? Math.min(1, Math.max(0.1, mainY)) : 0.8;

  pctx.save();
  pctx.fillStyle = `rgba(76, 154, 255, ${coreAlpha * 0.25})`;
  pctx.beginPath();
  pctx.arc(centerX, centerY, coreRadius * 2.5, 0, Math.PI * 2);
  pctx.fill();

  pctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 15;
  pctx.beginPath();
  pctx.arc(centerX, centerY, coreRadius * 0.8, 0, Math.PI * 2);
  pctx.fill();
  pctx.restore();

  if (state.vfxMode === 'core') return;

  // Multi-particle burst / orbit / float
  state.particles.forEach(p => {
    let pt = mainT - p.staggerPhase;
    if (pt < 0) pt += 1.0;
    const py = evaluateGraph(pt);

    let px = centerX;
    let pyPos = centerY;
    const dist = applyPos ? (py * p.baseRadius * 1.3) : p.baseRadius;

    if (state.vfxMode === 'burst') {
      px = centerX + Math.cos(p.angle) * dist;
      pyPos = centerY + Math.sin(p.angle) * dist;
    } else if (state.vfxMode === 'orbit') {
      const spinAngle = p.angle + pt * Math.PI * 2 * p.spinSpeed;
      px = centerX + Math.cos(spinAngle) * dist;
      pyPos = centerY + Math.sin(spinAngle) * dist * 0.65;
    } else if (state.vfxMode === 'float') {
      px = centerX + Math.sin(p.angle * 2 + pt * 6) * 35;
      pyPos = centerY + 65 - dist * 1.6;
    }

    const pRadius = applyScale ? Math.max(2, 3 + py * 7) : 5;
    const pOpacity = applyAlpha ? Math.min(1, Math.max(0, py)) : 0.85;

    pctx.save();
    pctx.strokeStyle = `rgba(76, 154, 255, ${pOpacity * 0.35})`;
    pctx.lineWidth = 1;
    pctx.beginPath();
    pctx.moveTo(centerX, centerY);
    pctx.lineTo(px, pyPos);
    pctx.stroke();

    pctx.fillStyle = p.color;
    pctx.shadowColor = p.color;
    pctx.shadowBlur = 10;
    pctx.globalAlpha = pOpacity;
    pctx.beginPath();
    pctx.arc(px, pyPos, pRadius, 0, Math.PI * 2);
    pctx.fill();
    pctx.restore();
  });
}

function renderLinear1D(pctx, w, h, centerY, mainT, mainY, applyPos, applyScale, applyAlpha, colorPrimary) {
  const trackStartX = w * 0.12;
  const trackEndX = w * 0.88;
  const trackY = centerY;
  const trackLen = trackEndX - trackStartX;

  pctx.save();
  pctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--vfx-border').trim();
  pctx.lineWidth = 3;
  pctx.beginPath();
  pctx.moveTo(trackStartX, trackY);
  pctx.lineTo(trackEndX, trackY);
  pctx.stroke();

  [0.0, 0.25, 0.5, 0.75, 1.0].forEach(frac => {
    const mx = trackStartX + trackLen * frac;
    pctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--vfx-border-strong').trim();
    pctx.lineWidth = 1.5;
    pctx.beginPath();
    pctx.moveTo(mx, trackY - 6);
    pctx.lineTo(mx, trackY + 6);
    pctx.stroke();

    pctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--vfx-muted').trim();
    pctx.font = '9px Fira Code';
    pctx.fillText(frac.toFixed(2), mx - 10, trackY + 18);
  });

  const clampedY = applyPos ? mainY : mainT;
  const currentPx = trackStartX + trackLen * clampedY;

  state.linearHistory.push({ x: currentPx, y: trackY, t: mainT, valY: mainY });
  if (state.linearHistory.length > 24 || mainT < 0.02) {
    if (mainT < 0.02) state.linearHistory = [];
    else state.linearHistory.shift();
  }

  const hLen = state.linearHistory.length;
  for (let i = 0; i < hLen - 1; i++) {
    const pt = state.linearHistory[i];
    const f = i / hLen;
    pctx.fillStyle = `rgba(76, 154, 255, ${f * 0.35})`;
    pctx.beginPath();
    pctx.arc(pt.x, trackY, 4 * f, 0, Math.PI * 2);
    pctx.fill();
  }

  const pRadius = applyScale ? Math.max(3, 5 + mainY * 9) : 8;
  const pOpacity = applyAlpha ? Math.min(1, Math.max(0.1, mainY)) : 0.95;

  pctx.fillStyle = '#ffffff';
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 18;
  pctx.globalAlpha = pOpacity;
  pctx.beginPath();
  pctx.arc(currentPx, trackY, pRadius, 0, Math.PI * 2);
  pctx.fill();

  pctx.restore();
}

function renderSlash(pctx, w, h, centerX, centerY, mainT, mainY, applyScale, applyAlpha, colorPrimary) {
  const slashOriginX = centerX - 15;
  const slashOriginY = centerY + 35;
  const radius = Math.min(w, h) * 0.46;

  const startAngle = -Math.PI * 0.90;
  const sweepRange = Math.PI * 1.35;

  const currentAngle = startAngle + mainY * sweepRange;
  const pAlpha = applyAlpha ? Math.min(1, Math.max(0.08, mainY)) : 0.95;
  const bladeScale = applyScale ? Math.max(0.35, 0.45 + mainY * 0.75) : 1.0;

  state.slashHistory.push({
    angle: currentAngle,
    y: mainY,
    alpha: pAlpha,
    time: mainT
  });

  if (state.slashHistory.length > 52 || mainT < 0.03) {
    if (mainT < 0.03) state.slashHistory = [];
    else state.slashHistory.shift();
  }

  pctx.save();

  const histLen = state.slashHistory.length;
  if (histLen >= 3) {
    // Layer A: Outer Aura Glow
    for (let i = 0; i < histLen - 1; i++) {
      const h1 = state.slashHistory[i];
      const h2 = state.slashHistory[i + 1];
      const factor1 = i / histLen;
      const factor2 = (i + 1) / histLen;

      const width1 = radius * (0.38 * Math.pow(factor1, 0.65));
      const width2 = radius * (0.38 * Math.pow(factor2, 0.65));

      const rTip1 = radius * (0.82 + factor1 * 0.22);
      const rTip2 = radius * (0.82 + factor2 * 0.22);
      const rInner1 = rTip1 - width1;
      const rInner2 = rTip2 - width2;

      const cos1 = Math.cos(h1.angle);
      const sin1 = Math.sin(h1.angle);
      const cos2 = Math.cos(h2.angle);
      const sin2 = Math.sin(h2.angle);

      pctx.beginPath();
      pctx.moveTo(slashOriginX + cos1 * rInner1, slashOriginY + sin1 * rInner1);
      pctx.lineTo(slashOriginX + cos1 * rTip1, slashOriginY + sin1 * rTip1);
      pctx.lineTo(slashOriginX + cos2 * rTip2, slashOriginY + sin2 * rTip2);
      pctx.lineTo(slashOriginX + cos2 * rInner2, slashOriginY + sin2 * rInner2);
      pctx.closePath();

      pctx.fillStyle = `rgba(14, 116, 244, ${Math.pow(factor2, 1.4) * 0.45 * pAlpha})`;
      pctx.shadowColor = colorPrimary;
      pctx.shadowBlur = factor2 * 22;
      pctx.fill();
    }

    // Layer B: Bright Energy Body Ribbon
    for (let i = 0; i < histLen - 1; i++) {
      const h1 = state.slashHistory[i];
      const h2 = state.slashHistory[i + 1];
      const factor1 = i / histLen;
      const factor2 = (i + 1) / histLen;

      const width1 = radius * (0.24 * Math.pow(factor1, 0.7));
      const width2 = radius * (0.24 * Math.pow(factor2, 0.7));

      const rTip1 = radius * (0.88 + factor1 * 0.16);
      const rTip2 = radius * (0.88 + factor2 * 0.16);
      const rInner1 = rTip1 - width1;
      const rInner2 = rTip2 - width2;

      const cos1 = Math.cos(h1.angle);
      const sin1 = Math.sin(h1.angle);
      const cos2 = Math.cos(h2.angle);
      const sin2 = Math.sin(h2.angle);

      pctx.beginPath();
      pctx.moveTo(slashOriginX + cos1 * rInner1, slashOriginY + sin1 * rInner1);
      pctx.lineTo(slashOriginX + cos1 * rTip1, slashOriginY + sin1 * rTip1);
      pctx.lineTo(slashOriginX + cos2 * rTip2, slashOriginY + sin2 * rTip2);
      pctx.lineTo(slashOriginX + cos2 * rInner2, slashOriginY + sin2 * rInner2);
      pctx.closePath();

      pctx.fillStyle = `rgba(56, 189, 248, ${Math.pow(factor2, 1.2) * 0.75 * pAlpha})`;
      pctx.shadowColor = '#38bdf8';
      pctx.shadowBlur = factor2 * 14;
      pctx.fill();
    }

    // Layer C: White-Hot Cutting Edge
    pctx.strokeStyle = `rgba(255, 255, 255, ${pAlpha * 0.95})`;
    pctx.lineWidth = 3.5;
    pctx.shadowColor = '#e0f2fe';
    pctx.shadowBlur = 12;
    pctx.beginPath();
    state.slashHistory.forEach((h, idx) => {
      const f = idx / (histLen - 1);
      const rEdge = radius * (0.88 + f * 0.16);
      const px = slashOriginX + Math.cos(h.angle) * rEdge;
      const py = slashOriginY + Math.sin(h.angle) * rEdge;
      if (idx === 0) pctx.moveTo(px, py);
      else pctx.lineTo(px, py);
    });
    pctx.stroke();

    // Layer D: Inner Core Highlight Strip
    pctx.strokeStyle = `rgba(224, 242, 254, ${pAlpha * 0.8})`;
    pctx.lineWidth = 1.8;
    pctx.beginPath();
    state.slashHistory.forEach((h, idx) => {
      const f = idx / (histLen - 1);
      const rEdge = radius * (0.82 + f * 0.12);
      const px = slashOriginX + Math.cos(h.angle) * rEdge;
      const py = slashOriginY + Math.sin(h.angle) * rEdge;
      if (idx === 0) pctx.moveTo(px, py);
      else pctx.lineTo(px, py);
    });
    pctx.stroke();
  }

  // Stylized Sword Asset
  const bladeLen = radius * bladeScale;
  const cos = Math.cos(currentAngle);
  const sin = Math.sin(currentAngle);
  const perpX = -sin;
  const perpY = cos;

  const guardDist = bladeLen * 0.22;
  const guardCenterX = slashOriginX + cos * guardDist;
  const guardCenterY = slashOriginY + sin * guardDist;
  const bladeTipX = slashOriginX + cos * bladeLen;
  const bladeTipY = slashOriginY + sin * bladeLen;

  // Grip
  pctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--vfx-border-strong').trim();
  pctx.lineWidth = 4.5;
  pctx.beginPath();
  pctx.moveTo(slashOriginX, slashOriginY);
  pctx.lineTo(guardCenterX, guardCenterY);
  pctx.stroke();

  // Pommel
  pctx.fillStyle = colorPrimary;
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 8;
  pctx.beginPath();
  pctx.arc(slashOriginX, slashOriginY, 4.5, 0, Math.PI * 2);
  pctx.fill();

  // Crossguard
  const guardSpan = 14;
  pctx.strokeStyle = '#cbd5e1';
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 6;
  pctx.lineWidth = 4;
  pctx.beginPath();
  pctx.moveTo(guardCenterX - perpX * guardSpan, guardCenterY - perpY * guardSpan);
  pctx.lineTo(guardCenterX + perpX * guardSpan, guardCenterY + perpY * guardSpan);
  pctx.stroke();

  // Blade Body
  pctx.strokeStyle = '#f1f5f9';
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 10;
  pctx.lineWidth = 4;
  pctx.beginPath();
  pctx.moveTo(guardCenterX, guardCenterY);
  pctx.lineTo(bladeTipX, bladeTipY);
  pctx.stroke();

  // Blade Edge Highlight
  pctx.strokeStyle = '#ffffff';
  pctx.shadowBlur = 0;
  pctx.lineWidth = 1.5;
  pctx.beginPath();
  pctx.moveTo(guardCenterX, guardCenterY);
  pctx.lineTo(bladeTipX, bladeTipY);
  pctx.stroke();

  // Tip Flare
  pctx.fillStyle = '#ffffff';
  pctx.shadowColor = colorPrimary;
  pctx.shadowBlur = 16;
  pctx.beginPath();
  pctx.arc(bladeTipX, bladeTipY, 3, 0, Math.PI * 2);
  pctx.fill();

  pctx.restore();
}

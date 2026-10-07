/**
 * ═══════════════════════════════════════════════════════════
 * App — Main entry point, UI controllers, animation loop
 * Wires together state, renderers, and DOM interactions
 * ═══════════════════════════════════════════════════════════
 */

import { state } from './state.js';
import { presets } from './presets.js';
import { evaluateGraph, evalCustomExpression, solveBezierYForX, toScreen, toWorld } from './math-engine.js';
import { renderCurveCanvas } from './renderers/curve-canvas.js';
import { renderParticleSimulation } from './renderers/particle-sim.js';
import { renderNodeGraph, setupNodeGraphInteractions, resetNodeGraphView, initNodeGraphDOM } from './renderers/node-graph.js';
import { generateCodeSnippets } from './code-gen.js';

// Attach presets to state
state.presets = presets;

// ── DOM Elements ──

const canvas = document.getElementById('curveCanvas');
const ctx = canvas.getContext('2d');
const particleCanvas = document.getElementById('particleCanvas');
const pctx = particleCanvas.getContext('2d');
const scrubber = document.getElementById('scrubber');
const scrubberLabel = document.getElementById('scrubber-label');
const speedLabel = document.getElementById('speed-label');
const infoT = document.getElementById('info-t');
const infoY = document.getElementById('info-y');
const codeOutput = document.getElementById('code-output');
const presetGrid = document.getElementById('preset-grid');
const presetCount = document.getElementById('preset-count');
const categoryPills = document.getElementById('category-pills');
const formulaInput = document.getElementById('custom-formula-input');
const formulaError = document.getElementById('formula-error');
const tipTitle = document.getElementById('preset-tip-title');
const tipContent = document.getElementById('preset-tip-content');
const nodeGraphSvg = document.getElementById('nodeGraphSvg');
const nodeRecipeList = document.getElementById('node-recipe-list');
const recipeTargetName = document.getElementById('recipe-target-name');
const nodeEngineBadge = document.getElementById('node-engine-badge');
const nodeGraphView = document.getElementById('node-graph-view');
const codeTextView = document.getElementById('code-text-view');
const vfxValBadge = document.getElementById('vfx-val-badge');

// Init node graph DOM refs
initNodeGraphDOM(nodeGraphSvg, nodeRecipeList, recipeTargetName, nodeEngineBadge);

// ── Preset Thumbnail SVG ──

function generatePresetThumbnailSVG(preset) {
  const svgW = 76;
  const svgH = 48;
  const padX = 8;
  const padY = 6;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;

  const toSvgX = (t) => padX + t * plotW;
  const toSvgY = (y) => (svgH - padY) - ((y + 0.3) / 1.7) * plotH;

  let d = '';
  const samples = 28;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    let y = 0;
    if (preset.type === 'bezier') {
      const p0 = { x: preset.p0[0], y: preset.p0[1] };
      const p1 = { x: preset.p1[0], y: preset.p1[1] };
      const p2 = { x: preset.p2[0], y: preset.p2[1] };
      const p3 = { x: preset.p3[0], y: preset.p3[1] };
      y = solveBezierYForX(t, p0, p1, p2, p3);
    } else {
      y = evalCustomExpression(t, preset.expr);
    }

    const sx = toSvgX(t).toFixed(1);
    const sy = Math.max(2, Math.min(svgH - 2, toSvgY(y))).toFixed(1);
    d += (i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`);
  }

  const baselineY = toSvgY(0).toFixed(1);
  const top1Y = toSvgY(1.0).toFixed(1);

  return `
    <svg viewBox="0 0 ${svgW} ${svgH}" class="vfx-preset__thumb">
      <line x1="${padX}" y1="${baselineY}" x2="${svgW - padX}" y2="${baselineY}" stroke="var(--vfx-border)" stroke-width="1" />
      <line x1="${padX}" y1="${top1Y}" x2="${svgW - padX}" y2="${top1Y}" stroke="var(--vfx-border)" stroke-width="0.8" stroke-dasharray="2 2" />
      <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${svgH - padY}" stroke="var(--vfx-border)" stroke-width="1" />
      <path d="${d}" fill="none" stroke="var(--vfx-curve-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

// ── Category Pills ──

function initCategoryPills() {
  categoryPills.innerHTML = '';
  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    const isActive = state.activeCategory === cat.id;
    btn.className = `vfx-pill${isActive ? ' vfx-pill--active' : ''}`;
    btn.textContent = cat.label;
    btn.onclick = () => {
      state.activeCategory = cat.id;
      initCategoryPills();
      renderPresetGrid();
    };
    categoryPills.appendChild(btn);
  });
}

// ── Search ──

window.onSearchPresets = function(val) {
  state.searchQuery = val.trim().toLowerCase();
  renderPresetGrid();
};

// ── Preset Grid ──

function renderPresetCard(preset) {
  const card = document.createElement('div');
  const isActive = state.selectedPresetId === preset.id;
  card.id = `preset-card-${preset.id}`;
  card.className = `vfx-preset${isActive ? ' vfx-preset--active' : ''}`;
  card.onclick = () => loadPreset(preset);

  card.innerHTML = `
    ${generatePresetThumbnailSVG(preset)}
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:4px">
        <span class="vfx-preset__name line-clamp-1">${preset.name}</span>
        <span class="vfx-preset__badge">${preset.badge}</span>
      </div>
      <p class="vfx-preset__desc line-clamp-1" style="margin-top:2px">${preset.desc}</p>
    </div>
  `;
  return card;
}

function renderPresetGrid() {
  presetGrid.innerHTML = '';

  const filtered = state.presets.filter(p => {
    const matchesCategory = state.activeCategory === 'all' || p.cat === state.activeCategory;
    const matchesQuery = !state.searchQuery ||
      p.name.toLowerCase().includes(state.searchQuery) ||
      p.desc.toLowerCase().includes(state.searchQuery) ||
      p.badge.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesQuery;
  });

  presetCount.textContent = filtered.length;

  if (filtered.length === 0) {
    presetGrid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--vfx-muted);font-size:12px;">ไม่พบพรีเซ็ตที่ตรงกับ "${state.searchQuery}"</div>`;
    return;
  }

  // If a specific category is chosen, display direct grid
  if (state.activeCategory !== 'all') {
    filtered.forEach(preset => {
      presetGrid.appendChild(renderPresetCard(preset));
    });
    return;
  }

  // When "All" is active, group items with category section dividers
  const categoryGroups = state.categories.filter(c => c.id !== 'all');

  categoryGroups.forEach(cat => {
    const groupItems = filtered.filter(p => p.cat === cat.id);
    if (groupItems.length === 0) return;

    // Category Header Banner spanning full width
    const sectionHeader = document.createElement('div');
    sectionHeader.style.cssText = 'grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 6px 4px 2px; margin-top: 6px; border-bottom: 1px solid var(--vfx-border);';
    sectionHeader.innerHTML = `
      <span style="font-size: 11px; font-weight: 700; color: var(--vfx-action); letter-spacing: 0.02em;">
        ${cat.label}
      </span>
      <span class="font-mono" style="font-size: 10px; color: var(--vfx-muted); background: var(--vfx-inset); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--vfx-border);">
        ${groupItems.length}
      </span>
    `;
    presetGrid.appendChild(sectionHeader);

    // Append presets belonging to this mathematical group
    groupItems.forEach(preset => {
      presetGrid.appendChild(renderPresetCard(preset));
    });
  });
}

function highlightActivePresetCard(id) {
  state.selectedPresetId = id;
  state.presets.forEach(p => {
    const el = document.getElementById(`preset-card-${p.id}`);
    if (!el) return;
    el.className = p.id === id ? 'vfx-preset vfx-preset--active' : 'vfx-preset';
  });
}

// ── Particles ──

function initParticles() {
  state.particles = [];
  const colors = ['#4C9AFF', '#38bdf8', '#818cf8', '#A78BFA', '#c084fc'];
  for (let i = 0; i < state.particleCount; i++) {
    const angle = (i / state.particleCount) * Math.PI * 2;
    state.particles.push({
      angle,
      color: colors[i % colors.length],
      baseRadius: 38 + (i % 3) * 16,
      staggerPhase: i * state.particleStagger,
      spinSpeed: 0.8 + (i % 2) * 0.4
    });
  }
}

// ── Particle Count ──

window.setParticleCount = function(n) {
  state.particleCount = n;
  [8, 12, 16].forEach(count => {
    const btn = document.getElementById(`p-count-${count}`);
    if (btn) {
      btn.className = count === n
        ? 'vfx-btn vfx-btn--primary'
        : 'vfx-btn vfx-btn--ghost';
      btn.style.padding = '2px 6px';
      btn.style.minHeight = '24px';
      btn.style.fontSize = '11px';
    }
  });
  initParticles();
};

// ── VFX Motion Mode ──

window.setVfxMotionMode = function(mode) {
  state.vfxMode = mode;
  state.slashHistory = [];
  state.linearHistory = [];
  const modes = ['burst', 'linear1d', 'slash', 'orbit', 'float', 'core'];
  modes.forEach(m => {
    const btn = document.getElementById(`mode-${m}-btn`);
    if (btn) {
      btn.className = m === mode ? 'vfx-tab vfx-tab--active' : 'vfx-tab';
    }
  });
};

// ── Outputs & Tab Switching ──

function updateOutputs() {
  const snippets = generateCodeSnippets();
  if (codeOutput) {
    codeOutput.textContent = snippets[state.activeTab] || snippets.hlsl;
  }

  if (state.activeTab === 'node-graph') {
    if (nodeGraphView) nodeGraphView.classList.remove('hidden');
    if (codeTextView) codeTextView.classList.add('hidden');
    renderNodeGraph();
  } else {
    if (nodeGraphView) nodeGraphView.classList.add('hidden');
    if (codeTextView) codeTextView.classList.remove('hidden');
  }
}

window.switchTab = function(tab) {
  state.activeTab = tab;
  const allTabs = ['node-graph', 'hlsl', 'compact', 'unity', 'css'];
  allTabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (!btn) return;
    btn.className = t === tab ? 'vfx-tab vfx-tab--active' : 'vfx-tab';
  });
  updateOutputs();
};

// ── B\u00e9zier Handle Interaction ──

function getPointerDistance(sx, sy, p) {
  const pt = toScreen(canvas, p.x, p.y);
  const dx = sx - pt.x;
  const dy = sy - pt.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function onPointerDown(e) {
  if (state.mode !== 'bezier') return;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;

  const handles = ['p1', 'p2', 'p0', 'p3'];
  const hitRadius = 24;

  for (const h of handles) {
    if (getPointerDistance(sx, sy, state.handles[h]) <= hitRadius) {
      state.activeDrag = h;
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      e.preventDefault();
      return;
    }
  }
}

function onPointerMove(e) {
  if (!state.activeDrag) return;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;

  const world = toWorld(canvas, sx, sy);
  state.handles[state.activeDrag].x = Math.round(world.x * 100) / 100;
  state.handles[state.activeDrag].y = Math.round(world.y * 100) / 100;
  highlightActivePresetCard(null);

  syncHandleInputs();
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
}

function onPointerUp() {
  state.activeDrag = null;
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('mouseup', onPointerUp);
  window.removeEventListener('touchmove', onPointerMove);
  window.removeEventListener('touchend', onPointerUp);
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });

// ── Handle Input Sync ──

function syncHandleInputs() {
  document.getElementById('p0x').value = state.handles.p0.x.toFixed(2);
  document.getElementById('p0y').value = state.handles.p0.y.toFixed(2);
  document.getElementById('p1x').value = state.handles.p1.x.toFixed(2);
  document.getElementById('p1y').value = state.handles.p1.y.toFixed(2);
  document.getElementById('p2x').value = state.handles.p2.x.toFixed(2);
  document.getElementById('p2y').value = state.handles.p2.y.toFixed(2);
  document.getElementById('p3x').value = state.handles.p3.x.toFixed(2);
  document.getElementById('p3y').value = state.handles.p3.y.toFixed(2);
}

window.updateHandleFromInput = function() {
  state.handles.p0.x = parseFloat(document.getElementById('p0x').value) || 0;
  state.handles.p0.y = parseFloat(document.getElementById('p0y').value) || 0;
  state.handles.p1.x = parseFloat(document.getElementById('p1x').value) || 0;
  state.handles.p1.y = parseFloat(document.getElementById('p1y').value) || 0;
  state.handles.p2.x = parseFloat(document.getElementById('p2x').value) || 0;
  state.handles.p2.y = parseFloat(document.getElementById('p2y').value) || 0;
  state.handles.p3.x = parseFloat(document.getElementById('p3x').value) || 0;
  state.handles.p3.y = parseFloat(document.getElementById('p3y').value) || 0;
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
};

// ── Animation Loop ──

let lastTimestamp = 0;

function vfxLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (state.isPlaying) {
    state.currentTime += delta * 0.5 * state.speed;
    if (state.currentTime > 1.0) state.currentTime = 0.0;
    scrubber.value = state.currentTime;
  }

  const t = state.currentTime;
  const y = evaluateGraph(t);

  scrubberLabel.textContent = t.toFixed(2);
  infoT.textContent = t.toFixed(2);
  infoY.textContent = y.toFixed(2);
  vfxValBadge.textContent = y.toFixed(2);

  renderParticleSimulation(particleCanvas, pctx);
  renderCurveCanvas(canvas, ctx);

  requestAnimationFrame(vfxLoop);
}

// ── Playback Controls ──

window.togglePlay = function() {
  state.isPlaying = !state.isPlaying;
  document.getElementById('play-icon').classList.toggle('hidden', state.isPlaying);
  document.getElementById('pause-icon').classList.toggle('hidden', !state.isPlaying);
};

window.onScrub = function(val) {
  state.currentTime = parseFloat(val);
  state.isPlaying = false;
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
};

// ── Mode Switching ──

window.setMode = function(mode) {
  state.mode = mode;
  const bezierBtn = document.getElementById('mode-bezier-btn');
  const exprBtn = document.getElementById('mode-expr-btn');
  const bezierControls = document.getElementById('bezier-controls');
  const exprControls = document.getElementById('expression-controls');
  const hint = document.getElementById('editor-hint');

  if (mode === 'bezier') {
    bezierBtn.className = 'vfx-tab vfx-tab--active';
    exprBtn.className = 'vfx-tab';
    bezierControls.classList.remove('hidden');
    exprControls.classList.add('hidden');
    hint.innerHTML = 'ลาก Handle <span style="color:var(--vfx-curve-handle-1);font-weight:700">P1</span> และ <span style="color:var(--vfx-curve-handle-2);font-weight:700">P2</span> เพื่อปรับแต่งเส้นโค้ง';
  } else {
    exprBtn.className = 'vfx-tab vfx-tab--active';
    bezierBtn.className = 'vfx-tab';
    bezierControls.classList.add('hidden');
    exprControls.classList.remove('hidden');
    hint.innerHTML = 'โหมด Custom Expression: กราฟและโหนดจะถูกแปลงตามสมการคณิตศาสตร์ที่ระบุ';
  }
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
};

// ── Custom Formula ──

window.applyCustomFormula = function() {
  const val = formulaInput.value.trim();
  try {
    const testRes = evalCustomExpression(0.5, val);
    if (isNaN(testRes)) throw new Error('Result is NaN');
    formulaError.classList.add('hidden');
    state.customExpr = val;
    highlightActivePresetCard(null);
    tipTitle.textContent = 'สมการแบบกำหนดเอง:';
    tipContent.textContent = val;
    updateOutputs();
    renderCurveCanvas(canvas, ctx);
  } catch (err) {
    formulaError.textContent = 'Syntax Error: ' + err.message;
    formulaError.classList.remove('hidden');
  }
};

// ── Load Preset ──

function loadPreset(preset) {
  highlightActivePresetCard(preset.id);
  tipTitle.textContent = `วิธีนำ ${preset.name} ไปต่อในกราฟ:`;
  tipContent.textContent = preset.tip || preset.desc;

  if (preset.type === 'bezier') {
    setMode('bezier');
    state.handles.p0 = { x: preset.p0[0], y: preset.p0[1] };
    state.handles.p1 = { x: preset.p1[0], y: preset.p1[1] };
    state.handles.p2 = { x: preset.p2[0], y: preset.p2[1] };
    state.handles.p3 = { x: preset.p3[0], y: preset.p3[1] };
    syncHandleInputs();
  } else {
    setMode('expression');
    formulaInput.value = preset.expr;
    state.customExpr = preset.expr;
  }
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
}

window.resetCurrentCurve = function() {
  loadPreset(state.presets[0]);
};

// ── Toast ──

window.showToast = function(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = msg;
  toast.classList.add('vfx-toast--visible');
  setTimeout(() => toast.classList.remove('vfx-toast--visible'), 2200);
};

// ── Copy ──

window.copyCurrentCode = function() {
  const code = codeOutput.textContent;
  navigator.clipboard?.writeText(code).then(() => {
    showToast('คัดลอกโค้ดลงคลิปบอร์ดแล้ว!');
  }).catch(() => {
    // Fallback
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = code;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    showToast('คัดลอกโค้ดลงคลิปบอร์ดแล้ว!');
  });
};

window.copyRecipeText = function() {
  import('./node-graph-model.js').then(mod => {
    const model = mod.generateNodeGraphModel();
    const text = '// Step-by-Step Universal Math Node Recipe (Unity / Unreal):\n' +
      model.recipe.map((r, i) => `${i + 1}. ${r}`).join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('คัดลอกคำแนะนำการต่อโหนดแล้ว!');
      });
    } else {
      const dummy = document.createElement('textarea');
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
      showToast('คัดลอกคำแนะนำการต่อโหนดแล้ว!');
    }
  });
};

window.resetNodeGraphView = resetNodeGraphView;

// ── Resize Handler ──

window.addEventListener('resize', () => {
  renderCurveCanvas(canvas, ctx);
  renderParticleSimulation(particleCanvas, pctx);
  if (state.activeTab === 'node-graph') renderNodeGraph();
});

// ── Init ──

window.addEventListener('DOMContentLoaded', () => {
  initCategoryPills();
  renderPresetGrid();
  initParticles();
  syncHandleInputs();
  setupNodeGraphInteractions(nodeGraphSvg);
  switchTab('node-graph');

  const defaultPreset = state.presets.find(p => p.id === 'smoothstep');
  if (defaultPreset) loadPreset(defaultPreset);

  requestAnimationFrame(vfxLoop);
});

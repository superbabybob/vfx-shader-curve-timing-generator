import {presetParameters, rememberPresetParameters, addComparison, captureGraph, comparisonColors} from './timing-comparison.js';
/**
 * ═══════════════════════════════════════════════════════════
 * App — Main entry point, UI controllers, animation loop
 * Wires together state, renderers, and DOM interactions
 * ═══════════════════════════════════════════════════════════
 */

import { integerExponentParameters, roundLiteralPowerExponents } from './power-options.js';
import { state } from './state.js';
import { presets } from './presets.js';
import { evaluateGraph, evalCustomExpression, toScreen, toWorld } from './math-engine.js';
import { setupCurveNavigation } from './curve-navigation.js';
import { renderCurveCanvas } from './renderers/curve-canvas.js';
import { renderParticleSimulation } from './renderers/particle-sim.js';
import { renderNodeGraph, setupNodeGraphInteractions, resetNodeGraphView, initNodeGraphDOM } from './renderers/node-graph.js';
import { generateCodeSnippets, getBezierCompactFormula } from './code-gen.js';
import { evaluateExpression, extractExpressionParameters, roundExpressionNumbers } from './expression-graph-builder.js';

// Attach presets to state
state.presets = presets;
let editingPresetId = null;

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
const customParamsContainer = document.getElementById('custom-params-container');
const customParamsList = document.getElementById('custom-params-list');
const tipTitle = document.getElementById('preset-tip-title');
const tipContent = document.getElementById('preset-tip-content');
const nodeGraphSvg = document.getElementById('nodeGraphSvg');
const nodeEngineBadge = document.getElementById('node-engine-badge');
const nodeGraphView = document.getElementById('node-graph-view');
const codeTextView = document.getElementById('code-text-view');
const vfxValBadge = document.getElementById('vfx-val-badge');

// Init node graph DOM refs
initNodeGraphDOM(nodeGraphSvg, nodeEngineBadge);

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
    y = evalCustomExpression(t, preset.expr);

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
    const empty = document.createElement('div');
    empty.style.cssText = 'grid-column:1/-1;padding:24px;text-align:center';
    empty.textContent = `ไม่พบพรีเซ็ตที่ตรงกับ "${state.searchQuery}"`;
    presetGrid.appendChild(empty);
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

function normExpr(s) {
  return (s || '').replace(/\s+/g, '').replace(/(\d+)\.0+(?!\d)/g, '$1').toLowerCase();
}

function updateBezierButtonVisibility() {
  const bezierBtn = document.getElementById('mode-bezier-btn');
  if (!bezierBtn) return;
  if(state.mode === 'bezier') { bezierBtn.classList.remove('hidden'); return; }

  // 1. If active preset exists, check its type
  let matchedPreset = state.presets.find(p => p.id === state.selectedPresetId);

  // 2. If no preset selected by id, check if current expression matches any preset
  if (!matchedPreset && state.customExpr) {
    const curNorm = normExpr(state.customExpr);
    matchedPreset = state.presets.find(p => normExpr(p.expr) === curNorm);
  }

  // 3. If matched a non-bezier preset, or in expression mode without bezier match, hide it
  if (matchedPreset) {
    if (matchedPreset.type !== 'bezier') {
      bezierBtn.classList.add('hidden');
    } else {
      bezierBtn.classList.remove('hidden');
    }
  } else {
    // Custom edited expression cannot be mapped to simple cubic bezier handles
    if (state.mode === 'expression') {
      bezierBtn.classList.add('hidden');
    } else {
      bezierBtn.classList.remove('hidden');
    }
  }
}

function highlightActivePresetCard(id) {
  state.selectedPresetId = id;
  updateBezierButtonVisibility();

  state.presets.forEach(p => {
    const el = document.getElementById(`preset-card-${p.id}`);
    if (!el) return;
    el.className = p.id === id ? 'vfx-preset vfx-preset--active' : 'vfx-preset';
  });
}

// ── Particles ──

function syncEditedComparison() {
  const graph = state.comparisonGraphs.find(g => g.id === state.editingComparisonId);
  if (graph) Object.assign(graph, captureGraph(state, editingPresetId));
}
function editComparison(graph) {
  state.editingComparisonId = null;
  editingPresetId = graph.presetId;
  highlightActivePresetCard(graph.presetId);
  Object.assign(state, structuredClone({
    mode: graph.mode, customExpr: graph.customExpr, parameterizedExpr: graph.parameterizedExpr,
    customParams: graph.customParams, handles: graph.handles,
    multiplyIntegerPowers: graph.multiplyIntegerPowers
  }));
  document.getElementById('multiply-integer-powers').checked = state.multiplyIntegerPowers;
  document.getElementById('integer-power-hint').classList.toggle('hidden', !state.multiplyIntegerPowers);
  formulaInput.value = state.customExpr;
  syncHandleInputs();
  window.setMode(state.mode);
  state.editingComparisonId = graph.id;
  renderComparisonControls();
}
function renderComparisonControls() {
  document.getElementById('compare-count').textContent = state.comparisonGraphs.length + '/5';
  document.getElementById('compare-add').disabled = state.comparisonGraphs.length >= 5;
  const frames = document.getElementById('compare-frames');
  frames.replaceChildren();
  frames.classList.toggle('is-horizontal', state.vfxMode === 'linear1d');
  frames.hidden = !['linear1d', 'vertical1d'].includes(state.vfxMode);
  state.comparisonGraphs.forEach((graph, index) => {
    const frame = document.createElement('div');
    frame.className = 'vfx-track-frame' + (graph.id === state.editingComparisonId ? ' is-editing' : '');
    frame.style.setProperty('--track-color', comparisonColors[index]);
    frame.dataset.graphId = graph.id;
    const edit = document.createElement('button');
    edit.className = 'vfx-track-edit'; edit.title = 'Edit ' + graph.name;
    edit.setAttribute('aria-label', 'Edit graph ' + (index + 1) + ': ' + graph.name);
    const label = document.createElement('span'); label.textContent = (index + 1) + '. ' + graph.name;
    edit.appendChild(label); edit.onclick = () => editComparison(graph);
    const remove = document.createElement('button'); remove.className = 'vfx-track-remove';
    remove.textContent = '\u00d7'; remove.setAttribute('aria-label', 'Remove graph ' + (index + 1));
    remove.onclick = () => {
      state.comparisonGraphs = state.comparisonGraphs.filter(g => g.id !== graph.id);
      if (state.editingComparisonId === graph.id) state.editingComparisonId = null;
      renderComparisonControls();
    };
    frame.append(edit, remove); frames.appendChild(frame);
  });
}
function initComparisonControls() {
  renderComparisonControls();
  document.getElementById('compare-add').onclick = () => {
    syncEditedComparison();
    if (!addComparison(state.comparisonGraphs, captureGraph(state, editingPresetId))) return;
    // A new copy is independent; editing the main graph won't change either copy until a frame is selected.
    state.editingComparisonId = null;
    if (!['linear1d', 'vertical1d'].includes(state.vfxMode)) window.setVfxMotionMode('vertical1d');
    renderComparisonControls();
  };
}

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

window.setParticleStagger = function(value) {
  state.particleStagger = Number(value);
  initParticles();
};

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
  if (!['burst', 'linear1d', 'vertical1d', 'slash'].includes(mode)) return;
  state.vfxMode = mode;
  renderComparisonControls();
  state.slashHistory = [];
  state.linearHistory = [];
  const modes = ['burst', 'linear1d', 'vertical1d', 'slash'];
  modes.forEach(m => {
    const btn = document.getElementById(`mode-${m}-btn`);
    if (btn) {
      btn.className = m === mode ? 'vfx-tab vfx-tab--active' : 'vfx-tab';
    }
  });
};

// ── Outputs & Tab Switching ──

function updateOutputs() {
  syncEditedComparison();
  const snippets = state.activeTab === 'node-graph' ? null : generateCodeSnippets();
  if (codeOutput && snippets) {
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
  const allTabs = ['node-graph', 'hlsl', 'glsl', 'compact', 'unity', 'css'];
  allTabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (!btn) return;
    btn.className = t === tab ? 'vfx-tab vfx-tab--active' : 'vfx-tab';
  });
  updateOutputs();
};

// ── B\u00e9zier Handle Interaction ──

setupCurveNavigation(canvas,{
  render:()=>renderCurveCanvas(canvas,ctx),
  onHandleChange:()=>{highlightActivePresetCard(null);syncHandleInputs();scheduleOutputs();}
});

['p0x','p1x','p2x','p3x'].forEach(id=>{const input=document.getElementById(id);input.readOnly=true;input.title='Fixed X: direct polynomial evaluation for realtime shaders';});

// ── Handle Input Sync ──

function syncHandleInputs() {
  document.getElementById('p0x').value = Number(state.handles.p0.x.toFixed(2));
  document.getElementById('p0y').value = Number(state.handles.p0.y.toFixed(2));
  document.getElementById('p1x').value = Number(state.handles.p1.x.toFixed(2));
  document.getElementById('p1y').value = Number(state.handles.p1.y.toFixed(2));
  document.getElementById('p2x').value = Number(state.handles.p2.x.toFixed(2));
  document.getElementById('p2y').value = Number(state.handles.p2.y.toFixed(2));
  document.getElementById('p3x').value = Number(state.handles.p3.x.toFixed(2));
  document.getElementById('p3y').value = Number(state.handles.p3.y.toFixed(2));
}

function normalizeHandles() {
  ['p0','p1','p2','p3'].forEach((key,i)=>{state.handles[key].x=i/3;});
}
window.updateHandleFromInput = function(id) {
  const keys = id ? [id] : ['p0x','p0y','p1x','p1y','p2x','p2y','p3x','p3y'];
  keys.forEach(key => {
    const value=Number(document.getElementById(key).value);
    if (Number.isFinite(value)) state.handles[key.slice(0,2)][key[2]]=Number(value.toFixed(2));
  });
  normalizeHandles();
  syncHandleInputs();
  highlightActivePresetCard(null);
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
};

// ── Animation Loop ──

window.setPlaybackSpeed = function(value) {
  const parsed = Number(value);
  if (String(value).trim() && Number.isFinite(parsed)) state.speed = Math.round(Math.max(.05, Math.min(3, parsed)) * 100) / 100;
  document.getElementById('speed-slider').value = state.speed;
  document.getElementById('speed-input').value = state.speed.toFixed(2);
  speedLabel.textContent = state.speed.toFixed(2) + 'x';
};

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
  state.currentTime = Math.max(0, Math.min(1, Number(val)));
  state.slashHistory = []; state.linearHistory = [];
  state.isPlaying = false;
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
};

// ── Mode Switching ──

window.setMode = function(mode) {
  if (mode === 'bezier' && state.mode === 'expression' && document.getElementById('mode-bezier-btn').classList.contains('hidden')) return;
  const previousMode = state.mode;
  state.mode = mode;
  const bezierBtn = document.getElementById('mode-bezier-btn');
  const exprBtn = document.getElementById('mode-expr-btn');
  const bezierControls = document.getElementById('bezier-controls');
  const exprControls = document.getElementById('expression-controls');
  const hint = document.getElementById('editor-hint');

  updateBezierButtonVisibility();

  if (mode === 'bezier') {
    bezierBtn?.classList.add('vfx-tab--active');
    exprBtn?.classList.remove('vfx-tab--active');
    normalizeHandles();
    syncHandleInputs();
    bezierControls?.classList.remove('hidden');
    exprControls?.classList.add('hidden');
    hint.innerHTML = 'ลาก Handle <span style="color:var(--vfx-curve-handle-1);font-weight:700">P1</span> และ <span style="color:var(--vfx-curve-handle-2);font-weight:700">P2</span> เพื่อปรับ Y • X คงที่สำหรับ shader ที่ไม่มีลูป';
  } else {
    exprBtn?.classList.add('vfx-tab--active');
    bezierBtn?.classList.remove('vfx-tab--active');
    bezierControls?.classList.add('hidden');
    exprControls?.classList.remove('hidden');
    hint.innerHTML = 'โหมด Custom Expression: กราฟและโหนดจะถูกแปลงตามสมการคณิตศาสตร์ที่ระบุ';

    // Synchronize expression formula from active preset or current Bézier curve
    const activePreset = state.presets.find(p => p.id === state.selectedPresetId);
    if (previousMode !== 'expression' && activePreset && activePreset.expr) {
      state.customExpr = activePreset.expr;
    } else if (previousMode !== 'expression') {
      state.customExpr = getBezierCompactFormula();
    }
    if (formulaInput) {
      formulaInput.value = state.customExpr;
    }
    if (formulaError) {
      formulaError.classList.add('hidden');
    }
    if(previousMode !== 'expression') state.customParams = {};
    renderCustomParameterSliders();
  }
  updateOutputs();
  renderCurveCanvas(canvas, ctx);
};

// ── Dynamic Expression Parameter Sliders ──

function renderCustomParameterSliders() {
  if (!customParamsContainer || !customParamsList) return;

  if (state.mode !== 'expression') {
    customParamsContainer.classList.add('hidden');
    return;
  }

  const roundedExpression=roundExpressionNumbers(state.customExpr);
  const expressionTemplate=state.multiplyIntegerPowers?roundLiteralPowerExponents(roundedExpression):roundedExpression;
  state.customExpr=expressionTemplate;formulaInput.value=expressionTemplate;
  const preset = state.presets.find(p => p.id === editingPresetId);
  const detectedParams = extractExpressionParameters(expressionTemplate, preset?.paramNames);
  state.parameterizedExpr = detectedParams.parameterizedExpr || state.customExpr;

  if (detectedParams.length === 0) {
    customParamsContainer.classList.add('hidden');
    state.customParams = {};
    return;
  }

  customParamsContainer.classList.remove('hidden');
  customParamsList.innerHTML = '';

  const integerParams=state.multiplyIntegerPowers?integerExponentParameters(state.parameterizedExpr):new Set();
  state.customParams = Object.fromEntries(detectedParams.map(p=>[p.name, Number((state.customParams[p.name] ?? p.defaultVal).toFixed(2))]));
  integerParams.forEach(name=>{state.customParams[name]=Math.round(state.customParams[name]);});
  const syncExpression=()=>{
    let displayExpr=expressionTemplate;
    detectedParams.filter(p=>p.start!==undefined).sort((a,b)=>b.start-a.start).forEach(p=>{
      displayExpr=displayExpr.slice(0,p.start)+String(state.customParams[p.name])+displayExpr.slice(p.end);
    });
    state.customExpr=displayExpr;formulaInput.value=displayExpr;
  };
  syncExpression();
  detectedParams.forEach(param => {
    // Preserve current value if already tuned, else initialize with defaultVal
    if (state.customParams[param.name] === undefined) {
      state.customParams[param.name] = param.defaultVal;
    }
    const currentVal = state.customParams[param.name];
    const integer=integerParams.has(param.name);
    const sliderMin=integer?Math.floor(param.min):param.min;
    const sliderMax=integer?Math.ceil(param.max):param.max;

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 11px;';

    row.innerHTML = `
      <span class="font-mono" style="min-width: 60px; font-weight: 600; color: var(--vfx-curve-handle-2);">${param.name}:</span>
      <input type="range" min="${sliderMin}" max="${sliderMax}" step="${integer?1:param.step}" value="${currentVal}"
        style="flex: 1; height: 5px; accent-color: var(--vfx-action); cursor: pointer;"
        id="slider-param-${param.name}">
      <span class="font-mono" id="val-param-${param.name}" style="min-width: 36px; text-align: right; color: var(--vfx-text);">${Number(currentVal).toFixed(2)}</span>
    `;

    const slider = row.querySelector(`#slider-param-${param.name}`);
    slider.oninput = (e) => {
      const newVal = integer?Math.round(Number(e.target.value)):Number(Number(e.target.value).toFixed(2));
      e.target.value=String(newVal);
      state.customParams[param.name] = newVal;
      const label = row.querySelector(`#val-param-${param.name}`);
      if (label) label.textContent = newVal.toFixed(2);

      syncExpression();
      rememberPresetParameters(editingPresetId, state.customParams);

      highlightActivePresetCard(null);
      state.slashHistory = []; state.linearHistory = [];
      // Instantly update curve, particles, node graph, and code preview
      updateOutputs();
      renderCurveCanvas(canvas, ctx);
    };

    customParamsList.appendChild(row);
  });
}

// ── Custom Formula ──

window.applyCustomFormula = function() {
  const val = formulaInput.value.trim();
  try {
    const normalized=roundExpressionNumbers(val);
    const definitions = extractExpressionParameters(normalized);
    const defaults = Object.fromEntries(definitions.map(p=>[p.name,p.defaultVal]));
    const testRes = evaluateExpression(definitions.parameterizedExpr, 0.5, defaults);
    if (!Number.isFinite(testRes)) throw new Error('Result is not finite at t=0.5');
    formulaError.classList.add('hidden');
    editingPresetId = null;
    state.customExpr = normalized;
    state.mode = 'expression';
    state.customParams = {};
    highlightActivePresetCard(null);
    tipTitle.textContent = 'สมการแบบกำหนดเอง:';
    tipContent.textContent = normalized;
    renderCustomParameterSliders();
    updateOutputs();
    renderCurveCanvas(canvas, ctx);
  } catch (err) {
    formulaError.textContent = 'Syntax Error: ' + err.message;
    formulaError.classList.remove('hidden');
  }
};

// ── Load Preset ──

function loadPreset(preset) {
  state.editingComparisonId = null;
  renderComparisonControls();
  editingPresetId = preset.id;
  state.customParams = {}; state.parameterizedExpr = '';
  state.slashHistory = []; state.linearHistory = [];
  highlightActivePresetCard(preset.id);
  tipTitle.textContent = `วิธีนำ ${preset.name} ไปต่อในกราฟ:`;
  tipContent.textContent = preset.tip || preset.desc;

  // Always keep formulaInput and customExpr in sync with the selected preset
  if (preset.expr) {
    state.customExpr = preset.expr;
    if (formulaInput) formulaInput.value = preset.expr;
    if (formulaError) formulaError.classList.add('hidden');
  }

  if (preset.type === 'bezier') {

    state.handles.p0 = { x: preset.p0[0], y: preset.p0[1] };
    state.handles.p1 = { x: preset.p1[0], y: preset.p1[1] };
    state.handles.p2 = { x: preset.p2[0], y: preset.p2[1] };
    state.handles.p3 = { x: preset.p3[0], y: preset.p3[1] };
    normalizeHandles();
    syncHandleInputs();
  }
  state.customParams = {};
  setMode('expression');
  if (formulaInput) formulaInput.value = preset.expr;
  state.customExpr = preset.expr;
  state.customParams = presetParameters(preset).params;
  renderCustomParameterSliders();
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

async function copyText(text, message) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement('textarea');
    input.value = text; document.body.appendChild(input); input.select();
    const ok = document.execCommand('copy'); input.remove();
    if (!ok) { showToast('ไม่สามารถคัดลอกได้ กรุณาคัดลอกข้อความด้วยตนเอง'); return; }
  }
  showToast(message);
}
window.copyCurrentCode = () => copyText(codeOutput.textContent, 'คัดลอกโค้ดลงคลิปบอร์ดแล้ว!');
window.resetNodeGraphView = resetNodeGraphView;
window.setMultiplyIntegerPowers = value => {
  state.multiplyIntegerPowers=value;
  document.getElementById('integer-power-hint').classList.toggle('hidden',!value);
  renderCustomParameterSliders();
  state.slashHistory=[];state.linearHistory=[];
  updateOutputs();renderCurveCanvas(canvas,ctx);
};
window.setExposeShaderParams = value => {state.exposeShaderParams=value;updateOutputs();};
let pendingOutputFrame=null;
function scheduleOutputs(){
  if(pendingOutputFrame!==null)return;
  pendingOutputFrame=requestAnimationFrame(()=>{pendingOutputFrame=null;updateOutputs();});
}

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
  initComparisonControls();
  syncHandleInputs();
  setupNodeGraphInteractions(nodeGraphSvg);
  switchTab('node-graph');

  const defaultPreset = state.presets.find(p => p.id === 'smoothstep');
  if (defaultPreset) loadPreset(defaultPreset);

  requestAnimationFrame(vfxLoop);
});

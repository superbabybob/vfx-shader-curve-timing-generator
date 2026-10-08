/**
 * ═══════════════════════════════════════════════════════
 * State Module — Centralized application state
 * Categories grouped by mathematical equation types
 * ═══════════════════════════════════════════════════════
 */

export const state = {
  mode: 'expression',
  exposeShaderParams: false,
  multiplyIntegerPowers: false,
  selectedPresetId: 'smoothstep',
  activeCategory: 'all',
  searchQuery: '',
  handles: {
    p0: { x: 0.0, y: 0.0 },
    p1: { x: 1/3, y: 0.0 },
    p2: { x: 2/3, y: 1.0 },
    p3: { x: 1.0, y: 1.0 }
  },
  customExpr: 'smoothstep(0.0, 1.0, t)',
  parameterizedExpr: 'smoothstep(start, end, t)',
  customParams: {start:0,end:1},
  activeTab: 'node-graph',
  currentTime: 0.0,
  isPlaying: true,
  speed: 1.0,
  activeDrag: null,

  // Particle Simulation Settings
  vfxMode: 'burst',
  comparisonGraphs: [],
  editingComparisonId: null,
  particleCount: 12,
  particleStagger: 0.08,
  particles: [],
  slashHistory: [],
  linearHistory: [],

  // Mathematical equation category pills
  categories: [
    { id: 'all', label: 'ทั้งหมด (All)' },
    { id: 'polynomial', label: '📐 พหุนาม (xⁿ, Quad, Cubic, Bézier)' },
    { id: 'hermite', label: '〰️ Hermite (Smoothstep, S-Curve)' },
    { id: 'trig', label: '🔄 ตรีโกณมิติ (Sine, Cosine, Wave)' },
    { id: 'exp', label: '⚡ เอกซ์โพเนนเชียล (exp, Damped Decay)' },
    { id: 'piecewise', label: '🪜 แยกช่วง & สเต็ป (clamp, frac, floor)' }
  ]
};

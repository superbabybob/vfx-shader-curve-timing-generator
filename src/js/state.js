/**
 * ═══════════════════════════════════════════════════════
 * State Module — Centralized application state
 * ═══════════════════════════════════════════════════════
 */

export const state = {
  mode: 'bezier',
  selectedPresetId: 'smoothstep',
  activeCategory: 'all',
  searchQuery: '',
  handles: {
    p0: { x: 0.0, y: 0.0 },
    p1: { x: 0.42, y: 0.0 },
    p2: { x: 0.58, y: 1.0 },
    p3: { x: 1.0, y: 1.0 }
  },
  customExpr: 'smoothstep(0.0, 1.0, t)',
  activeTab: 'node-graph',
  currentTime: 0.0,
  isPlaying: true,
  speed: 1.0,
  activeDrag: null,

  // Particle Simulation Settings
  vfxMode: 'burst',
  particleCount: 12,
  particleStagger: 0.08,
  particles: [],
  slashHistory: [],
  linearHistory: [],

  categories: [
    { id: 'all', label: 'ทั้งหมด (All)' },
    { id: 'easing', label: 'Easing & Transition' },
    { id: 'flash', label: 'Flash & Glow (0→1→0)' },
    { id: 'physics', label: 'Impact & Overshoot' },
    { id: 'oscillation', label: 'Loops & Pulses' },
    { id: 'stagger', label: 'Stagger & Steps' }
  ]
};

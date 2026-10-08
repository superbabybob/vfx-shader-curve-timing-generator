import {extractExpressionParameters, roundExpressionNumbers, evaluateExpression} from './expression-graph-builder.js';
import {expressionWithPowerOptions} from './power-options.js';

export const comparisonColors = ['#4C9AFF', '#F4B860', '#52D6A4', '#C494FF', '#FF7D9C'];
const storageKey = 'vfx-preset-params-v1';
let saved = {};
const definitionsCache = new Map();
try { saved = JSON.parse(globalThis.localStorage?.getItem(storageKey) || '{}') || {}; } catch {}
export function presetParameters(preset) {
  let definitions = definitionsCache.get(preset.id);
  if (!definitions) {
    definitions = extractExpressionParameters(roundExpressionNumbers(preset.expr), preset.paramNames);
    definitionsCache.set(preset.id, definitions);
  }
  const params = Object.fromEntries(definitions.map(p => {
    const value = saved[preset.id]?.[p.name];
    return [p.name, Number.isFinite(value) ? value : p.defaultVal];
  }));
  return {expression: definitions.parameterizedExpr, params};
}
export function rememberPresetParameters(id, params) {
  if (!id) return;
  saved[id] = {...params};
  try { globalThis.localStorage?.setItem(storageKey, JSON.stringify(saved)); } catch {}
}
export function captureGraph(state, presetId = null) {
  return structuredClone({
    presetId, name: state.presets?.find(p => p.id === presetId)?.name || 'Custom Graph',
    mode: state.mode, customExpr: state.customExpr, parameterizedExpr: state.parameterizedExpr,
    customParams: state.customParams, handles: state.handles,
    multiplyIntegerPowers: state.multiplyIntegerPowers
  });
}
export function addComparison(entries, graph) {
  if (entries.length >= 5) return null;
  const entry = {...structuredClone(graph), id: globalThis.crypto.randomUUID()};
  entries.push(entry);
  return entry;
}
export function comparisonValue(graph, t) {
  if (graph.mode === 'bezier') {
    const {p0, p1, p2, p3} = graph.handles;
    const u = 1 - t;
    return u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
  }
  try {
    const expression = graph.parameterizedExpr || graph.customExpr;
    const params = graph.customParams;
    const value = evaluateExpression(expressionWithPowerOptions(expression, params, graph.multiplyIntegerPowers), t, params);
    return Number.isFinite(value) ? value : 0;
  } catch { return 0; }
}

let rangeKey = '', sampledMin = 0, sampledMax = 1;
// Sample the entire playback interval so the axis stays still while time advances.
export function trackRange(graphs, currentValues = []) {
  const key = JSON.stringify(graphs);
  if (key !== rangeKey) {
    rangeKey = key; sampledMin = 0; sampledMax = 1;
    for (const graph of graphs) {
      for (let i = 0; i <= 512; i++) {
        const value = comparisonValue(graph, i / 512);
        if (Number.isFinite(value)) {
          sampledMin = Math.min(sampledMin, value);
          sampledMax = Math.max(sampledMax, value);
        }
      }
    }
  }
  // Include exact live values too, for narrow peaks between sample points.
  for (const value of currentValues) if (Number.isFinite(value)) {
    sampledMin = Math.min(sampledMin, value);
    sampledMax = Math.max(sampledMax, value);
  }
  const rawStep = (sampledMax - sampledMin) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].find(n => n * magnitude >= rawStep) * magnitude;
  const min = Math.floor(sampledMin / step) * step;
  const max = Math.ceil(sampledMax / step) * step;
  const ticks = [];
  for (let i = 0; i <= Math.round((max - min) / step); i++) ticks.push(Number((min + i * step).toPrecision(10)));
  return {min, max, ticks};
}

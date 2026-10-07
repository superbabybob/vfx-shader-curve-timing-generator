/**
 * ═══════════════════════════════════════════════════════
 * Code Generator — Export shader code in HLSL, GLSL,
 * compact math, Unity function, CSS formats
 * ═══════════════════════════════════════════════════════
 */

import { state } from './state.js';

export function generateCodeSnippets() {
  const { p1, p2, p3 } = state.handles;
  const round = (v) => Number(v.toFixed(3));

  if (state.mode === 'bezier') {
    const c1 = round(3.0 * p1.y);
    const c2 = round(3.0 * p2.y);
    const p3y = round(p3.y);

    const terms = [];
    if (Math.abs(c1) > 0.0001) {
      terms.push(c1 === 1.0 ? 'omt * omt * u' : (c1 === -1.0 ? '-omt * omt * u' : `${c1} * omt * omt * u`));
    }
    if (Math.abs(c2) > 0.0001) {
      terms.push(c2 === 1.0 ? 'omt * u * u' : (c2 === -1.0 ? '-omt * u * u' : `${c2} * omt * u * u`));
    }
    if (Math.abs(p3y) > 0.0001) {
      terms.push(p3y === 1.0 ? 'u * u * u' : (p3y === -1.0 ? '-u * u * u' : `${p3y} * u * u * u`));
    }

    const returnExpr = terms.length > 0 ? terms.join(' + ') : '0.0';

    const compactTerms = [];
    if (Math.abs(c1) > 0.0001) {
      compactTerms.push(c1 === 1.0 ? '(1.0 - t) * (1.0 - t) * t' : `${c1} * (1.0 - t) * (1.0 - t) * t`);
    }
    if (Math.abs(c2) > 0.0001) {
      compactTerms.push(c2 === 1.0 ? '(1.0 - t) * t * t' : `${c2} * (1.0 - t) * t * t`);
    }
    if (Math.abs(p3y) > 0.0001) {
      compactTerms.push(p3y === 1.0 ? 't * t * t' : `${p3y} * t * t * t`);
    }
    const compactExpr = compactTerms.length > 0 ? compactTerms.join(' + ') : '0.0';

    return {
      hlsl: `// HLSL / GLSL Cubic B\u00e9zier Evaluator (Optimized)\n// P1 = (${round(p1.x)}, ${round(p1.y)}), P2 = (${round(p2.x)}, ${round(p2.y)})\nfloat EvaluateVFXCurve(float t)\n{\n    float u = saturate(t);\n    float omt = 1.0 - u;\n    return ${returnExpr};\n}`,
      compact: `float y = ${compactExpr};`,
      unity: `// Shader Function (In: float t, Out: float Out)\nfloat u = saturate(t);\nfloat omt = 1.0 - u;\nOut = ${returnExpr};`,
      css: `/* CSS Animation Timing */\ntransition-timing-function: cubic-bezier(${round(p1.x)}, ${round(p1.y)}, ${round(p2.x)}, ${round(p2.y)});`
    };
  } else {
    const expr = state.customExpr;
    return {
      hlsl: `// HLSL / GLSL Custom Expression\nfloat EvaluateVFXCurve(float t)\n{\n    float val = ${expr};\n    return val;\n}`,
      compact: `float y = ${expr};`,
      unity: `// Shader Function (In: float t, Out: float Out)\nOut = ${expr};`,
      css: `/* Expression: ${expr} */`
    };
  }
}

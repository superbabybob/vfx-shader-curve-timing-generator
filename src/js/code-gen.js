import {constantCodeName,constantDefinitions} from './standard-constants.js';
import { expressionWithPowerOptions, expressionVariables } from './power-options.js';
import { state } from './state.js';
import { isNonNegative, optimizeExpression } from './expression-graph-builder.js';

export function getBezierCoefficients(){
  const {p0,p1,p2,p3}=state.handles;
  return {a:-p0.y+3*p1.y-3*p2.y+p3.y,b:3*p0.y-6*p1.y+3*p2.y,c:3*(p1.y-p0.y),d:p0.y};
}
export function getBezierCompactFormula() { return hornerPolynomial('y','t'); }

function emitShaderMath(ast){
  const lines=[], cache=new Map();
  function visit(n){
    if(n.type==='number'){
      if(n.constantName==='FOUR_PI')return '(PI * 4.0)';
      return n.constantName?constantCodeName(n.constantName):floatLiteral(n.value);
    }
    if(n.type==='variable')return n.name;
    const key=JSON.stringify(n);
    if(cache.has(key))return cache.get(key);
    let expression;
    if(n.type==='binary')expression=`(${visit(n.left)} ${n.op} ${visit(n.right)})`;
    else if(n.type==='unary')expression=`(-${visit(n.operand)})`;
    else {
      const fn=n.fn==='pow'?(isNonNegative(n.args[0])?'pow':'VFXPow'):n.fn==='bezier'?'VFXBezier':n.fn;
      expression=`${fn}(${n.args.map(visit).join(', ')})`;
    }
    const name=`v${lines.length+1}`;
    lines.push(`float ${name} = ${expression};`);cache.set(key,name);return name;
  }
  const expression=visit(ast);
  return lines.concat(`float val = ${expression};`).join('\n');
}
const floatLiteral = v => Number.isInteger(v) ? `${v}.0` : String(v);
function hornerPolynomial(axis, u='u') {
  const {p0,p1,p2,p3}=state.handles;
  const [a,b,c,d]=[-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis],3*p0[axis]-6*p1[axis]+3*p2[axis],3*(p1[axis]-p0[axis]),p0[axis]];
  const literal=v=>floatLiteral(Number(v.toPrecision(15)));
  let expr=literal(a);
  for(const coefficient of [b,c,d]){
    if(expr==='0.0'){expr=literal(coefficient);continue;}
    const term=coefficient===0 ? '' : ` ${coefficient<0?'-':'+'} ${literal(Math.abs(coefficient))}`;
    expr=`(${expr} * ${u}${term})`;
  }
  return expr;
}
export function generateCodeSnippets() {
  let body, params = [];
  if(state.mode === 'bezier') {
    if(state.exposeShaderParams){
      params=Object.entries(getBezierCoefficients());
      body=emitShaderMath(optimizeExpression('((a*t+b)*t+c)*t+d'));
    }else body = emitShaderMath(optimizeExpression(getBezierCompactFormula()));
  } else {
    params = state.exposeShaderParams ? Object.entries(state.customParams || {}) : [];
    const expr = expressionWithPowerOptions(state.parameterizedExpr || state.customExpr,state.customParams,state.multiplyIntegerPowers);
    const used=expressionVariables(expr);
    params=params.filter(([name])=>used.has(name));
    body = emitShaderMath(optimizeExpression(expr,state.exposeShaderParams ? {} : state.customParams));
  }
  const constants=constantDefinitions(body);
  const signature = params.map(([k,v])=>`, float ${k} /* = ${v} */`).join('');
  const inputs = params.map(([k])=>`, float ${k}`).join('');
  const comments = params.map(([k,v])=>`// Parameter: ${k} = ${v}`).join('\n');
  const powerHelper = `float VFXPow(float a, float b) { if (a < 0.0) { if (b != floor(b)) return 0.0; return pow(-a, b) * (1.0 - 4.0 * (b * 0.5 - floor(b * 0.5))); } return pow(a, b); }\n`;
  const bezierHelper = `float VFXBezierAxis(float u, float a, float b, float c, float d) { float v = 1.0-u; return v*v*v*a+3.0*v*v*u*b+3.0*v*u*u*c+u*u*u*d; }
float VFXBezier(float t, float x0, float y0, float x1, float y1, float x2, float y2, float x3, float y3) {
    if(t <= x0) return y0; if(t >= x3) return y3;
    float lo=0.0, hi=1.0;
    for(int i=0;i<24;i++) { float u=(lo+hi)*0.5; if(VFXBezierAxis(u,x0,x1,x2,x3)<t) lo=u; else hi=u; }
    return VFXBezierAxis((lo+hi)*0.5,y0,y1,y2,y3);
}\n`;
  const helpers = (body.includes('VFXPow(') ? powerHelper : '') + (body.includes('VFXBezier(') ? bezierHelper : '');
  const hlsl = `// HLSL (normalized time t)\nfloat EvaluateVFXCurve(float t${signature})\n{\n    ${body.replaceAll('\n','\n    ')}\n    return val;\n}`;
  const glsl = hlsl.replace('// HLSL','// GLSL').replace(/\bfrac\(/g,'fract(');
  // HLSL-only intrinsics in arbitrary nested expressions use scalar helpers in GLSL.
  const glslHelpers = body.includes('saturate(') ? `float saturate(float x) { return clamp(x, 0.0, 1.0); }\n` : '';
  const unity = `// Unity Custom Function Node: File mode, name EvaluateVFXCurve\nvoid EvaluateVFXCurve_float(float t${inputs}, out float Out)\n{\n    ${body.replaceAll('\n','\n    ')}\n    Out = val;\n}`;
  const css = state.mode === 'bezier' && state.handles.p0.x === 0 && state.handles.p0.y === 0 && state.handles.p3.x === 1 && state.handles.p3.y === 1
    ? `transition-timing-function: cubic-bezier(${state.handles.p1.x}, ${state.handles.p1.y}, ${state.handles.p2.x}, ${state.handles.p2.y});`
    : `/* ${comments}\nExpression: ${state.customExpr}\nCSS cubic-bezier cannot represent this curve. */`;
  return {hlsl: constants+helpers+hlsl, glsl:constants+helpers+glslHelpers+glsl,compact: constants+ (helpers ? '// Copy the VFX helpers from the HLSL export.\n' : '')+comments+'\n'+body+'\nfloat y = val;', unity:constants+helpers+unity, css};
}

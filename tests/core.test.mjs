import {shaderConstants,standardConstants} from '../src/js/standard-constants.js';
﻿import assert from 'node:assert/strict';
import {expressionWithPowerOptions} from '../src/js/power-options.js';
import {state} from '../src/js/state.js';
import {presets} from '../src/js/presets.js';
import {evaluateGraph,evalCustomExpression,solveBezierYForX} from '../src/js/math-engine.js';
import {evaluateExpression,extractExpressionParameters,buildGraphFromExpression,mathFunctions,roundExpressionNumbers} from '../src/js/expression-graph-builder.js';
import {generateNodeGraphModel} from '../src/js/node-graph-model.js';
import {generateCodeSnippets} from '../src/js/code-gen.js';
assert.equal(roundExpressionNumbers('1.02573529411765 - exp(-2.97794117647059 * t)'),'1.03 - exp(-2.98 * t)');
assert.equal(roundExpressionNumbers('param123*t + 6.28318'),'param123*t + TAU');
assert.equal(roundExpressionNumbers('1e-3*t'),'0*t');
state.presets=presets;
const near=(a,b,tol=2e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
function graphValue(graph,t,params={}) {
  const values=new Map();
  const nodeMap=new Map(graph.nodes.map(n=>[n.id,n]));
  const arg=r=>r.isConstant?r.value:visit(r.id);
  function visit(id){
    if(values.has(id)) return values.get(id);
    const n=nodeMap.get(id);
    let value;
    if(id==='in_t') value=t;
    else if(id.startsWith('param_')) value=params[id.slice(6)] ?? n.value;
    else if(n.type==='constant')value=n.value;
    else if(id==='out') value=arg(n.args[0]);
    else if(n.op==='bezierSolve'){const [t,x0,x1,x2,x3]=n.args.map(arg);let lo=0,hi=1;const target=Math.max(x0,Math.min(x3,t));for(let i=0;i<24;i++){const u=(lo+hi)/2,v=1-u;const x=v*v*v*x0+3*v*v*u*x1+3*v*u*u*x2+u*u*u*x3;if(x<target)lo=u;else hi=u;}value=(lo+hi)/2;}
    else {
      const a=n.args.map(arg);
      const ops={'+':()=>a[0]+a[1],'-':()=>a[0]-a[1],'*':()=>a[0]*a[1],'/':()=>a[0]/a[1],negate:()=>-a[0],oneMinus:()=>1-a[0]};
      value=ops[n.op]?ops[n.op]():mathFunctions[n.op](...a);
    }
    values.set(id,value);return value;
  }
  return visit('out');
}
function checkLayout(g){
  for(let i=0;i<g.nodes.length;i++) for(let j=i+1;j<g.nodes.length;j++){
    const a=g.nodes[i],b=g.nodes[j];
    assert.ok(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y,`overlap ${a.id} ${b.id}`);
  }
  for(const w of g.wires){const from=g.nodes.find(n=>n.id===w.from),to=g.nodes.find(n=>n.id===w.to);assert.ok(from.x+from.w<to.x);}
}
// Heartbeat maps directly to its 13 operations including adjustable cycle counts, even with exposed parameters.
const heartbeat=presets.find(p=>p.id==='heartbeat-double-pulse');
const heartbeatDefs=extractExpressionParameters(heartbeat.expr);
const heartbeatParams=Object.fromEntries(heartbeatDefs.map(p=>[p.name,p.defaultVal]));
const heartbeatGraph=buildGraphFromExpression(heartbeatDefs.parameterizedExpr,heartbeatParams);
assert.equal(heartbeatGraph.nodes.filter(n=>n.type==='math').length,13);
assert.equal(heartbeatGraph.nodes.filter(n=>n.op==='pow').length,2);
assert.ok(!heartbeatGraph.nodes.some(n=>['floor','sign','abs','frac'].includes(n.op)));
for(const exponent of [2,3,2.5,8]) {
  const params={...heartbeatParams,param2:exponent,param6:exponent};
  for(let i=0;i<=100;i++)near(graphValue(heartbeatGraph,i/100,params),evaluateExpression(heartbeatDefs.parameterizedExpr,i/100,params));
}
// Share a repeated signal instead of rebuilding its entire branch.
const shared=buildGraphFromExpression('sin(t)+sin(t)');
assert.equal(shared.nodes.filter(n=>n.op==='sin').length,1);
near(graphValue(shared,0.3),2*Math.sin(0.3));
// Unknown-sign bases still need signed-power support under slider changes.
const signedGraph=buildGraphFromExpression('pow(t-offset, exponent)',{offset:1,exponent:3});
assert.ok(signedGraph.nodes.some(n=>n.op==='sign'));
for(const exponent of [2,3,2.5])for(const t of [0,0.3,0.7,1]) {
  const params={offset:1,exponent};
  near(graphValue(signedGraph,t,params),evaluateExpression('pow(t-offset, exponent)',t,params));
}
// Algebraic preset rewrites retain the documented shape.
for(let i=0;i<=100;i++){
  const t=i/100;
  near(evalCustomExpression(t,presets.find(p=>p.id==='ease-out-quad').expr),1-(1-t)*(1-t));
  near(evalCustomExpression(t,presets.find(p=>p.id==='overshoot-backout').expr),1+2.7*Math.pow(t-1,3)+1.7*Math.pow(t-1,2));
}
assert.equal(presets.length,48);
assert.equal(new Set(presets.map(p=>p.id)).size,presets.length);
assert.equal(new Set(presets.map(p=>p.expr)).size,presets.length);
for(const p of presets){
  state.mode='expression';state.exposeShaderParams=false;state.customExpr=p.expr;
  if(p.type==='bezier') for(const k of ['p0','p1','p2','p3'])state.handles[k]={x:p[k][0],y:p[k][1]};
  const defs=extractExpressionParameters(p.expr);
  state.parameterizedExpr=defs.parameterizedExpr;
  state.customParams=Object.fromEntries(defs.map(d=>[d.name,d.defaultVal]));
  const g=generateNodeGraphModel();checkLayout(g);
  const snippets=generateCodeSnippets();
  assert.ok(!/for\s*\(|while\s*\(|VFXBezier|VFXPow|\bpow\(/.test(snippets.hlsl),p.id+' must use direct, loop-free math');
  assert.ok(!g.nodes.some(n=>n.subgraph),p.id);
  for(const def of defs){
    assert.ok(g.nodes.some(n=>n.id===`param_${def.name}`),`${p.id}: missing ${def.name}`);
    assert.ok(g.wires.some(w=>w.from===`param_${def.name}`),`${p.id}: disconnected ${def.name}`);
  }
  const structureBefore=JSON.stringify({nodes:g.nodes.map(n=>[n.id,n.x,n.y]),wires:g.wires});
  const valuesBefore={...state.customParams};
  const first=defs[0];
  if(first){
    state.customParams[first.name]+=0.01;
    const updated=generateNodeGraphModel();
    assert.equal(updated,g);
    assert.equal(updated.nodes.find(n=>n.id===`param_${first.name}`).value,state.customParams[first.name]);
    assert.equal(JSON.stringify({nodes:updated.nodes.map(n=>[n.id,n.x,n.y]),wires:updated.wires}),structureBefore);
    state.customParams=valuesBefore;generateNodeGraphModel();
  }
  const shaderMath=snippets.compact.replace(/^(?:\/\/|#).*$/gm,'').replace(/\bfloat /g,'let ');
  const shaderEval=new Function('t',...Object.keys(mathFunctions),...Object.keys(shaderConstants),shaderMath+';return y;');
  for(let i=0;i<=100;i++){
    const t=i/100,expected=evalCustomExpression(t,p.expr);
    near(evaluateGraph(t),expected);
    near(graphValue(g,t,state.customParams),expected);
    near(shaderEval(t,...Object.values(mathFunctions),...Object.values(shaderConstants)),expected);
  }
  const code=generateCodeSnippets();assert.ok(code.unity.includes('void EvaluateVFXCurve_float'));assert.ok(!code.glsl.includes('frac('));
}
// Shape checks guard against distinct names accidentally sharing the wrong envelope.
const presetValue=(id,t)=>evaluateExpression(presets.find(p=>p.id===id).expr,t);
near(presetValue('early-pulse',1/3),1);near(presetValue('late-pulse',2/3),1);
assert.ok(presetValue('early-pulse',0.2)>presetValue('late-pulse',0.2));
near(presetValue('compact-bell',0.5),1);
near(presetValue('cosine-breathing',0),0);near(presetValue('cosine-breathing',0.5),1);near(presetValue('cosine-breathing',1),0);
near(presetValue('signed-sine-swing',0.25),1);near(presetValue('signed-sine-swing',0.75),-1);
near(presetValue('tapered-ripple',1),0);
near(presetValue('impact-envelope',1/12),1);near(presetValue('delayed-impact-envelope',0.2),0);near(presetValue('delayed-impact-envelope',0.4),1);
for(const t of [0.225,0.675])near(presetValue('double-flash-window',t),1);
near(presetValue('double-flash-window',0.45),0);
near(presetValue('hard-gate-window',0.2),0);near(presetValue('hard-gate-window',0.21),1);near(presetValue('hard-gate-window',0.6),0);
near(presetValue('flash-hold-decay',0.5),1);near(presetValue('flash-hold-decay',1),0);
near(presetValue('normalized-staircase',0.249),0);near(presetValue('normalized-staircase',0.25),0.25);near(presetValue('normalized-staircase',1),1);
for(const id of ['early-pulse','late-pulse','compact-bell','smooth-flash-window','delayed-ignite','smooth-fade-out','double-flash-window','cosine-breathing','rectified-sine-pulses','triangle-pulse','triangle-pulse-train','flash-hold-decay','normalized-staircase']){
  for(let i=0;i<=100;i++){const value=presetValue(id,i/100);assert.ok(value>=-1e-10 && value<=1+1e-10,`${id}: unbounded at ${i/100}`);}
}
for(const expr of ['sqrt(t)','tan(t)','log(t+1)','sign(t-0.5)','ceil(t)','clamp(t,-2,3)','sin(PI*t)','min(2,3)','-sin(0.5)','0.7','pow(t-1,3)','pow(t-1,2.5)','1e-3*t','bezier(t,0,0,0.2,-0.3,0.8,1.4,1,1)','pow(t, exp)']){
  const defs=extractExpressionParameters(expr),params=Object.fromEntries(defs.map(d=>[d.name,d.defaultVal]));
  const g=buildGraphFromExpression(defs.parameterizedExpr,params);assert.ok(g);checkLayout(g);
  for(const t of [0,0.3,0.6,1])near(graphValue(g,t,params),evaluateExpression(defs.parameterizedExpr,t,params));
}
for(const bad of ['', 't+', 'sin(t', 't^2','t;alert(1)','t.foo', 'wat(t)','sin(t,1)', '1.2.3']) assert.throws(()=>extractExpressionParameters(bad),bad);
assert.equal(extractExpressionParameters('pow(t, exp)')[0].name,'exp');
assert.equal(new Set(extractExpressionParameters('sin(t*6)*0.5+0.5').map(d=>d.name)).size,3);
// The editable preview maps Power directly instead of expanding sign/parity guards.
state.mode='expression';state.customExpr='1.0 - pow(1.0 - t, 3.0)';
const cubicDefs=extractExpressionParameters(state.customExpr);
state.parameterizedExpr=cubicDefs.parameterizedExpr;
state.customParams=Object.fromEntries(cubicDefs.map(d=>[d.name,d.defaultVal]));
const cubicGraph=generateNodeGraphModel();
assert.deepEqual(cubicGraph.nodes.filter(n=>n.type==='math').map(n=>n.op),['-','pow','-']);
assert.equal(cubicGraph.nodes.filter(n=>n.id.startsWith('param_')).length,3);
for(const exponent of [2,3,2.5])for(const offset of [0.5,1,1.5]){
  state.customParams.param2=offset;state.customParams.param3=exponent;
  const g=generateNodeGraphModel();assert.equal(g,cubicGraph);
  for(const t of [0,0.3,0.7,1])near(graphValue(g,t,state.customParams),evaluateGraph(t));
}
for(const expression of ['pow(t, 3)','pow(t-0.5, 2.5)']){
  const graph=buildGraphFromExpression(expression,{}, {}, {},{expandSignedPower:false});
  assert.equal(graph.nodes.filter(n=>n.op==='pow').length,1);
  assert.ok(!graph.nodes.some(n=>['abs','sign','floor','frac'].includes(n.op)));
  for(const t of [0,0.5,1])near(graphValue(graph,t),evaluateExpression(expression,t));
}
// Integer-power conversion remains consistent across preview, graph and export.
state.mode='expression';state.customExpr='pow(t-offset, exponent)';state.parameterizedExpr=state.customExpr;
state.multiplyIntegerPowers=true;
for(const exponent of [-3,-2,0,1,2,2.7,8]){
  state.customParams={offset:0.5,exponent};
  const graph=generateNodeGraphModel();checkLayout(graph);
  assert.ok(!graph.nodes.some(n=>n.op==='pow'));
  if(exponent===8)assert.equal(graph.nodes.filter(n=>n.op==='*').length,3);
  const expectedExponent=Math.round(exponent);
  for(const runtime of [false,true]){
    state.exposeShaderParams=runtime;
    const code=generateCodeSnippets();
    assert.ok(!/\bpow\(|VFXPow|float exponent/.test(code.hlsl));
    const shaderMath=code.compact.replace(/^(?:\/\/|#).*$/gm,'').replace(/\bfloat /g,'let ');
    const shaderEval=new Function('t','offset',shaderMath+';return y;');
    for(const t of [0,0.3,0.7,1]){
      const expected=Math.pow(t-0.5,expectedExponent);
      near(evaluateGraph(t),expected);near(graphValue(graph,t,state.customParams),expected);
      near(shaderEval(t,0.5),expected);
    }
  }
}
// A time-dependent exponent cannot be replaced with a fixed multiplication graph.
assert.equal(expressionWithPowerOptions('pow(t,t)',{},true).fn,'pow');
state.multiplyIntegerPowers=false;state.exposeShaderParams=false;
assert.ok(generateNodeGraphModel().nodes.some(n=>n.op==='pow'));
// Standard constants retain their identities in graph and exported shader math.
state.mode='expression';state.multiplyIntegerPowers=false;
const constantsExpression=Object.keys(standardConstants).join('+')+'+sin(PI*t)+cos(TWO_PI*t)';
const constantsDefs=extractExpressionParameters(constantsExpression);
assert.equal(constantsDefs.length,0);
state.customExpr=constantsExpression;state.parameterizedExpr=constantsDefs.parameterizedExpr;state.customParams={};
const constantsGraph=generateNodeGraphModel();checkLayout(constantsGraph);
assert.equal(constantsGraph.nodes.filter(n=>n.type==='constant').length,Object.keys(standardConstants).length);
assert.ok(!constantsGraph.nodes.some(n=>n.id.startsWith('param_')));
assert.equal(constantsGraph.nodes.find(n=>n.id==='constant_PI').value,Math.PI);
assert.ok(constantsGraph.wires.filter(w=>w.from==='constant_PI').length>=2);
for(const runtime of [false,true]){
  state.exposeShaderParams=runtime;
  const snippets=generateCodeSnippets();
  assert.ok(snippets.hlsl.includes('#ifndef PI'));
  assert.ok(snippets.hlsl.includes('#define PI UNITY_PI'));
  assert.ok(snippets.unity.includes('TWO_PI'));
  assert.ok(!snippets.hlsl.includes('float PI'));
  const shaderMath=snippets.compact.replace(/^(?:\/\/|#).*$/gm,'').replace(/\bfloat /g,'let ');
  const shaderEval=new Function('t',...Object.keys(mathFunctions),...Object.keys(shaderConstants),shaderMath+';return y;');
  for(const t of [0,0.3,0.7,1]){
    const expected=Object.values(standardConstants).reduce((a,b)=>a+b,0)+Math.sin(Math.PI*t)+Math.cos(2*Math.PI*t);
    near(evaluateGraph(t),expected);near(graphValue(constantsGraph,t),expected);
    near(shaderEval(t,...Object.values(mathFunctions),...Object.values(shaderConstants)),expected);
  }
}
assert.equal(roundExpressionNumbers('sin(3.14159*t)'), 'sin(PI*t)');
assert.equal(extractExpressionParameters('sin(6.2831853*t)').length,0);
assert.equal(extractExpressionParameters('sin(3.14*t)').length,1);
assert.equal(extractExpressionParameters('sin(PI*t)+gain').map(d=>d.name).join(','),'gain');
state.exposeShaderParams=false;
// Y-only Bézier edits preserve a small fixed Horner graph and exact polynomial.
state.mode='bezier';state.handles={p0:{x:0,y:0},p1:{x:1/3,y:0},p2:{x:2/3,y:1},p3:{x:1,y:1}};
const structure=graph=>JSON.stringify({nodes:graph.nodes.map(n=>[n.id,n.op,n.title,n.x,n.y,n.w,n.h,n.inPorts]),wires:graph.wires});
const template=generateNodeGraphModel(),baseline=structure(template);
assert.ok(template.nodes.length<=12);
assert.ok(!template.nodes.some(n=>n.subgraph));
for(const y of [-0.4,0,0.8,1.4]){
  state.handles.p1.y=y;
  const graph=generateNodeGraphModel();
  assert.equal(graph,template);assert.equal(structure(graph),baseline);
  const snippets=generateCodeSnippets();assert.ok(!snippets.hlsl.includes('for ('));
  const evaluate=new Function('t',snippets.compact.replace(/^(?:\/\/|#).*$/gm,'').replace(/\bfloat /g,'let ')+';return y;');
  for(let i=0;i<=100;i++){near(graphValue(graph,i/100),evaluateGraph(i/100));near(evaluate(i/100),evaluateGraph(i/100));}
}
// Runtime parameters remain opt-in; tuned exponents still retain exact semantics.
state.mode='expression';state.customExpr=heartbeat.expr;state.parameterizedExpr=heartbeatDefs.parameterizedExpr;state.customParams=heartbeatParams;
state.exposeShaderParams=true;
assert.ok(generateCodeSnippets().hlsl.includes('float param1'));
state.exposeShaderParams=false;
const fast=generateCodeSnippets().hlsl;
assert.ok(!fast.includes('float param1'));
assert.ok(!fast.includes('pow('));
console.log('PASS: 48 loop-free presets × 101 samples, source/preview/graph/export parity, strict syntax, tuned parameters and stable polynomial editor.');

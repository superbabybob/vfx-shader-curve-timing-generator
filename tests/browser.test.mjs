import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url);
const server=createServer(async(req,res)=>{
  try {
    const url=new URL('.'+decodeURIComponent(req.url.split('?')[0]),root);
    if(!url.href.startsWith(root.href))throw new Error('Invalid path');
    const path=fileURLToPath(url.pathname.endsWith('/')?new URL('index.html',url):url);
    res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html');
    res.end(await readFile(path));
  }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:process.env.PW_CHANNEL || (process.platform==='win32'?'msedge':undefined),headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForSelector('#preset-card-smoothstep');
 assert.equal(await page.locator('.vfx-preset').count(),48);
 const snapshot=()=>page.evaluate(async()=>structuredClone((await import('/src/js/state.js')).state));
 await page.locator('#tab-node-graph').click();
 const checkGraphLayout=async()=>{
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   const problems=await page.evaluate(()=>{
     const problems=[];
     const svg=document.querySelector('#nodeGraphSvg'), viewport=svg.getBoundingClientRect();
     const nodes=[...svg.querySelectorAll('[data-node-id]')];
     for(const node of nodes){
       const rect=node.querySelector('rect').getBBox();
       const screen=node.querySelector('rect').getBoundingClientRect();
       if(screen.left<viewport.left || screen.right>viewport.right || screen.top<viewport.top || screen.bottom>viewport.bottom)problems.push(node.dataset.nodeId+': cropped');
       const boxes=[...node.querySelectorAll('text')].map(label=>label.getBBox());
       for(const box of boxes)if(box.x<0 || box.x+box.width>rect.width+0.1 || box.y<0 || box.y+box.height>rect.height+0.1)problems.push(node.dataset.nodeId+': text overflow');
       for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
         const a=boxes[i],b=boxes[j];
         if(a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y)problems.push(node.dataset.nodeId+': overlapping text');
       }
     }
     return problems;
   });
   assert.deepEqual(problems,[]);
 };
 const presetIds=await page.evaluate(async()=> (await import('/src/js/presets.js')).presets.map(p=>p.id));
 for(const id of presetIds){
   await page.locator(`#preset-card-${id}`).click();
   const presetState=await snapshot();
   assert.equal(presetState.mode,'expression');
   assert.equal(presetState.exposeShaderParams,false);
   const code=await page.evaluate(async()=> (await import('/src/js/code-gen.js')).generateCodeSnippets().hlsl);
   await checkGraphLayout();
   assert.ok(!/for\s*\(|while\s*\(|VFXBezier|VFXPow|\bpow\(/.test(code),id);
 }
 await page.locator('#preset-search').fill('delayed');
 assert.equal(await page.locator('.vfx-preset').count(),2);
 assert.equal(await page.locator('#preset-count').textContent(),'2');
 await page.locator('#category-pills').getByRole('button',{name:/เอกซ์โพเนนเชียล/}).click();
 assert.equal(await page.locator('.vfx-preset').count(),1);
 assert.ok(await page.locator('#preset-card-delayed-impact-envelope').isVisible());
 await page.locator('#preset-search').fill('');
 const exponentialCount=await page.evaluate(async()=> (await import('/src/js/presets.js')).presets.filter(p=>p.cat==='exp').length);
 assert.equal(await page.locator('.vfx-preset').count(),exponentialCount);
 await page.locator('#category-pills').getByRole('button',{name:'ทั้งหมด (All)',exact:true}).click();
 assert.equal(await page.locator('.vfx-preset').count(),48);
 if(process.env.PRESET_SCREENSHOT){
   await page.locator('#preset-search').fill('pulse');
   await page.locator('#preset-grid').screenshot({path:process.env.PRESET_SCREENSHOT});
   await page.locator('#preset-search').fill('');
 }
 await page.locator('#preset-card-ease-out-cubic').click();
 const cubicPreview=await page.evaluate(async()=>{
   const graph=(await import('/src/js/node-graph-model.js')).generateNodeGraphModel();
   return {ops:graph.nodes.filter(n=>n.type==='math').map(n=>n.op),params:graph.nodes.filter(n=>n.id.startsWith('param_')).length};
 });
 assert.deepEqual(cubicPreview,{ops:['-','pow','-'],params:3});
 await checkGraphLayout();
 if(process.env.POWER_SCREENSHOT)await page.locator('#nodeGraphSvg').screenshot({path:process.env.POWER_SCREENSHOT});
 await page.locator('#preset-card-smoothstep').click();
 assert.equal(await page.locator('#nodeGraphSvg [data-node-id="param_param1"]').count(),1);
 assert.equal(await page.locator('#nodeGraphSvg [data-node-id="param_param2"]').count(),1);
 assert.ok((await page.locator('#nodeGraphSvg').textContent()).includes('Edge1 (param1)'));
 assert.ok((await page.locator('#nodeGraphSvg').textContent()).includes('Edge2 (param2)'));
 await page.evaluate(()=>{window.parameterGraphRoot=document.querySelector('#nodeGraphSvg > g');});
 await page.locator('#slider-param-param1').fill('0.2');
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 assert.ok((await page.locator('#nodeGraphSvg [data-node-id="param_param1"]').textContent()).includes('0.2'));
 assert.ok(await page.evaluate(()=>window.parameterGraphRoot===document.querySelector('#nodeGraphSvg > g')));
 await checkGraphLayout();
 await page.locator('#preset-card-smoothstep').click();
 for(const count of [8,16,12]){await page.locator(`#p-count-${count}`).click();assert.equal((await snapshot()).particles.length,count);}
 await page.locator('#stagger-slider').fill('0.3');
 assert.equal((await snapshot()).particles.at(-1).staggerPhase,3.3);
 await page.locator('#mode-expr-btn').click();
 await page.locator('#custom-formula-input').fill('1.02573529411765 - exp(-2.97794117647059 * t) * cos(t * 37.68)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.equal(await page.locator('#custom-formula-input').inputValue(),'1.03 - exp(-2.98 * t) * cos(t * 37.68)');
 assert.equal((await snapshot()).customParams.param1,1.03);
 assert.equal((await snapshot()).customParams.param2,2.98);
 await page.locator('#slider-param-param1').evaluate(input=>{input.value='1.257352941';input.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal((await snapshot()).customParams.param1,1.26);
 assert.ok((await page.locator('#custom-formula-input').inputValue()).startsWith('1.26 -'));
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 assert.ok((await page.locator('#nodeGraphSvg [data-node-id="param_param1"]').textContent()).includes('1.26'));
 await page.locator('#custom-formula-input').fill('pow(t, 2.7)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 await page.locator('#multiply-integer-powers').check();
 assert.equal((await snapshot()).customParams.param1,3);
 assert.equal(await page.locator('#custom-formula-input').inputValue(),'pow(t, 3)');
 assert.equal(await page.locator('#slider-param-param1').getAttribute('step'),'1');
 const powerMode=await page.evaluate(async()=>{
   const {generateNodeGraphModel}=await import('/src/js/node-graph-model.js');
   const {evaluateGraph}=await import('/src/js/math-engine.js');
   return {ops:generateNodeGraphModel().nodes.filter(n=>n.type==='math').map(n=>n.op),y:evaluateGraph(0.5)};
 });
 assert.deepEqual(powerMode,{ops:['*','*'],y:0.125});
 await page.locator('#slider-param-param1').fill('6');
 assert.equal(await page.locator('#custom-formula-input').inputValue(),'pow(t, 6)');
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 await checkGraphLayout();
 await page.locator('#expose-shader-params').check();
 const multipliedCode=await page.evaluate(async()=> (await import('/src/js/code-gen.js')).generateCodeSnippets().hlsl);
 assert.ok(!/pow\(|VFXPow|float param1/.test(multipliedCode));
 await page.locator('#custom-formula-input').fill('pow(t, 2.7) + amplitude*t');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.ok((await page.locator('#custom-formula-input').inputValue()).includes('pow(t, 3)'));
 await page.locator('#custom-formula-input').fill('pow(t, 6)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 await page.locator('#expose-shader-params').uncheck();
 await page.locator('#multiply-integer-powers').uncheck();
 assert.equal(await page.locator('#slider-param-param1').getAttribute('step'),'0.01');
 assert.ok(await page.evaluate(async()=> (await import('/src/js/node-graph-model.js')).generateNodeGraphModel().nodes.some(n=>n.op==='pow')));
 await page.locator('#custom-formula-input').fill('sin(PI * t) + cos(TAU * t)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.deepEqual((await snapshot()).customParams,{});
 assert.equal(await page.locator('#nodeGraphSvg [data-node-id="constant_PI"]').count(),1);
 assert.equal(await page.locator('#nodeGraphSvg [data-node-id="constant_TAU"]').count(),1);
 await checkGraphLayout();
 if(process.env.CONSTANT_SCREENSHOT)await page.locator('#nodeGraphSvg').screenshot({path:process.env.CONSTANT_SCREENSHOT});
 await page.locator('#expose-shader-params').check();
 const constantsCode=await page.evaluate(async()=> (await import('/src/js/code-gen.js')).generateCodeSnippets().hlsl);
 assert.ok(constantsCode.includes('#ifndef PI') && constantsCode.includes('TWO_PI'));
 assert.ok(!constantsCode.includes('float PI') && !constantsCode.includes('float TAU'));
 await page.locator('#expose-shader-params').uncheck();
 await page.locator('#custom-formula-input').fill('sin(3.14159 * t)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.equal(await page.locator('#custom-formula-input').inputValue(),'sin(PI * t)');
 assert.deepEqual((await snapshot()).customParams,{});
 await page.locator('#custom-formula-input').fill('pow(t, exp)');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.equal(await page.locator('#slider-param-exp').count(),1);
 await page.locator('#custom-formula-input').fill('sin(t');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.ok(await page.locator('#formula-error').isVisible());
 assert.equal((await snapshot()).customExpr,'pow(t, exp)');
 await page.locator('#preset-card-elastic-bounce').click();
 await page.getByRole('button',{name:'Plot Curve'}).click();
 assert.ok(await page.locator('#mode-bezier-btn').isHidden());
 await page.locator('#slider-param-param2').fill('4.2');
 assert.equal((await snapshot()).customParams.param2,4.2);
 assert.ok((await page.locator('#custom-formula-input').inputValue()).includes('exp(-4.2 * t)'));
 await page.locator('#preset-card-heartbeat-double-pulse').click();
 await page.locator('#slider-param-param3').fill('0.73');
 await page.locator('#slider-param-param1').fill('1.75');
 await page.locator('#slider-param-param2').fill('3.5');
 assert.equal(await page.locator('#slider-param-param1').getAttribute('step'),'0.01');
 const tunedFormula=await page.locator('#custom-formula-input').inputValue();
 assert.equal(tunedFormula,'pow(saturate(sin(t * TAU * 1.75)), 3.5) + 0.73 * pow(saturate(sin((t - 0.15) * TAU * 1)), 8)');
 const tunedBeforePlot=await page.evaluate(async()=> (await import('/src/js/math-engine.js')).evaluateGraph(0.2));
 await page.getByRole('button',{name:'Plot Curve'}).click();
 const tunedAfterPlot=await page.evaluate(async()=> (await import('/src/js/math-engine.js')).evaluateGraph(0.2));
 assert.ok(Math.abs(tunedBeforePlot-tunedAfterPlot)<1e-12);
 await page.locator('#preset-card-sine-wave-cycle').click();
 assert.equal((await snapshot()).customParams.param1,1);
 await page.locator('#scrubber').fill('0.5');
 assert.equal((await snapshot()).isPlaying,false);
 for(const mode of ['burst','linear1d','slash','orbit','float','core']){
   await page.locator(`#mode-${mode}-btn`).click();await page.waitForTimeout(50);
   assert.equal((await snapshot()).vfxMode,mode);
 }
 for(const tab of ['hlsl','glsl','compact','unity','css','node-graph']){
   await page.locator(`#tab-${tab}`).click();assert.equal((await snapshot()).activeTab,tab);
 }
 await page.locator('#preset-card-linear').click();
 assert.equal((await snapshot()).mode,'expression');
 await page.locator('#mode-bezier-btn').click();
 assert.equal((await snapshot()).mode,'bezier');
 assert.ok(await page.locator('#mode-bezier-btn').isVisible());
 // Reach an offscreen handle, then edit it without changing navigation into curve data.
 const curve=page.locator('#curveCanvas');
 await curve.scrollIntoViewIfNeeded();
 await page.locator('#p1y').fill('4');await page.locator('#p1y').dispatchEvent('change');
 const readCurveView=()=>page.evaluate(async()=>({... (await import('/src/js/math-engine.js')).view}));
 const curvePoint=key=>page.evaluate(async key=>{
   const canvas=document.querySelector('#curveCanvas'),r=canvas.getBoundingClientRect();
   const {toScreen}=await import('/src/js/math-engine.js');
   const {state}=await import('/src/js/state.js');
   const p=toScreen(canvas,state.handles[key].x,state.handles[key].y);
   return {x:r.left+p.x,y:r.top+p.y,inside:p.x>=0 && p.x<r.width && p.y>=0 && p.y<r.height};
 },key);
 assert.equal((await curvePoint('p1')).inside,false);
 await page.locator('#fit-curve-view').click();
 const handle=await curvePoint('p1');assert.ok(handle.inside);
 if(process.env.CURVE_SCREENSHOT)await curve.screenshot({path:process.env.CURVE_SCREENSHOT});
 const bounds=await curve.boundingBox(),viewBeforePan=await readCurveView();
 const dataBeforePan=JSON.stringify((await snapshot()).handles);
 await page.mouse.move(bounds.x+20,bounds.y+150);await page.mouse.down();
 await page.mouse.move(bounds.x+80,bounds.y+170);await page.mouse.up();
 assert.notDeepEqual(await readCurveView(),viewBeforePan);
 assert.equal(JSON.stringify((await snapshot()).handles),dataBeforePan);
 const h=await curvePoint('p1');
 await page.mouse.move(h.x,h.y);await page.mouse.down();await page.mouse.move(h.x,h.y+16);await page.mouse.up();
 assert.notEqual((await snapshot()).handles.p1.y,4);
 assert.equal((await snapshot()).handles.p1.x,1/3);
 const zoomBounds=await curve.boundingBox();
 const zoomClient={x:Math.round(zoomBounds.x+zoomBounds.width/2),y:Math.round(zoomBounds.y+zoomBounds.height/2)};
 const anchor={x:zoomClient.x-zoomBounds.x,y:zoomClient.y-zoomBounds.y};
 const worldBeforeZoom=await page.evaluate(async p=> (await import('/src/js/math-engine.js')).toWorld(document.querySelector('#curveCanvas'),p.x,p.y),anchor);
 const zoomBefore=await readCurveView();
 await curve.dispatchEvent('wheel',{deltaY:-100,clientX:zoomClient.x,clientY:zoomClient.y});
 const zoomAfter=await readCurveView();assert.ok(zoomAfter.maxX-zoomAfter.minX<zoomBefore.maxX-zoomBefore.minX);
 const worldAfterZoom=await page.evaluate(async p=> (await import('/src/js/math-engine.js')).toWorld(document.querySelector('#curveCanvas'),p.x,p.y),anchor);
 assert.ok(Math.abs(worldBeforeZoom.x-worldAfterZoom.x)<1e-10 && Math.abs(worldBeforeZoom.y-worldAfterZoom.y)<1e-10);
 const handlesBeforeReset=JSON.stringify((await snapshot()).handles);
 await page.locator('#reset-curve-view').click();
 assert.equal((await readCurveView()).minY,-0.4);
 assert.equal(JSON.stringify((await snapshot()).handles),handlesBeforeReset);
 await page.locator('#p1y').fill('0.333333');await page.locator('#p1y').dispatchEvent('change');
 const baselineBezier=await page.evaluate(async()=>{
   const g=(await import('/src/js/node-graph-model.js')).generateNodeGraphModel();
   window.bezierRoot=document.querySelector('#nodeGraphSvg > g');
   return JSON.stringify({nodes:g.nodes.map(n=>[n.id,n.x,n.y]),wires:g.wires});
 });
 await page.locator('#p1y').fill('0.2');await page.locator('#p1y').dispatchEvent('change');
 assert.equal((await snapshot()).handles.p1.x,1/3);
 assert.equal((await snapshot()).selectedPresetId,null);
 assert.equal(await page.locator('#p1x').getAttribute('readonly'),'');
 // Programmatic input cannot introduce an X solver either.
 await page.locator('#p1x').evaluate(input=>{input.value='0.2';input.dispatchEvent(new Event('change'));});
 assert.equal((await snapshot()).handles.p1.x,1/3);
 const editedBezier=await page.evaluate(async()=>{
   const g=(await import('/src/js/node-graph-model.js')).generateNodeGraphModel();
   return {structure:JSON.stringify({nodes:g.nodes.map(n=>[n.id,n.x,n.y]),wires:g.wires}),reusedDOM:window.bezierRoot===document.querySelector('#nodeGraphSvg > g')};
 });
 assert.equal(editedBezier.structure,baselineBezier);assert.ok(editedBezier.reusedDOM);
 assert.equal(await page.locator('#expand-bezier-solver').count(),0);
 await page.locator('#expose-shader-params').check();
 assert.equal((await snapshot()).exposeShaderParams,true);
 await page.locator('#expose-shader-params').uncheck();
 assert.equal((await snapshot()).exposeShaderParams,false);
 const beforeSwitch=await page.evaluate(async()=> (await import('/src/js/math-engine.js')).evaluateGraph(0.3));
 await page.locator('#mode-expr-btn').click();
 const afterSwitch=await page.evaluate(async()=> (await import('/src/js/math-engine.js')).evaluateGraph(0.3));
 assert.ok(Math.abs(beforeSwitch-afterSwitch)<1e-6);
 await page.locator('#tab-node-graph').click();
 const svg=page.locator('#nodeGraphSvg');
 await svg.dispatchEvent('wheel',{deltaY:-100,clientX:1000,clientY:700});
 assert.ok(await page.evaluate(async()=> (await import('/src/js/renderers/node-graph.js')).graphPan.scale>1));
 await page.locator('#node-graph-canvas').getByRole('button',{name:'Reset View'}).click();
 assert.equal(await page.evaluate(async()=> (await import('/src/js/renderers/node-graph.js')).graphPan.scale),1);
 // Compile every generated GLSL function in an actual WebGL2 shader compiler.
 const compileErrors=await page.evaluate(async()=>{
   const {presets}=await import('/src/js/presets.js');
   const {state}=await import('/src/js/state.js');
   const {generateCodeSnippets}=await import('/src/js/code-gen.js');
   const {extractExpressionParameters}=await import('/src/js/expression-graph-builder.js');
   const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');
   if(!gl)throw new Error('WebGL2 unavailable');
   const failures=[];
   for(const p of [...presets,{id:'all-functions',type:'expression',expr:'sqrt(t)+tan(t)+log(t+1)+sign(t)+ceil(t)+clamp(t,0,1)+sin(PI*t)'},{id:'custom-bezier',type:'expression',expr:'bezier(t,0,0,0.2,-0.3,0.8,1.4,1,1)'},{id:'named-exp',type:'expression',expr:'pow(t, exp)'},{id:'integer-power',type:'expression',expr:'pow(t-0.5,3)'},{id:'standard-constants',type:'expression',expr:'PI+TAU+PHI+E+SQRT2+HALF_PI+FOUR_PI+INV_PI+INV_TWO_PI+INV_FOUR_PI+INV_SQRT2+PI_DIV_FOUR+LOG2_E+sin(PI*t)'},{id:'engine-constants',type:'expression',expr:'sin(PI*t)+cos(TAU*t)'},{id:'precise-pi-literal',type:'expression',expr:'sin(3.14159*t)'}]){
     state.mode='expression';state.customExpr=p.expr;
     state.multiplyIntegerPowers=p.id==='integer-power';state.exposeShaderParams=p.id==='integer-power';
     if(p.type==='bezier')for(const k of ['p0','p1','p2','p3'])state.handles[k]={x:p[k][0],y:p[k][1]};
     const defs=extractExpressionParameters(p.expr);
     state.parameterizedExpr=defs.parameterizedExpr;state.customParams=Object.fromEntries(defs.map(d=>[d.name,d.defaultVal]));
     const shader=gl.createShader(gl.FRAGMENT_SHADER);
     const engineConstants=p.id==='engine-constants'?'#define UNITY_PI 3.141592653589793\n#define TWO_PI 6.283185307179586\n':'';
     gl.shaderSource(shader,'#version 300 es\nprecision highp float;\n'+engineConstants+generateCodeSnippets().glsl+'\nout vec4 color;\nvoid main(){color=vec4(1.0); }');
     gl.compileShader(shader);
     if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))failures.push(p.id+': '+gl.getShaderInfoLog(shader));
     gl.deleteShader(shader);
   }
   state.multiplyIntegerPowers=false;state.exposeShaderParams=false;
   return failures;
 });
 assert.deepEqual(compileErrors,[]);
 await page.locator('#custom-formula-input').fill('((0.6041666666666667*t - 3.62334558823529)*t + 3.62823529411765)*t + 0.01');
 await page.getByRole('button',{name:'Plot Curve'}).click();
 await page.locator('#node-graph-canvas').getByRole('button',{name:'Reset View'}).click();
 await checkGraphLayout();
 await page.getByRole('button',{name:'Expand node graph'}).click();
 await page.waitForFunction(()=>document.fullscreenElement?.id==='node-graph-canvas');
 await checkGraphLayout();
 await page.getByRole('button',{name:'Close expanded node graph'}).click();
 await page.waitForFunction(()=>!document.fullscreenElement);
 if(process.env.GRAPH_SCREENSHOT){
   await page.locator('#preset-card-smoothstep').click();
   await checkGraphLayout();
   await page.locator('#nodeGraphSvg').screenshot({path:process.env.GRAPH_SCREENSHOT});
 }
 await page.setViewportSize({width:390,height:844});
 await checkGraphLayout();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile controls, preset transitions, sliders, invalid formula safety, Stagger, pause/scrub, all motion/export tabs, 55 GLSL compilations.');
} finally {await browser.close();server.close();}


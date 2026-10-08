import {tmpdir} from 'node:os';
import {join} from 'node:path';
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
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForSelector('#slider-param-start');
 const snapshot=()=>page.evaluate(async()=>structuredClone((await import('/src/js/state.js')).state));
 await page.locator('#speed-slider').fill('0.37');
 assert.equal((await snapshot()).speed,.37);
 assert.equal(await page.locator('#speed-input').inputValue(),'0.37');
 assert.equal(await page.locator('#speed-label').textContent(),'0.37x');
 await page.locator('#speed-input').fill('2.13');
 await page.locator('#speed-input').press('Tab');
 assert.equal((await snapshot()).speed,2.13);
 assert.equal(await page.locator('#speed-slider').inputValue(),'2.13');
 await page.getByRole('button',{name:'Reset playback speed',exact:true}).click();
 assert.equal((await snapshot()).speed,1);
 assert.equal(await page.locator('#compare-preset').count(),0);
 await page.locator('#preset-card-ease-in-quad').click();
 await page.locator('#slider-param-power').fill('3.25');
 await page.locator('#compare-add').click();
 assert.equal((await snapshot()).vfxMode,'vertical1d');
 await page.locator('#slider-param-power').fill('3.75');
 await page.locator('#compare-add').click();
 let state=await snapshot();
 assert.equal(state.comparisonGraphs[0].customParams.power,3.25);
 assert.equal(state.comparisonGraphs[1].customParams.power,3.75);
 assert.notEqual(state.comparisonGraphs[0].id,state.comparisonGraphs[1].id);
 await page.locator('.vfx-track-edit').nth(0).click();
 assert.equal((await snapshot()).customParams.power,3.25);
 await page.locator('#slider-param-power').fill('2.5');
 await page.locator('.vfx-track-edit').nth(1).click();
 assert.equal((await snapshot()).customParams.power,3.75);
 state=await snapshot();
 assert.equal(state.comparisonGraphs[0].customParams.power,2.5);
 assert.equal(state.comparisonGraphs[1].customParams.power,3.75);
 for(const id of ['smoothstep','ease-out-cubic','linear']) {
   await page.locator('#preset-card-'+id).click();
   await page.locator('#compare-add').click();
 }
 assert.equal(await page.locator('.vfx-track-frame').count(),5);
 assert.ok(await page.locator('#compare-add').isDisabled());
 await page.locator('#scrubber').fill('0.5');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:join(tmpdir(),'vfx-frame-comparison.png'),fullPage:true});
 const compared=await page.evaluate(async()=>{
   const {comparisonValue}=await import('/src/js/timing-comparison.js');
   const {state}=await import('/src/js/state.js');
   return state.comparisonGraphs.slice(0,2).map(g=>comparisonValue(g,.5));
 });
 assert.ok(Math.abs(compared[0]-Math.pow(.5,2.5))<1e-9);
 assert.ok(Math.abs(compared[1]-Math.pow(.5,3.75))<1e-9);
 await page.locator('.vfx-track-remove').nth(1).click();
 state=await snapshot();
 assert.equal(state.comparisonGraphs.length,4);
 assert.equal(state.editingComparisonId,null);
 assert.equal(await page.locator('.vfx-track-frame').count(),4);
 assert.ok(await page.locator('#compare-add').isEnabled());
 await page.locator('#mode-linear1d-btn').click();
 assert.ok(await page.locator('#compare-frames').evaluate(e=>e.classList.contains('is-horizontal')));
 await page.locator('.vfx-track-edit').nth(0).focus();
 await page.keyboard.press('Enter');
 assert.equal((await snapshot()).customParams.power,2.5);
 // A custom formula is captured and restored with its latest parameter values too.
 await page.evaluate(()=>{document.querySelector('#custom-formula-input').value='pow(t, 3)'; window.applyCustomFormula();});
 await page.locator('#compare-add').click();
 await page.locator('.vfx-track-edit').last().click();
 assert.equal((await snapshot()).customExpr,'pow(t, 3)');
 const rangeChecks = await page.evaluate(async()=>{
   const {state} = await import('/src/js/state.js');
   const {trackRange} = await import('/src/js/timing-comparison.js');
   const graph = expr => ({mode:'expression', customExpr:expr, parameterizedExpr:expr, customParams:{}, multiplyIntegerPowers:false});
   const baseline = trackRange([graph('t')]);
   const expanded = trackRange([graph('2*t'), graph('-t')]);
   const atStart = trackRange([graph('2*t'), graph('-t')], [0,0]);
   const atEnd = trackRange([graph('2*t'), graph('-t')], [2,-1]);
   state.comparisonGraphs = [graph('2*t'), graph('-t')];
   state.currentTime = .75;
   const {renderParticleSimulation} = await import('/src/js/renderers/particle-sim.js');
   const canvas = document.querySelector('#particleCanvas'), ctx = canvas.getContext('2d');
   const arc = ctx.arc, circles = [];
   ctx.arc = function(x,y,r,...args) { circles.push({x,y,r}); return arc.call(this,x,y,r,...args); };
   window.setVfxMotionMode('vertical1d');
   renderParticleSimulation(canvas,ctx);
   ctx.arc = arc;
   return {baseline, expanded, atStart, atEnd, circles, w:canvas.parentElement.clientWidth, h:canvas.parentElement.clientHeight};
 });
 assert.equal(rangeChecks.baseline.min,0);
 assert.equal(rangeChecks.baseline.max,1);
 assert.ok(rangeChecks.expanded.min <= -1 && rangeChecks.expanded.max >= 2);
 assert.deepEqual(rangeChecks.atStart,rangeChecks.atEnd);
 assert.ok(rangeChecks.circles.length > 0);
 for (const {x,y,r} of rangeChecks.circles) {
   assert.ok(x-r>=0 && x+r<=rangeChecks.w && y-r>=0 && y+r<=rangeChecks.h);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: add current graph, independent copies of one preset, frame editing, latest parameters, five-graph limit, remove without editing, horizontal tracks, keyboard selection, and custom graphs.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }


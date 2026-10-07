import {state} from './state.js';
import {view,toScreen,toWorld,evaluateGraph} from './math-engine.js';

const initialView={minX:-0.1,maxX:1.1,minY:-0.4,maxY:1.6};
export function resetCurveView(){Object.assign(view,initialView);}
export function fitCurveView(){
  const points=[{x:0,y:0},{x:1,y:1}];
  for(let i=0;i<=120;i++)points.push({x:i/120,y:evaluateGraph(i/120)});
  if(state.mode==='bezier')points.push(...Object.values(state.handles));
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const dx=Math.max(x1-x0,0.2)*0.15,dy=Math.max(y1-y0,0.2)*0.15;
  Object.assign(view,{minX:x0-dx,maxX:x1+dx,minY:y0-dy,maxY:y1+dy});
}
export function setupCurveNavigation(canvas,{render,onHandleChange,onHandleEnd=()=>{}}){
  let drag=null;
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{
    if(drag || (e.pointerType==='mouse' && ![0,1].includes(e.button)))return;
    const p=point(e);
    let handle=null;
    if(e.button===0 && state.mode==='bezier')handle=['p1','p2','p0','p3'].find(key=>{
      const s=toScreen(canvas,state.handles[key].x,state.handles[key].y);
      return Math.hypot(p.x-s.x,p.y-s.y)<=24;
    });
    const world=toWorld(canvas,p.x,p.y);
    drag={id:e.pointerId,handle,world};state.activeDrag=handle || null;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor=handle?'ns-resize':'grabbing';e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.id)return;
    const p=point(e),world=toWorld(canvas,p.x,p.y);
    if(drag.handle){
      state.handles[drag.handle].y=Math.round(world.y*100)/100;
      onHandleChange();
    }else{
      const dx=drag.world.x-world.x,dy=drag.world.y-world.y;
      view.minX+=dx;view.maxX+=dx;view.minY+=dy;view.maxY+=dy;
      render();
    }
    e.preventDefault();
  });
  const end=e=>{
    if(!drag || e.pointerId!==drag.id)return;
    const wasHandle=drag.handle;drag=null;state.activeDrag=null;canvas.style.cursor='crosshair';
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(wasHandle)onHandleEnd();
  };
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();if(drag)return;
    const p=point(e),anchor=toWorld(canvas,p.x,p.y);
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
    const factor=Math.exp(Math.max(-0.3,Math.min(0.3,delta*0.0015)));
    if((view.maxX-view.minX)*factor<0.02 || (view.maxX-view.minX)*factor>10000 || (view.maxY-view.minY)*factor<0.02 || (view.maxY-view.minY)*factor>10000)return;
    for(const key of ['minX','maxX'])view[key]=anchor.x+(view[key]-anchor.x)*factor;
    for(const key of ['minY','maxY'])view[key]=anchor.y+(view[key]-anchor.y)*factor;
    render();
  },{passive:false});
  document.getElementById('reset-curve-view').addEventListener('click',()=>{resetCurveView();render();});
  document.getElementById('fit-curve-view').addEventListener('click',()=>{fitCurveView();render();});
}

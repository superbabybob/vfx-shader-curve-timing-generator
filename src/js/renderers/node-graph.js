/**
 * ═══════════════════════════════════════════════════════
 * Node Graph Renderer — Interactive SVG node visualization
 * Pan & zoom, procedural node layout
 * ═══════════════════════════════════════════════════════
 */

import { state } from '../state.js';
import { formatGraphLabel, graphNodeTitle } from '../graph-display.js';
import { generateNodeGraphModel } from '../node-graph-model.js';

export const graphPan = {
  x: 0, y: 0, scale: 1.0,
  isDragging: false, startX: 0, startY: 0
};

export function resetNodeGraphView() {
  graphPan.x = 0;
  graphPan.y = 0;
  graphPan.scale = 1.0;
  renderNodeGraph();
}

function svgPoint(svg, x, y) {
  const pt = svg.createSVGPoint(); pt.x=x; pt.y=y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
let draggedNode = null;
const wireUpdates = [];
function startNodeDrag(target, svg, x, y) {
  const element = target.closest?.('[data-node-id]');
  const node = renderedModel?.nodes.find(n => n.id === element?.dataset.nodeId);
  if (!node) return false;
  const point = svgPoint(svg, x, y);
  draggedNode = {node, element, model: renderedModel, x: point.x, y: point.y, startX: node.x, startY: node.y};
  element.parentNode.appendChild(element);
  element.style.cursor = 'grabbing';
  return true;
}
function moveNode(svg, x, y) {
  if (!draggedNode) return false;
  if (draggedNode.model !== renderedModel) { endNodeDrag(); return false; }
  const point = svgPoint(svg, x, y);
  const {node, element} = draggedNode;
  node.x = draggedNode.startX + (point.x - draggedNode.x) / graphPan.scale;
  node.y = draggedNode.startY + (point.y - draggedNode.y) / graphPan.scale;
  element.setAttribute('transform', `translate(${node.x}, ${node.y})`);
  wireUpdates.forEach(update => update());
  return true;
}
function endNodeDrag() {
  if (draggedNode) draggedNode.element.style.cursor = 'grab';
  draggedNode = null;
}
export function setupNodeGraphInteractions(nodeGraphSvg) {
  if (!nodeGraphSvg) return;
  const canvas=document.getElementById('node-graph-canvas');
  const expand=document.getElementById('expand-node-graph');
  if(canvas && expand){
    expand.addEventListener('click',async()=>{
      if(document.fullscreenElement===canvas)await document.exitFullscreen();
      else await canvas.requestFullscreen();
    });
    document.addEventListener('fullscreenchange',()=>{
      const expanded=document.fullscreenElement===canvas;
      expand.textContent=expanded?'Close View':'Expand View';
      expand.setAttribute('aria-label',expanded?'Close expanded node graph':'Expand node graph');
    });
  }

  nodeGraphSvg.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (startNodeDrag(e.target, nodeGraphSvg, e.clientX, e.clientY)) return;
    graphPan.isDragging = true;
    const pt=svgPoint(nodeGraphSvg,e.clientX,e.clientY);
    graphPan.startX = pt.x - graphPan.x;
    graphPan.startY = pt.y - graphPan.y;
  });

  window.addEventListener('mousemove', (e) => {
    if (moveNode(nodeGraphSvg, e.clientX, e.clientY)) return;
    if (!graphPan.isDragging) return;
    const pt=svgPoint(nodeGraphSvg,e.clientX,e.clientY);
    graphPan.x = pt.x - graphPan.startX;
    graphPan.y = pt.y - graphPan.startY;
    renderNodeGraph();
  });

  window.addEventListener('mouseup', () => { graphPan.isDragging = false; endNodeDrag(); });

  window.addEventListener('blur', () => { graphPan.isDragging = false; endNodeDrag(); });

  nodeGraphSvg.addEventListener('wheel', (e) => {
    if (draggedNode) { e.preventDefault(); return; }
    e.preventDefault();
    const pt=svgPoint(nodeGraphSvg,e.clientX,e.clientY);
    const oldScale=graphPan.scale;
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      graphPan.scale = Math.min(graphPan.scale * zoomFactor, 2.5);
    } else {
      graphPan.scale = Math.max(graphPan.scale / zoomFactor, 0.4);
    }
    graphPan.x = pt.x-(pt.x-graphPan.x)*graphPan.scale/oldScale;
    graphPan.y = pt.y-(pt.y-graphPan.y)*graphPan.scale/oldScale;
    renderNodeGraph();
  }, { passive: false });

  let lastTouchDist = 0;
  nodeGraphSvg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      if (startNodeDrag(e.target, nodeGraphSvg, e.touches[0].clientX, e.touches[0].clientY)) return;
      graphPan.isDragging = true;
      const pt=svgPoint(nodeGraphSvg,e.touches[0].clientX,e.touches[0].clientY);
      graphPan.startX = pt.x - graphPan.x;
      graphPan.startY = pt.y - graphPan.y;
    } else if (e.touches.length === 2) {
      endNodeDrag();
      graphPan.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }, { passive: false });

  nodeGraphSvg.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && moveNode(nodeGraphSvg, e.touches[0].clientX, e.touches[0].clientY)) return;
    if (graphPan.isDragging && e.touches.length === 1) {
      const pt=svgPoint(nodeGraphSvg,e.touches[0].clientX,e.touches[0].clientY);
      graphPan.x = pt.x - graphPan.startX;
      graphPan.y = pt.y - graphPan.startY;
      renderNodeGraph();
    } else if (e.touches.length === 2) {
      endNodeDrag();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist > 0) {
        const factor = dist / lastTouchDist;
        const pt=svgPoint(nodeGraphSvg,(e.touches[0].clientX+e.touches[1].clientX)/2,(e.touches[0].clientY+e.touches[1].clientY)/2);
        const oldScale=graphPan.scale;
        graphPan.scale = Math.max(0.4, Math.min(2.5, graphPan.scale * factor));
        graphPan.x=pt.x-(pt.x-graphPan.x)*graphPan.scale/oldScale;
        graphPan.y=pt.y-(pt.y-graphPan.y)*graphPan.scale/oldScale;
        renderNodeGraph();
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  nodeGraphSvg.addEventListener('touchend', (e) => {
    endNodeDrag();
    graphPan.isDragging = e.touches.length === 1;
    if(graphPan.isDragging){const pt=svgPoint(nodeGraphSvg,e.touches[0].clientX,e.touches[0].clientY);graphPan.startX=pt.x-graphPan.x;graphPan.startY=pt.y-graphPan.y;}
    lastTouchDist = 0;
  });
  nodeGraphSvg.addEventListener('touchcancel',()=>{graphPan.isDragging=false;lastTouchDist=0;endNodeDrag();});
}

let _nodeGraphSvg = null;
let displayedPreset=null;
let renderedModel=null, renderedRoot=null, renderedRevision=-1;
const nodeLabels=new Map();
const inputLabel=(node,index)=>formatGraphLabel(node.portLabels?.[index] || (node.portValues?.[index] == null ? node.inPorts[index] : `${node.inPorts[index]} (${node.portValues[index]})`));
const inputY=(node,index)=>40+index*24;
const outputY=node=>node.h-18;
function updateLabel(element,text){
  element.textContent=text;
  element.querySelector('title')?.remove();
  const full=element.dataset.fullText || text;
  const maxWidth=Number(element.dataset.maxWidth);
  if(maxWidth && element.isConnected){
    while(element.getComputedTextLength()>maxWidth && element.textContent.length>2)element.textContent=element.textContent.slice(0,-2)+'…';
  }
  const tooltip=document.createElementNS('http://www.w3.org/2000/svg','title');tooltip.textContent=full;element.appendChild(tooltip);
}
function updateGraphTransform(){renderedRoot?.setAttribute('transform',`translate(${graphPan.x}, ${graphPan.y}) scale(${graphPan.scale})`);}
let _nodeEngineBadge = null;

export function initNodeGraphDOM(svg, badge) {
  _nodeGraphSvg = svg;
  _nodeEngineBadge = badge;
}

export function renderNodeGraph() {
  if (!_nodeGraphSvg) return;
  const model = generateNodeGraphModel();
  if(model===renderedModel && renderedRoot){
    if(renderedRevision !== model.revision){
      model.nodes.forEach(node=>{
        const labels=nodeLabels.get(node.id);
        if(!labels)return;
        labels.title.dataset.fullText=node.title;updateLabel(labels.title,graphNodeTitle(node));
        if(labels.output){labels.output.dataset.fullText=node.outPort;updateLabel(labels.output,formatGraphLabel(node.outPort));}
        labels.inputs.forEach((label,i)=>{label.dataset.fullText=node.portValues?.[i] == null ? node.inPorts[i] : `${node.inPorts[i]} (${node.portValues[i]})`;updateLabel(label,inputLabel(node,i));});
      });
      renderedRevision=model.revision;
    }
    updateGraphTransform();return;
  }
  const presetId=state.selectedPresetId;
  if(presetId && presetId!==displayedPreset){graphPan.x=0;graphPan.y=0;graphPan.scale=1;displayedPreset=presetId;}
  renderedRevision=model.revision;
  endNodeDrag();
  wireUpdates.length = 0;
  nodeLabels.clear();
  renderedModel=model;
  const style = getComputedStyle(document.documentElement);
  const colorAction = style.getPropertyValue('--vfx-action').trim() || '#4C9AFF';
  const colorBorder = style.getPropertyValue('--vfx-border').trim() || '#39404F';
  const colorCard = style.getPropertyValue('--vfx-card').trim() || '#2F3442';
  const colorInset = style.getPropertyValue('--vfx-inset').trim() || '#111317';
  const colorMuted = style.getPropertyValue('--vfx-muted').trim() || '#979EAC';

  if (_nodeEngineBadge) {
    _nodeEngineBadge.textContent = 'Universal Math Graph';
    _nodeEngineBadge.style.color = colorAction;
    _nodeEngineBadge.style.fontWeight = '700';
  }

  const minY=Math.min(...model.nodes.map(n=>n.y))-30;
  const maxY=Math.max(...model.nodes.map(n=>n.y+n.h))+30;
  const maxX=Math.max(...model.nodes.map(n=>n.x+n.w))+30;
  _nodeGraphSvg.setAttribute('viewBox',`-24 ${minY-20} ${maxX+64} ${maxY-minY+100}`);
  _nodeGraphSvg.style.touchAction = 'none';
  _nodeGraphSvg.setAttribute('preserveAspectRatio','xMidYMid meet');
  // SVG Canvas Render
  _nodeGraphSvg.innerHTML = '';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    <linearGradient id="math-header" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colorAction}"/>
      <stop offset="100%" stop-color="${colorAction}cc"/>
    </linearGradient>
    <linearGradient id="io-header" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colorBorder}"/>
      <stop offset="100%" stop-color="${colorCard}"/>
    </linearGradient>
  `;
  _nodeGraphSvg.appendChild(defs);

  const rootG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  renderedRoot=rootG;
  rootG.setAttribute('transform', `translate(${graphPan.x}, ${graphPan.y}) scale(${graphPan.scale})`);

  // Render Wires
  const wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  model.wires.forEach(w => {
    const fromNode = model.nodes.find(n => n.id === w.from);
    const toNode = model.nodes.find(n => n.id === w.to);
    if (!fromNode || !toNode) return;

    const x1 = fromNode.x + fromNode.w;
    const y1 = fromNode.y + outputY(fromNode);
    let x2 = toNode.x;
    let y2 = toNode.y + inputY(toNode,0);

    if (toNode.inPorts) {
      const portIndex = toNode.inPorts.indexOf(w.toPort);
      if (portIndex >= 0) {
        y2 = toNode.y + inputY(toNode,portIndex);
      }
    }

    const dx = Math.max(35, Math.abs(x2 - x1) * 0.45);
    const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

    // Glow
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glow.setAttribute('d', pathData);
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorAction + '33');
    glow.setAttribute('stroke-width', '6');
    wireGroup.appendChild(glow);

    // Core wire
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colorAction);
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    wireGroup.appendChild(path);
    wireUpdates.push(() => {
      const x1 = fromNode.x + fromNode.w, y1 = fromNode.y + outputY(fromNode);
      const x2 = toNode.x, y2 = toNode.y + inputY(toNode, Math.max(0, toNode.inPorts?.indexOf(w.toPort) ?? 0));
      const dx = Math.max(35, Math.abs(x2 - x1) * 0.45);
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      glow.setAttribute('d', d);
      path.setAttribute('d', d);
    });
  });
  rootG.appendChild(wireGroup);

  // Render Nodes
  const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  model.nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
    g.dataset.nodeId=n.id;
    g.style.cursor = 'grab';
    g.style.userSelect = 'none';
    g.setAttribute('filter', 'url(#node-shadow)');

    const isMath = n.type === 'math' || n.type === 'group';
    const headerGrad = isMath ? 'url(#math-header)' : 'url(#io-header)';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', n.w);
    rect.setAttribute('height', n.h);
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', colorInset);
    rect.setAttribute('stroke', n.type === 'constant' ? '#E5B567' : colorBorder);
    rect.setAttribute('stroke-width', '1.5');
    g.appendChild(rect);

    const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    header.setAttribute('width', n.w);
    header.setAttribute('height', '28');
    header.setAttribute('rx', '6');
    header.setAttribute('fill', headerGrad);
    g.appendChild(header);

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '8');
    title.setAttribute('y', '19');
    title.setAttribute('fill', '#ffffff');
    title.setAttribute('font-size', '13');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Fira Code, monospace');
    title.dataset.fullText=n.title;title.dataset.maxWidth=String(n.w-16);title.textContent=graphNodeTitle(n);
    g.appendChild(title);
    const labels={title,inputs:[],output:null};nodeLabels.set(n.id,labels);
    if(n.type==='group'){const label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('x','8');label.setAttribute('y',String(n.h-8));label.setAttribute('fill',colorMuted);label.setAttribute('font-size','9');label.textContent='Native math subgraph';g.appendChild(label);}

    if (n.inPort) {
      const inPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inPin.setAttribute('cx', '0');
      inPin.setAttribute('cy', inputY(n,0));
      inPin.setAttribute('r', '4');
      inPin.setAttribute('fill', colorAction);
      inPin.setAttribute('stroke', colorInset);
      inPin.setAttribute('stroke-width', '1.5');
      g.appendChild(inPin);
      if(n.inPort!=='In'){
        const label=document.createElementNS('http://www.w3.org/2000/svg','text');
        label.setAttribute('x','8');label.setAttribute('y',String(inputY(n,0)+3));
        label.setAttribute('fill',colorMuted);label.setAttribute('font-size','12');
        label.dataset.fullText=n.inPort;label.dataset.maxWidth=String(n.w-24);label.textContent=formatGraphLabel(n.inPort);
        g.appendChild(label);
      }
    } else if (n.inPorts) {
      n.inPorts.forEach((p, idx) => {
        const py = inputY(n,idx);
        const inPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        inPin.setAttribute('cx', '0');
        inPin.setAttribute('cy', py);
        inPin.setAttribute('r', '3.5');
        inPin.setAttribute('fill', colorAction);
        inPin.setAttribute('stroke', colorInset);
        inPin.setAttribute('stroke-width', '1.5');
        g.appendChild(inPin);

        const pLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        pLabel.setAttribute('x', '8');
        pLabel.setAttribute('y', py + 3);
        pLabel.setAttribute('fill', colorMuted);
        pLabel.setAttribute('font-size', '12');
        pLabel.setAttribute('font-family', 'Fira Code, monospace');
        pLabel.dataset.fullText=n.portLabels?.[idx] || (n.portValues?.[idx] == null ? p : `${p} (${n.portValues[idx]})`);pLabel.dataset.maxWidth=String(n.w-24);pLabel.textContent = inputLabel(n,idx);
        labels.inputs.push(pLabel);
        g.appendChild(pLabel);
      });
    }

    (n.parameterNotes || []).forEach((note,i)=>{
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('x','8');label.setAttribute('y',String(43+(n.inPorts?.length || 1)*24+i*24));
      label.setAttribute('font-size','12');label.setAttribute('fill',colorAction);
      label.dataset.fullText=note;label.dataset.maxWidth=String(n.w-24);label.textContent=formatGraphLabel(note);
      g.appendChild(label);
      updateLabel(label,formatGraphLabel(note));
    });
    if (n.outPort) {
      const outPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outPin.setAttribute('cx', n.w);
      outPin.setAttribute('cy', outputY(n));
      outPin.setAttribute('r', '4');
      outPin.setAttribute('fill', colorAction);
      outPin.setAttribute('stroke', colorInset);
      outPin.setAttribute('stroke-width', '1.5');
      g.appendChild(outPin);

      const oLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      oLabel.setAttribute('x', n.w - 12);
      oLabel.setAttribute('text-anchor','end');
      oLabel.setAttribute('y', outputY(n)+4);
      oLabel.setAttribute('fill', colorMuted);
      oLabel.setAttribute('font-size', '12');
      oLabel.setAttribute('font-family', 'Fira Code, monospace');
      oLabel.dataset.fullText=n.outPort;oLabel.dataset.maxWidth=String(n.w-24);oLabel.textContent = formatGraphLabel(n.outPort);
      labels.output=oLabel;
      g.appendChild(oLabel);
    }

    nodeGroup.appendChild(g);
  });

  rootG.appendChild(nodeGroup);
  _nodeGraphSvg.appendChild(rootG);
  rootG.querySelectorAll('text[data-max-width]').forEach(label=>{updateLabel(label,label.childNodes[0]?.textContent || '');});
  nodeLabels.forEach(labels=>{
    [labels.title,...labels.inputs,labels.output].filter(Boolean).forEach(label=>updateLabel(label,label.childNodes[0]?.textContent || ''));
  });
}

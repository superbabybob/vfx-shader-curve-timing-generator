/**
 * ═══════════════════════════════════════════════════════
 * Node Graph Renderer — Interactive SVG node visualization
 * Pan & zoom, procedural node layout
 * ═══════════════════════════════════════════════════════
 */

import { state } from '../state.js';
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

export function setupNodeGraphInteractions(nodeGraphSvg) {
  if (!nodeGraphSvg) return;

  nodeGraphSvg.addEventListener('mousedown', (e) => {
    graphPan.isDragging = true;
    graphPan.startX = e.clientX - graphPan.x;
    graphPan.startY = e.clientY - graphPan.y;
  });

  window.addEventListener('mousemove', (e) => {
    if (!graphPan.isDragging) return;
    graphPan.x = e.clientX - graphPan.startX;
    graphPan.y = e.clientY - graphPan.startY;
    renderNodeGraph();
  });

  window.addEventListener('mouseup', () => { graphPan.isDragging = false; });

  nodeGraphSvg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      graphPan.scale = Math.min(graphPan.scale * zoomFactor, 2.5);
    } else {
      graphPan.scale = Math.max(graphPan.scale / zoomFactor, 0.4);
    }
    renderNodeGraph();
  }, { passive: false });

  let lastTouchDist = 0;
  nodeGraphSvg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      graphPan.isDragging = true;
      graphPan.startX = e.touches[0].clientX - graphPan.x;
      graphPan.startY = e.touches[0].clientY - graphPan.y;
    } else if (e.touches.length === 2) {
      graphPan.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });

  nodeGraphSvg.addEventListener('touchmove', (e) => {
    if (graphPan.isDragging && e.touches.length === 1) {
      graphPan.x = e.touches[0].clientX - graphPan.startX;
      graphPan.y = e.touches[0].clientY - graphPan.startY;
      renderNodeGraph();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist > 0) {
        const factor = dist / lastTouchDist;
        graphPan.scale = Math.max(0.4, Math.min(2.5, graphPan.scale * factor));
        renderNodeGraph();
      }
      lastTouchDist = dist;
    }
  }, { passive: true });

  nodeGraphSvg.addEventListener('touchend', () => {
    graphPan.isDragging = false;
    lastTouchDist = 0;
  });
}

let _nodeGraphSvg = null;
let _nodeRecipeList = null;
let _recipeTargetName = null;
let _nodeEngineBadge = null;

export function initNodeGraphDOM(svg, recipeList, targetName, badge) {
  _nodeGraphSvg = svg;
  _nodeRecipeList = recipeList;
  _recipeTargetName = targetName;
  _nodeEngineBadge = badge;
}

export function renderNodeGraph() {
  if (!_nodeGraphSvg || !_nodeRecipeList) return;
  const model = generateNodeGraphModel();

  const style = getComputedStyle(document.documentElement);
  const colorAction = style.getPropertyValue('--vfx-action').trim() || '#4C9AFF';
  const colorBorder = style.getPropertyValue('--vfx-border').trim() || '#39404F';
  const colorCard = style.getPropertyValue('--vfx-card').trim() || '#2F3442';
  const colorInset = style.getPropertyValue('--vfx-inset').trim() || '#111317';
  const colorMuted = style.getPropertyValue('--vfx-muted').trim() || '#979EAC';

  if (_recipeTargetName) _recipeTargetName.textContent = 'Unity Shader Graph & Unreal Material';
  if (_nodeEngineBadge) {
    _nodeEngineBadge.textContent = 'Universal Math Graph';
    _nodeEngineBadge.style.color = colorAction;
    _nodeEngineBadge.style.fontWeight = '700';
  }

  // Update Recipe list
  _nodeRecipeList.innerHTML = '';
  model.recipe.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    _nodeRecipeList.appendChild(li);
  });

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
  rootG.setAttribute('transform', `translate(${graphPan.x}, ${graphPan.y}) scale(${graphPan.scale})`);

  // Render Wires
  const wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  model.wires.forEach(w => {
    const fromNode = model.nodes.find(n => n.id === w.from);
    const toNode = model.nodes.find(n => n.id === w.to);
    if (!fromNode || !toNode) return;

    const x1 = fromNode.x + fromNode.w;
    const y1 = fromNode.y + fromNode.h * 0.55;
    let x2 = toNode.x;
    let y2 = toNode.y + toNode.h * 0.55;

    if (toNode.inPorts && toNode.inPorts.length > 1) {
      const portIndex = toNode.inPorts.indexOf(w.toPort);
      if (portIndex >= 0) {
        const step = (toNode.h - 26) / (toNode.inPorts.length + 1);
        y2 = toNode.y + 22 + step * (portIndex + 1);
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
  });
  rootG.appendChild(wireGroup);

  // Render Nodes
  const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  model.nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
    g.setAttribute('filter', 'url(#node-shadow)');

    const isMath = n.type === 'math';
    const headerGrad = isMath ? 'url(#math-header)' : 'url(#io-header)';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', n.w);
    rect.setAttribute('height', n.h);
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', colorInset);
    rect.setAttribute('stroke', colorBorder);
    rect.setAttribute('stroke-width', '1.5');
    g.appendChild(rect);

    const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    header.setAttribute('width', n.w);
    header.setAttribute('height', '22');
    header.setAttribute('rx', '6');
    header.setAttribute('fill', headerGrad);
    g.appendChild(header);

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '8');
    title.setAttribute('y', '15');
    title.setAttribute('fill', '#ffffff');
    title.setAttribute('font-size', '10');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Fira Code, monospace');
    title.textContent = n.title;
    g.appendChild(title);

    if (n.inPort) {
      const inPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inPin.setAttribute('cx', '0');
      inPin.setAttribute('cy', n.h * 0.55);
      inPin.setAttribute('r', '4');
      inPin.setAttribute('fill', colorAction);
      inPin.setAttribute('stroke', colorInset);
      inPin.setAttribute('stroke-width', '1.5');
      g.appendChild(inPin);
    } else if (n.inPorts) {
      const step = (n.h - 26) / (n.inPorts.length + 1);
      n.inPorts.forEach((p, idx) => {
        const py = 22 + step * (idx + 1);
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
        pLabel.setAttribute('font-size', '8.5');
        pLabel.setAttribute('font-family', 'Fira Code, monospace');
        pLabel.textContent = p;
        g.appendChild(pLabel);
      });
    }

    if (n.outPort) {
      const outPin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outPin.setAttribute('cx', n.w);
      outPin.setAttribute('cy', n.h * 0.55);
      outPin.setAttribute('r', '4');
      outPin.setAttribute('fill', colorAction);
      outPin.setAttribute('stroke', colorInset);
      outPin.setAttribute('stroke-width', '1.5');
      g.appendChild(outPin);

      const oLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      oLabel.setAttribute('x', n.w - 24);
      oLabel.setAttribute('y', n.h * 0.55 + 3);
      oLabel.setAttribute('fill', colorMuted);
      oLabel.setAttribute('font-size', '8.5');
      oLabel.setAttribute('font-family', 'Fira Code, monospace');
      oLabel.textContent = 'Out';
      g.appendChild(oLabel);
    }

    nodeGroup.appendChild(g);
  });

  rootG.appendChild(nodeGroup);
  _nodeGraphSvg.appendChild(rootG);
}

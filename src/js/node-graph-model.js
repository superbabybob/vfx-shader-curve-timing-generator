/**
 * ═══════════════════════════════════════════════════════
 * Node Graph Model — Generates the visual node/wire
 * data structure from current preset & state
 * ═══════════════════════════════════════════════════════
 */

import { state } from './state.js';

export function generateNodeGraphModel() {
  const curPreset = state.presets.find(p => p.id === state.selectedPresetId);
  const isBezierMode = state.mode === 'bezier';
  const type = isBezierMode ? 'bezier-deconstructed' : (curPreset ? curPreset.nodeType : 'custom');

  const inputNodeName = 'Input (t)';
  const outputNodeName = 'Output (y)';
  const round = (v) => Number(v.toFixed(2));

  let nodes = [];
  let wires = [];
  let recipe = [];

  if (type === 'bezier-deconstructed') {
    const { p1, p2, p3 } = state.handles;
    const c1 = round(3 * p1.y);
    const c2 = round(3 * p2.y);
    const p3y = round(p3.y);

    nodes = [
      { id: 'in_t', title: inputNodeName, x: 20, y: 160, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'om_t', title: 'One Minus', x: 180, y: 70, w: 120, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'pow_om2', title: 'Multiply (om²)', x: 340, y: 50, w: 135, h: 78, type: 'math', inPorts: ['A (1-t)', 'B (1-t)'], outPort: 'Out' },
      { id: 'pow_t2', title: 'Multiply (t²)', x: 340, y: 250, w: 135, h: 78, type: 'math', inPorts: ['A (t)', 'B (t)'], outPort: 'Out' },
      { id: 'mul_b1', title: 'Multiply', x: 520, y: 40, w: 125, h: 78, type: 'math', inPorts: ['A (om²)', 'B (t)'], outPort: 'Out' },
      { id: 'mul_b2', title: `Multiply (${c1})`, x: 680, y: 40, w: 135, h: 78, type: 'math', inPorts: ['A', `B (${c1})`], outPort: 'Out' },
      { id: 'mul_c1', title: 'Multiply', x: 520, y: 150, w: 125, h: 78, type: 'math', inPorts: ['A (1-t)', 'B (t²)'], outPort: 'Out' },
      { id: 'mul_c2', title: `Multiply (${c2})`, x: 680, y: 150, w: 135, h: 78, type: 'math', inPorts: ['A', `B (${c2})`], outPort: 'Out' },
      { id: 'mul_d1', title: 'Multiply (t³)', x: 520, y: 260, w: 125, h: 78, type: 'math', inPorts: ['A (t²)', 'B (t)'], outPort: 'Out' },
      { id: 'mul_d2', title: `Multiply (${p3y})`, x: 680, y: 260, w: 135, h: 78, type: 'math', inPorts: ['A', `B (${p3y})`], outPort: 'Out' },
      { id: 'add_bc', title: 'Add (B + C)', x: 855, y: 90, w: 130, h: 78, type: 'math', inPorts: ['A', 'B'], outPort: 'Out' },
      { id: 'add_all', title: 'Add (+ D)', x: 1025, y: 140, w: 130, h: 78, type: 'math', inPorts: ['A (B+C)', 'B (D)'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 1195, y: 145, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];

    wires = [
      { from: 'in_t', to: 'om_t', fromPort: 'Out', toPort: 'In' },
      { from: 'om_t', to: 'pow_om2', fromPort: 'Out', toPort: 'A (1-t)' },
      { from: 'om_t', to: 'pow_om2', fromPort: 'Out', toPort: 'B (1-t)' },
      { from: 'in_t', to: 'pow_t2', fromPort: 'Out', toPort: 'A (t)' },
      { from: 'in_t', to: 'pow_t2', fromPort: 'Out', toPort: 'B (t)' },
      { from: 'pow_om2', to: 'mul_b1', fromPort: 'Out', toPort: 'A (om²)' },
      { from: 'in_t', to: 'mul_b1', fromPort: 'Out', toPort: 'B (t)' },
      { from: 'mul_b1', to: 'mul_b2', fromPort: 'Out', toPort: 'A' },
      { from: 'om_t', to: 'mul_c1', fromPort: 'Out', toPort: 'A (1-t)' },
      { from: 'pow_t2', to: 'mul_c1', fromPort: 'Out', toPort: 'B (t²)' },
      { from: 'mul_c1', to: 'mul_c2', fromPort: 'Out', toPort: 'A' },
      { from: 'pow_t2', to: 'mul_d1', fromPort: 'Out', toPort: 'A (t²)' },
      { from: 'in_t', to: 'mul_d1', fromPort: 'Out', toPort: 'B (t)' },
      { from: 'mul_d1', to: 'mul_d2', fromPort: 'Out', toPort: 'A' },
      { from: 'mul_b2', to: 'add_bc', fromPort: 'Out', toPort: 'A' },
      { from: 'mul_c2', to: 'add_bc', fromPort: 'Out', toPort: 'B' },
      { from: 'add_bc', to: 'add_all', fromPort: 'Out', toPort: 'A (B+C)' },
      { from: 'mul_d2', to: 'add_all', fromPort: 'Out', toPort: 'B (D)' },
      { from: 'add_all', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];

    recipe = [
      'ใช้โหนดพื้นฐานสากล (One Minus, Multiply, Add) ทั้งใน Unity และ Unreal เหมือนกัน',
      'สร้างโหนด One Minus (1-t) แล้วยกกำลังสองด้วย Multiply',
      `สร้างพจน์ B: (1-t)² * t แล้วคูณด้วยค่าคงที่ 3·P1 = ${c1}`,
      `สร้างพจน์ C: (1-t) * t² แล้วคูณด้วยค่าคงที่ 3·P2 = ${c2}`,
      `สร้างพจน์ D: t³ แล้วคูณด้วย P3 = ${p3y}`,
      'รวมผลลัพธ์ทั้ง 3 ส่วนด้วยโหนด Add 2 ตัว แล้วเชื่อมต่อเข้าพอร์ต Output'
    ];
  } else if (type === 'linear') {
    nodes = [
      { id: 'in', title: inputNodeName, x: 50, y: 90, w: 130, h: 64, type: 'input', outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 260, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [{ from: 'in', to: 'out', fromPort: 'Out', toPort: 'In' }];
    recipe = ['ลากสายค่า t (จาก Particle Life / Normalized Time) ตรงเข้าใช้งานได้ทันทีโดยไม่ต้องผ่านโหนดคำนวณ'];
  } else if (type === 'power') {
    const exp = (curPreset && curPreset.nodeParam) ? curPreset.nodeParam : 2.0;
    nodes = [
      { id: 'in', title: inputNodeName, x: 40, y: 90, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'pow', title: 'Power', x: 210, y: 80, w: 135, h: 84, type: 'math', inPorts: ['Base (t)', `Exp (${exp})`], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 395, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'pow', fromPort: 'Out', toPort: 'Base (t)' },
      { from: 'pow', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'สร้างโหนด `Power`',
      `ต่อสัญญาณ t เข้าพอร์ต Base และตั้งค่าพอร์ต Exp เป็น ${exp}`,
      'นำ Out เชื่อมเข้ากับ Alpha / Scale'
    ];
  } else if (type === 'ease-out') {
    const exp = (curPreset && curPreset.nodeParam) ? curPreset.nodeParam : 2.0;
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 95, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'om1', title: 'One Minus', x: 190, y: 95, w: 120, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'pow', title: 'Power', x: 350, y: 85, w: 135, h: 84, type: 'math', inPorts: ['Base', `Exp (${exp})`], outPort: 'Out' },
      { id: 'om2', title: 'One Minus', x: 525, y: 95, w: 120, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 685, y: 95, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'om1', fromPort: 'Out', toPort: 'In' },
      { from: 'om1', to: 'pow', fromPort: 'Out', toPort: 'Base' },
      { from: 'pow', to: 'om2', fromPort: 'Out', toPort: 'In' },
      { from: 'om2', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'ส่งค่า t เข้าโหนด `One Minus` (1 - t)',
      `ส่งเข้าโหนด \`Power\` กำหนดค่า Exp = ${exp}`,
      'ส่งเข้าโหนด `One Minus` อีกครั้ง เพื่อให้ได้กราฟพุ่งตัวเร็วแล้วค่อยๆ ชะลอ',
      'เชื่อมต่อเข้าช่อง Scale หรือ Alpha'
    ];
  } else if (type === 'smoothstep') {
    const inMin = (curPreset && curPreset.min !== undefined) ? curPreset.min : 0.0;
    const inMax = (curPreset && curPreset.max !== undefined) ? curPreset.max : 1.0;
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 90, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'ss', title: 'Smoothstep', x: 200, y: 70, w: 165, h: 96, type: 'math', inPorts: [`Edge1 (${inMin})`, `Edge2 (${inMax})`, 'In (t)'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 410, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'ss', fromPort: 'Out', toPort: 'In (t)' },
      { from: 'ss', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'สร้างโหนด `Smoothstep` (ทั้ง Unity และ Unreal ใช้ชื่อ Smoothstep)',
      `กำหนดค่า Edge1 = ${inMin} และ Edge2 = ${inMax}`,
      'ต่อสาย t เข้าพอร์ต In'
    ];
  } else if (type === 'bell') {
    nodes = [
      { id: 'in', title: inputNodeName, x: 20, y: 95, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'om', title: 'One Minus', x: 180, y: 150, w: 120, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'mul1', title: 'Multiply', x: 340, y: 80, w: 130, h: 84, type: 'math', inPorts: ['A (t)', 'B (1-t)'], outPort: 'Out' },
      { id: 'mul2', title: 'Multiply (4.0)', x: 510, y: 80, w: 135, h: 84, type: 'math', inPorts: ['A', 'B (4.0)'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 685, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'mul1', fromPort: 'Out', toPort: 'A (t)' },
      { from: 'in', to: 'om', fromPort: 'Out', toPort: 'In' },
      { from: 'om', to: 'mul1', fromPort: 'Out', toPort: 'B (1-t)' },
      { from: 'mul1', to: 'mul2', fromPort: 'Out', toPort: 'A' },
      { from: 'mul2', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'แยกสาย t: สายแรกเข้าโหนด `Multiply (A)` อีกสายเข้า `One Minus`',
      'นำเอาผลลัพธ์จาก `One Minus` เข้า `Multiply (B)` (ได้ค่า t * (1-t))',
      'ส่งเข้าโหนด `Multiply` อีกตัวแล้วคูณด้วยค่าคงที่ `4.0`',
      'ได้ค่าสว่างวาบสูงสุดที่ t = 0.5 แล้วค่อยๆ ดับสมบูรณ์ที่ t = 1.0'
    ];
  } else if (type === 'sine-half') {
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 90, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'mul_pi', title: 'Multiply (· π)', x: 190, y: 80, w: 140, h: 84, type: 'math', inPorts: ['A (t)', 'B (3.1415)'], outPort: 'Out' },
      { id: 'sine', title: 'Sine', x: 370, y: 85, w: 120, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 530, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'mul_pi', fromPort: 'Out', toPort: 'A (t)' },
      { from: 'mul_pi', to: 'sine', fromPort: 'Out', toPort: 'In' },
      { from: 'sine', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'คูณค่า t ด้วย π (ประมาณ 3.14159)',
      'ส่งเข้าโหนด `Sine`',
      'เชื่อมต่อสัญญาณเข้า Glow Emissive หรือ Particle Scale'
    ];
  } else if (type === 'frac-saw') {
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 90, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'mul_freq', title: 'Multiply (3x)', x: 190, y: 80, w: 135, h: 84, type: 'math', inPorts: ['A (t)', 'B (3.0)'], outPort: 'Out' },
      { id: 'frac', title: 'Fraction / Frac', x: 365, y: 90, w: 130, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 535, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'mul_freq', fromPort: 'Out', toPort: 'A (t)' },
      { from: 'mul_freq', to: 'frac', fromPort: 'Out', toPort: 'In' },
      { from: 'frac', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'นำค่า t ไปคูณกับจำนวนจังหวะ (เช่น 3.0)',
      'ส่งเข้าโหนด `Fraction` (Unity) หรือ `Frac` (Unreal) เพื่อตัดเศษทศนิยม',
      'ได้คลื่นฟันปลา (Sawtooth) 3 จังหวะต่อเนื่อง'
    ];
  } else if (type === 'remap') {
    const inMin = (curPreset && curPreset.min !== undefined) ? curPreset.min : 0.0;
    const inMax = (curPreset && curPreset.max !== undefined) ? curPreset.max : 0.4;
    const range = round(inMax - inMin);
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 95, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'sub', title: 'Subtract', x: 190, y: 80, w: 135, h: 84, type: 'math', inPorts: ['A (t)', `B (${inMin})`], outPort: 'Out' },
      { id: 'div', title: 'Divide', x: 365, y: 80, w: 140, h: 84, type: 'math', inPorts: ['A', `B (${range})`], outPort: 'Out' },
      { id: 'sat', title: 'Saturate / Clamp', x: 545, y: 90, w: 135, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 720, y: 90, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'sub', fromPort: 'Out', toPort: 'A (t)' },
      { from: 'sub', to: 'div', fromPort: 'Out', toPort: 'A' },
      { from: 'div', to: 'sat', fromPort: 'Out', toPort: 'In' },
      { from: 'sat', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      `ลบจุดเริ่มต้น: นำ t เข้าโหนด Subtract ด้วย ${inMin}`,
      `หารด้วยช่วงความกว้าง: นำเข้าโหนด Divide หารด้วยช่วงเวลา (${range})`,
      'ส่งเข้าโหนด `Saturate` (Unity) หรือ `Clamp (0..1)` (Unreal)',
      'เชื่อมผลลัพธ์เข้า Particle Dissolve หรือ Animation Step'
    ];
  } else {
    nodes = [
      { id: 'in', title: inputNodeName, x: 30, y: 100, w: 120, h: 64, type: 'input', outPort: 'Out' },
      { id: 'n1', title: 'One Minus (1-t)', x: 190, y: 50, w: 125, h: 64, type: 'math', inPorts: ['In'], outPort: 'Out' },
      { id: 'n2', title: 'Multiply (t · t)', x: 190, y: 155, w: 135, h: 84, type: 'math', inPorts: ['A', 'B'], outPort: 'Out' },
      { id: 'n3', title: 'Multiply', x: 365, y: 95, w: 130, h: 84, type: 'math', inPorts: ['A', 'B'], outPort: 'Out' },
      { id: 'out', title: outputNodeName, x: 535, y: 100, w: 130, h: 64, type: 'output', inPort: 'In' }
    ];
    wires = [
      { from: 'in', to: 'n1', fromPort: 'Out', toPort: 'In' },
      { from: 'in', to: 'n2', fromPort: 'Out', toPort: 'A' },
      { from: 'in', to: 'n2', fromPort: 'Out', toPort: 'B' },
      { from: 'n1', to: 'n3', fromPort: 'Out', toPort: 'A' },
      { from: 'n2', to: 'n3', fromPort: 'Out', toPort: 'B' },
      { from: 'n3', to: 'out', fromPort: 'Out', toPort: 'In' }
    ];
    recipe = [
      'ประกอบจาก Math Node พื้นฐานสากล (Multiply, One Minus, Add, Power, Saturate)',
      `คำนวณตามสูตรคณิตศาสตร์: ${state.customExpr}`,
      'สามารถลาก Pan / Scroll Zoom ผังโหนดเพื่อดูการเชื่อมต่อทั้งหมดได้'
    ];
  }

  return { nodes, wires, recipe };
}

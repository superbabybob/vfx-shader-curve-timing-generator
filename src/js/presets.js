/**
 * ═══════════════════════════════════════════════════════
 * Presets — VFX Curve preset library (24 entries)
 * Grouped strictly by Mathematical Equation Family:
 * - polynomial: Polynomial & Power Curves (pow, cubic, quad)
 * - hermite: Hermite & Smoothstep Interpolations
 * - trig: Trigonometric / Sine & Cosine Waves
 * - exp: Exponential & Damped Decay Curves
 * - piecewise: Piecewise, Saturate & Step Functions
 * ═══════════════════════════════════════════════════════
 */

export const presets = [
  // ── 1. Polynomial & Power Curves (xⁿ, (1-x)ⁿ, Bézier) ──
  {
    id: 'linear',
    cat: 'polynomial',
    name: 'Linear (เชิงเส้น)',
    type: 'bezier',
    desc: 'ค่าเปลี่ยนคงที่สม่ำเสมอ ฟังก์ชันเชิงเส้น y = t',
    tip: 'ในกราฟ: ลากสาย t เข้าใช้งานตรงๆ ได้ทันทีโดยไม่ต้องผ่านโหนดคำนวณ',
    p0: [0, 0], p1: [0.33, 0.33], p2: [0.66, 0.66], p3: [1, 1],
    expr: 't',
    badge: 'y = t',
    nodeType: 'linear'
  },
  {
    id: 'ease-in-quad',
    cat: 'polynomial',
    name: 'Ease In (Quadratic)',
    type: 'bezier',
    desc: 'ยกกำลัง 2 เริ่มช้าแล้วเร่งความเร็วพุ่งตัว',
    tip: 'ในกราฟ: ต่อ t เข้า Power Node กำหนด Exp = 2.0',
    p0: [0, 0], p1: [0.5, 0.0], p2: [0.75, 0.5], p3: [1, 1],
    expr: 'pow(t, 2.0)',
    badge: 'pow(t, 2)',
    nodeType: 'power',
    nodeParam: 2.0
  },
  {
    id: 'ease-out-quad',
    cat: 'polynomial',
    name: 'Ease Out (Quadratic)',
    type: 'bezier',
    desc: 'พาราโบลาผกผัน 1 - (1-t)² พุ่งเร็วแล้วค่อยๆ ชะลอ',
    tip: 'ในกราฟ: นำ t เข้า One Minus -> Power (2.0) -> One Minus',
    p0: [0, 0], p1: [0.25, 0.75], p2: [0.5, 1.0], p3: [1, 1],
    expr: '1.0 - pow(1.0 - t, 2.0)',
    badge: '1 - (1-t)²',
    nodeType: 'ease-out',
    nodeParam: 2.0
  },
  {
    id: 'ease-in-cubic',
    cat: 'polynomial',
    name: 'Ease In (Cubic)',
    type: 'bezier',
    desc: 'ยกกำลัง 3 หน่วงช่วงแรกนานขึ้นและเร่งแรงขึ้น',
    tip: 'ในกราฟ: ต่อ t เข้า Power Node กำหนด Exp = 3.0',
    p0: [0, 0], p1: [0.55, 0.055], p2: [0.675, 0.19], p3: [1, 1],
    expr: 'pow(t, 3.0)',
    badge: 'pow(t, 3)',
    nodeType: 'power',
    nodeParam: 3.0
  },
  {
    id: 'ease-out-cubic',
    cat: 'polynomial',
    name: 'Ease Out (Cubic)',
    type: 'bezier',
    desc: 'กำลัง 3 ผกผัน 1 - (1-t)³ ระเบิดตัวแรงใน 15% แรก',
    tip: 'ในกราฟ: t -> One Minus -> Power (3.0) -> One Minus',
    p0: [0, 0], p1: [0.215, 0.61], p2: [0.355, 1.0], p3: [1, 1],
    expr: '1.0 - pow(1.0 - t, 3.0)',
    badge: '1 - (1-t)³',
    nodeType: 'ease-out',
    nodeParam: 3.0
  },
  {
    id: 'parabolic-bell',
    cat: 'polynomial',
    name: 'Parabolic Bell (ระฆังคว่ำ)',
    type: 'expression',
    desc: 'พหุนามกำลัง 2: 4·t·(1-t) สว่างขึ้นแล้วดับลงกึ่งกลาง',
    tip: 'ในกราฟ: t -> One Minus (1-t) -> Multiply กับ t -> Multiply ด้วย 4.0',
    expr: '4.0 * t * (1.0 - t)',
    p0: [0, 0], p1: [0.25, 0.95], p2: [0.75, 0.95], p3: [1, 0],
    badge: '4·t·(1-t)',
    nodeType: 'bell'
  },
  {
    id: 'anticipation-dip',
    cat: 'polynomial',
    name: 'Anticipation Dip (ถอยง้าง)',
    type: 'bezier',
    desc: 'พหุนามกำลังสามติดลบช่วงต้น ยุบตัวสะสมแรงก่อนพุ่ง',
    tip: 'ในกราฟ: ใช้ Bézier Custom Function หรือ Power Node ประกอบ',
    p0: [0, 0], p1: [0.35, -0.28], p2: [0.45, 1.05], p3: [1, 1],
    expr: 'pow(t, 2.0) * (3.5 * t - 2.5)',
    badge: 'dip -0.28',
    nodeType: 'bezier-custom'
  },
  {
    id: 'overshoot-backout',
    cat: 'polynomial',
    name: 'Back Out (เด้งล้น Overshoot)',
    type: 'bezier',
    desc: 'พหุนาม Back-Out พุ่งทะลุ 1.0 แล้วดึงกลับมานิ่ง',
    tip: 'ในกราฟ: ใช้ Cubic Bézier Evaluator หรือสมการ Back-Out Polynomial',
    p0: [0, 0], p1: [0.34, 1.45], p2: [0.64, 1.0], p3: [1, 1],
    expr: '1.0 + 2.70158 * pow(t - 1.0, 3.0) + 1.70158 * pow(t - 1.0, 2.0)',
    badge: 'overshoot 1.25',
    nodeType: 'bezier-custom'
  },

  // ── 2. Hermite & Smoothstep Interpolations ──
  {
    id: 'smoothstep',
    cat: 'hermite',
    name: 'Smoothstep (Hermite S-Curve)',
    type: 'bezier',
    desc: 'Hermite Interpolation: 3t² - 2t³ นุ่มหัวท้าย',
    tip: 'ในกราฟ: ใช้โหนด Smoothstep Node ใน Unity หรือ Smoothstep ใน UE ได้โดยตรง',
    p0: [0, 0], p1: [0.42, 0.0], p2: [0.58, 1.0], p3: [1, 1],
    expr: 'smoothstep(0.0, 1.0, t)',
    badge: 'smoothstep',
    nodeType: 'smoothstep',
    min: 0.0, max: 1.0
  },
  {
    id: 'smootherstep',
    cat: 'hermite',
    name: 'Smootherstep (Ken Perlin)',
    type: 'expression',
    desc: 'Quintic Hermite: 6t⁵ - 15t⁴ + 10t³ นุ่มนวลสูงสุด (2nd deriv = 0)',
    tip: 'ในกราฟ: สร้าง Custom Function หรือร้อยเรียงสมการ 6t⁵-15t⁴+10t³',
    expr: 't * t * t * (t * (t * 6.0 - 15.0) + 10.0)',
    p0: [0, 0], p1: [0.4, 0.0], p2: [0.6, 1.0], p3: [1, 1],
    badge: '6t⁵-15t⁴+10t³',
    nodeType: 'custom'
  },
  {
    id: 'subrange-phase2',
    cat: 'hermite',
    name: 'Bounded Smoothstep [0.3, 0.7]',
    type: 'expression',
    desc: 'Smoothstep กำหนดช่วงขอบ Edge: smoothstep(0.3, 0.7, t)',
    tip: 'ในกราฟ: Smoothstep Node (InMin: 0.3, InMax: 0.7)',
    expr: 'smoothstep(0.3, 0.7, t)',
    p0: [0, 0], p1: [0.3, 0.0], p2: [0.7, 1.0], p3: [1, 1],
    badge: 'smoothstep[0.3,0.7]',
    nodeType: 'smoothstep',
    min: 0.3, max: 0.7
  },

  // ── 3. Trigonometric (Sine & Cosine Waves) ──
  {
    id: 'sine-pulse-half',
    cat: 'trig',
    name: 'Half Sine Arc (0→1→0)',
    type: 'expression',
    desc: 'คลื่นไซน์ครึ่งลูก sin(π·t) ยอดโค้งมนไม่มีมุมแหลม',
    tip: 'ในกราฟ: ต่อ t -> Multiply (3.14159) -> Sine Node',
    expr: 'sin(t * 3.14159)',
    p0: [0, 0], p1: [0.2, 0.8], p2: [0.8, 0.8], p3: [1, 0],
    badge: 'sin(π·t)',
    nodeType: 'sine-half'
  },
  {
    id: 'sine-wave-cycle',
    cat: 'trig',
    name: 'Full Sine Cycle (0.5→1→0→0.5)',
    type: 'expression',
    desc: 'คลื่นไซน์เต็มลูก 1 รอบ: sin(2π·t) * 0.5 + 0.5',
    tip: 'ในกราฟ: t -> Multiply(6.283) -> Sine -> Multiply(0.5) -> Add(0.5)',
    expr: 'sin(t * 6.28318) * 0.5 + 0.5',
    p0: [0, 0.5], p1: [0.25, 1.0], p2: [0.75, 0.0], p3: [1, 0.5],
    badge: 'sin(2π·t)',
    nodeType: 'sine-cycle'
  },
  {
    id: 'lightning-strobe',
    cat: 'trig',
    name: 'High-Freq Sine Strobe',
    type: 'expression',
    desc: 'ไซน์ความถี่สูงตัดแคลมป์: saturate(sin(12.56t)·1.5)·(1-t)',
    tip: 'ในกราฟ: t -> Sine (Freq 12.5) -> Saturate -> Multiply กับ (1-t)',
    expr: 'saturate(sin(t * 12.56) * 1.5) * (1.0 - t)',
    p0: [0, 0], p1: [0.15, 1.0], p2: [0.45, 0.8], p3: [1, 0],
    badge: 'strobe sin(4π·t)',
    nodeType: 'custom'
  },
  {
    id: 'flicker-torch',
    cat: 'trig',
    name: 'Dual Harmonic Sine & Cos',
    type: 'expression',
    desc: 'ผสม 2 ความถี่ประสาน: sin(31.4t) * cos(12.5t)',
    tip: 'ในกราฟ: ใช้ Noise Node หรือผสม Sine 2 ความถี่',
    expr: 'saturate(0.65 + 0.35 * sin(t * 31.4) * cos(t * 12.5)) * (1.0 - t * 0.5)',
    p0: [0, 0.8], p1: [0.3, 1.0], p2: [0.7, 0.4], p3: [1, 0.5],
    badge: 'sin(ω₁)·cos(ω₂)',
    nodeType: 'custom'
  },
  {
    id: 'heartbeat-double-pulse',
    cat: 'trig',
    name: 'Powered Sine Pulse (Bi-Phase)',
    type: 'expression',
    desc: 'ไซน์ยกกำลังสูงแบบมี Phase Offset: sin(2π·t)⁸ + 0.5·sin(2π(t-0.15))⁸',
    tip: 'ในกราฟ: รวม Sine Power Pulse 2 ลูกที่มี Offset เวลา',
    expr: 'pow(saturate(sin(t * 6.283)), 8.0) + 0.5 * pow(saturate(sin((t - 0.15) * 6.283)), 8.0)',
    p0: [0, 0], p1: [0.2, 1.0], p2: [0.4, 0.5], p3: [1, 0],
    badge: 'sin(2πt)⁸ pulse',
    nodeType: 'custom'
  },

  // ── 4. Exponential & Damped Decay (e⁻ᵃᵗ, eᵃᵗ) ──
  {
    id: 'expo-ramp',
    cat: 'exp',
    name: 'Exponential Charge (e⁴ᵗ)',
    type: 'expression',
    desc: 'เอกซ์โพเนนเชียลเร่งพลังงาน: (exp(4t) - 1) / (exp(4) - 1)',
    tip: 'ในกราฟ: ต่อ t เข้า Multiply(4.0) -> Exponential -> Subtract(1) -> Divide',
    expr: '(exp(4.0 * t) - 1.0) / (exp(4.0) - 1.0)',
    p0: [0, 0], p1: [0.8, 0.1], p2: [0.95, 0.5], p3: [1, 1],
    badge: 'exp(4t) ramp',
    nodeType: 'custom'
  },
  {
    id: 'elastic-bounce',
    cat: 'exp',
    name: 'Damped Spring Oscillation',
    type: 'expression',
    desc: 'สปริงลดทอน: 1 - exp(-6t) * cos(18.84t)',
    tip: 'ในกราฟ: 1.0 - (Exp(-6t) * Cos(18.84t))',
    expr: '1.0 - exp(-6.0 * t) * cos(t * 18.84)',
    p0: [0, 0], p1: [0.2, 1.3], p2: [0.5, 0.9], p3: [1, 1],
    badge: 'exp(-6t)·cos',
    nodeType: 'custom'
  },
  {
    id: 'heavy-slam-impact',
    cat: 'exp',
    name: 'Damped Impact Wobble',
    type: 'expression',
    desc: 'ลดทอนแรงสั่นสะเทือน: exp(-5t) * cos(25.13t)',
    tip: 'ในกราฟ: Screen Shake หรือคลื่นสะเทือนอุกกาบาต',
    expr: 'exp(-5.0 * t) * cos(t * 25.13)',
    p0: [0, 1], p1: [0.1, -0.4], p2: [0.3, 0.3], p3: [1, 0],
    badge: 'exp(-5t)·cos',
    nodeType: 'custom'
  },

  // ── 5. Piecewise, Saturate & Steps (clamp, min, floor, frac) ──
  {
    id: 'attack-decay-fast',
    cat: 'piecewise',
    name: 'Bilinear Min Clamp (วาบทันที)',
    type: 'expression',
    desc: 'สมการแยกช่วงเส้นตรง: min(saturate(t/0.08), saturate((1-t)/0.92))',
    tip: 'ในกราฟ: แยกสาย Attack (Divide 0.08) และ Decay (One Minus / 0.92) แล้วรวบด้วย Min Node',
    expr: 'min(saturate(t / 0.08), saturate((1.0 - t) / 0.92))',
    p0: [0, 0], p1: [0.03, 1.0], p2: [0.3, 0.7], p3: [1, 0],
    badge: 'min(t/a, (1-t)/b)',
    nodeType: 'attack-decay'
  },
  {
    id: 'subrange-phase1',
    cat: 'piecewise',
    name: 'Linear Remap [0.0, 0.4]',
    type: 'expression',
    desc: 'สเกลเชิงเส้นจำกัดขอบ: saturate(t / 0.4)',
    tip: 'ในกราฟ: Remap Node [In: 0.0-0.4, Out: 0.0-1.0] หรือ t / 0.4 แล้ว Clamp',
    expr: 'saturate(t / 0.4)',
    p0: [0, 0], p1: [0.15, 0.0], p2: [0.35, 1.0], p3: [0.4, 1.0],
    badge: 'saturate(t / 0.4)',
    nodeType: 'remap',
    min: 0.0, max: 0.4
  },
  {
    id: 'subrange-phase3',
    cat: 'piecewise',
    name: 'Offset Linear Remap [0.6, 1.0]',
    type: 'expression',
    desc: 'สเกลช่วงท้าย: saturate((t - 0.6) / 0.4)',
    tip: 'ในกราฟ: Remap Node [InMin: 0.6, InMax: 1.0] หรือ (t - 0.6)/0.4 -> Saturate',
    expr: 'saturate((t - 0.6) / 0.4)',
    p0: [0.6, 0], p1: [0.7, 0.0], p2: [0.9, 1.0], p3: [1, 1],
    badge: 'saturate((t-a)/b)',
    nodeType: 'remap',
    min: 0.6, max: 1.0
  },
  {
    id: 'multi-hit-sawtooth',
    cat: 'piecewise',
    name: 'Sawtooth Fraction frac(3t)',
    type: 'expression',
    desc: 'ฟังก์ชันตัดเศษทศนิยมวนรอบ: frac(t * 3.0)',
    tip: 'ในกราฟ: t -> Multiply(3.0) -> Fraction (Frac) Node',
    expr: 'frac(t * 3.0)',
    p0: [0, 0], p1: [0.33, 1.0], p2: [0.66, 0.0], p3: [1, 1.0],
    badge: 'frac(3t)',
    nodeType: 'frac-saw'
  },
  {
    id: 'stepped-toon-posterize',
    cat: 'piecewise',
    name: 'Stepped Quantize floor(5t)/4',
    type: 'expression',
    desc: 'ฟังก์ชันขั้นบันไดจำนวนเต็ม: floor(t * 5.0) / 4.0',
    tip: 'ในกราฟ: t -> Multiply(5.0) -> Floor -> Divide(4.0)',
    expr: 'floor(t * 5.0) / 4.0',
    p0: [0, 0], p1: [0.2, 0.25], p2: [0.6, 0.75], p3: [1, 1],
    badge: 'floor(5t) / 4',
    nodeType: 'stepped',
    steps: 5
  }
];

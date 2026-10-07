/**
 * ═══════════════════════════════════════════════════════
 * Presets — VFX Curve preset library (48 entries)
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
    p0: [0, 0], p1: [1/3, 1/3], p2: [2/3, 2/3], p3: [1, 1],
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
    p0: [0, 0], p1: [1/3, 0], p2: [2/3, 1/3], p3: [1, 1],
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
    p0: [0, 0], p1: [1/3, 2/3], p2: [2/3, 1], p3: [1, 1],
    expr: 't * (2.0 - t)',
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
    p0: [0, 0], p1: [1/3, 0], p2: [2/3, 0], p3: [1, 1],
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
    p0: [0, 0], p1: [1/3, 1], p2: [2/3, 1], p3: [1, 1],
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
    p0: [0, 0], p1: [1/3, 0], p2: [2/3, -2.5/3], p3: [1, 1],
    expr: 'pow(t, 2.0) * (3.5 * t - 2.5)',
    badge: 'anticipation dip',
    nodeType: 'bezier-custom'
  },
  {
    id: 'overshoot-backout',
    cat: 'polynomial',
    name: 'Back Out (เด้งล้น Overshoot)',
    type: 'bezier',
    desc: 'พหุนาม Back-Out พุ่งทะลุ 1.0 แล้วดึงกลับมานิ่ง',
    tip: 'ในกราฟ: ใช้ Cubic Bézier Evaluator หรือสมการ Back-Out Polynomial',
    p0: [0, 0], p1: [1/3, 1+1.7/3], p2: [2/3, 1], p3: [1, 1],
    expr: 't * (t * (2.7 * t - 6.4) + 4.7)',
    badge: 'overshoot 1.10',
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
    p0: [0, 0], p1: [1/3, 0], p2: [2/3, 1], p3: [1, 1],
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
    tip: 'ในกราฟ: Constant PI × จำนวนรอบ × t -> Sine Node',
    expr: 'sin(t * PI * 1)',
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
    tip: 'ในกราฟ: Constant TAU × จำนวนรอบ × t -> Sine -> Multiply(0.5) -> Add(0.5)',
    expr: 'sin(t * TAU * 1) * 0.5 + 0.5',
    p0: [0, 0.5], p1: [0.25, 1.0], p2: [0.75, 0.0], p3: [1, 0.5],
    badge: 'sin(2π·t)',
    nodeType: 'sine-cycle'
  },
  {
    id: 'lightning-strobe',
    cat: 'trig',
    name: 'High-Freq Sine Strobe',
    type: 'expression',
    desc: 'ไซน์ความถี่สูงตัดแคลมป์: saturate(sin(2·TAU·t)·1.5)·(1-t)',
    tip: 'ในกราฟ: t -> Sine (Constant TAU × Cycles 2) -> Saturate -> Multiply กับ (1-t)',
    expr: 'saturate(sin(t * TAU * 2) * 1.5) * (1.0 - t)',
    p0: [0, 0], p1: [0.15, 1.0], p2: [0.45, 0.8], p3: [1, 0],
    badge: 'strobe sin(4π·t)',
    nodeType: 'custom'
  },
  {
    id: 'flicker-torch',
    cat: 'exp',
    name: 'Dual Harmonic Sine & Cos',
    type: 'expression',
    desc: 'ผสม 2 ความถี่ประสาน: sin(5·TAU·t) * cos(12.5t)',
    tip: 'ในกราฟ: ใช้ Noise Node หรือผสม Sine 2 ความถี่',
    expr: 'saturate(0.65 + 0.35 * sin(t * TAU * 5) * cos(t * 12.5)) * (1.0 - t * 0.5)',
    p0: [0, 0.8], p1: [0.3, 1.0], p2: [0.7, 0.4], p3: [1, 0.5],
    badge: 'sin(ω₁)·cos(ω₂)',
    nodeType: 'custom'
  },
  {
    id: 'heartbeat-double-pulse',
    cat: 'trig',
    name: 'Powered Sine Pulse (Bi-Phase)',
    type: 'expression',
    desc: 'ไซน์ยกกำลังสูงแบบมี Phase Offset: sin(TAU·t)⁸ + 0.5·sin(TAU·(t-0.15))⁸',
    tip: 'ในกราฟ: รวม Sine Power Pulse 2 ลูกที่มี Offset เวลา',
    expr: 'pow(saturate(sin(t * TAU * 1)), 8.0) + 0.5 * pow(saturate(sin((t - 0.15) * TAU * 1)), 8.0)',
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
    desc: 'สปริงลดทอน: 1 - exp(-6t) * cos(3·TAU·t)',
    tip: 'ในกราฟ: 1.0 - (Exp(-6t) * Cos(TAU × 3 × t))',
    expr: '1.0 - exp(-6.0 * t) * cos(t * TAU * 3)',
    p0: [0, 0], p1: [0.2, 1.3], p2: [0.5, 0.9], p3: [1, 1],
    badge: 'exp(-6t)·cos',
    nodeType: 'custom'
  },
  {
    id: 'heavy-slam-impact',
    cat: 'exp',
    name: 'Damped Impact Wobble',
    type: 'expression',
    desc: 'ลดทอนแรงสั่นสะเทือน: exp(-5t) * cos(4·TAU·t)',
    tip: 'ในกราฟ: Screen Shake หรือคลื่นสะเทือนอุกกาบาต',
    expr: 'exp(-5.0 * t) * cos(t * TAU * 4)',
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
  },

  // Additional realtime curves: easing, envelopes, waves and timing windows.
  {
    "id": "ease-in-quart",
    "cat": "polynomial",
    "name": "Ease In (Quartic)",
    "type": "expression",
    "desc": "หน่วงช่วงต้นมากขึ้นแล้วเร่งเข้าปลาย เหมาะกับการสะสมพลัง",
    "tip": "ในกราฟ: t → Power (4) หรือเปิด Integer powers → Multiply",
    "expr": "pow(t, 4)",
    "badge": "t⁴",
    "nodeType": "custom"
  },
  {
    "id": "ease-out-quart",
    "cat": "polynomial",
    "name": "Ease Out (Quartic)",
    "type": "expression",
    "desc": "พุ่งออกเร็วแล้วค่อยหยุด เหมาะกับการขยาย shockwave",
    "tip": "ในกราฟ: Subtract → Power (4) → Subtract",
    "expr": "1 - pow(1 - t, 4)",
    "badge": "1−(1−t)⁴",
    "nodeType": "custom"
  },
  {
    "id": "ease-in-quint",
    "cat": "polynomial",
    "name": "Ease In (Quintic)",
    "type": "expression",
    "desc": "หน่วงนานแล้วเร่งแรงช่วงท้าย เหมาะกับจังหวะปล่อยพลัง",
    "tip": "ในกราฟ: t → Power (5) หรือเปิด Integer powers → Multiply",
    "expr": "pow(t, 5)",
    "badge": "t⁵",
    "nodeType": "custom"
  },
  {
    "id": "ease-out-quint",
    "cat": "polynomial",
    "name": "Ease Out (Quintic)",
    "type": "expression",
    "desc": "ตอบสนองฉับไวและมีช่วงชะลอยาว เหมาะกับ impact scale",
    "tip": "ในกราฟ: Subtract → Power (5) → Subtract",
    "expr": "1 - pow(1 - t, 5)",
    "badge": "1−(1−t)⁵",
    "nodeType": "custom"
  },
  {
    "id": "early-pulse",
    "cat": "polynomial",
    "name": "Early Pulse (พุ่งแล้วสลาย)",
    "type": "expression",
    "desc": "พัลส์ยอดสูงสุดช่วงหนึ่งในสามแรก แล้วสลายอย่างนุ่ม",
    "tip": "ในกราฟ: Multiply t กับ (1−t)² แล้วคูณ 6.75",
    "expr": "6.75 * t * pow(1 - t, 2)",
    "badge": "early peak 0.33",
    "nodeType": "custom"
  },
  {
    "id": "late-pulse",
    "cat": "polynomial",
    "name": "Late Pulse (สะสมแล้ววาบ)",
    "type": "expression",
    "desc": "พัลส์ยอดสูงสุดช่วงสองในสามท้าย เหมาะกับ charge flash",
    "tip": "ในกราฟ: Multiply t² กับ (1−t) แล้วคูณ 6.75",
    "expr": "6.75 * pow(t, 2) * (1 - t)",
    "badge": "late peak 0.67",
    "nodeType": "custom"
  },
  {
    "id": "compact-bell",
    "cat": "polynomial",
    "name": "Compact Bell (พัลส์แคบ)",
    "type": "expression",
    "desc": "ระฆังหัวท้ายราบและยอดเด่น เหมาะกับแสงวาบหนึ่งจังหวะ",
    "tip": "ในกราฟ: t×(1−t) → Power (2) → Multiply (16)",
    "expr": "16 * pow(t * (1 - t), 2)",
    "badge": "16[t(1−t)]²",
    "nodeType": "custom"
  },
  {
    "id": "smooth-flash-window",
    "cat": "hermite",
    "name": "Smooth Flash Window",
    "type": "expression",
    "desc": "เปิดแสงนุ่มอย่างรวดเร็ว คงแสงไว้ก่อนค่อยดับ",
    "tip": "ในกราฟ: Smoothstep ฝั่งเปิด × (1−Smoothstep ฝั่งดับ)",
    "expr": "smoothstep(0.05, 0.15, t) * (1 - smoothstep(0.35, 0.85, t))",
    "badge": "soft attack / decay",
    "nodeType": "custom"
  },
  {
    "id": "delayed-ignite",
    "cat": "hermite",
    "name": "Delayed Ignite (ติดไฟช่วงท้าย)",
    "type": "expression",
    "desc": "รอครึ่งแรกก่อนเร่งขึ้นและคงค่าสูงสุด เหมาะกับ delayed emission",
    "tip": "ในกราฟ: Smoothstep ใช้ Edge1=0.55 และ Edge2=0.90",
    "expr": "smoothstep(0.55, 0.9, t)",
    "badge": "ignite 0.55→0.90",
    "nodeType": "custom"
  },
  {
    "id": "smooth-fade-out",
    "cat": "hermite",
    "name": "Smooth Fade Out",
    "type": "expression",
    "desc": "เริ่มสว่างเต็มแล้วค่อยดับ โดยความชันหัวท้ายเป็นศูนย์",
    "tip": "ในกราฟ: Smoothstep → Subtract จาก 1",
    "expr": "1 - smoothstep(0, 1, t)",
    "badge": "1−smoothstep",
    "nodeType": "custom"
  },
  {
    "id": "double-flash-window",
    "cat": "hermite",
    "name": "Double Flash Window",
    "type": "expression",
    "desc": "แสงสองจังหวะแยกช่วงชัดเจน ปรับเวลาขึ้นลงแต่ละลูกได้",
    "tip": "ในกราฟ: สร้าง Smoothstep window สองชุดแล้วรวมด้วย Add",
    "expr": "smoothstep(0.1, 0.2, t) * (1 - smoothstep(0.25, 0.35, t)) + smoothstep(0.55, 0.65, t) * (1 - smoothstep(0.7, 0.85, t))",
    "badge": "two soft flashes",
    "nodeType": "custom"
  },
  {
    "id": "cosine-breathing",
    "cat": "trig",
    "name": "Cosine Breathing (หายใจหนึ่งรอบ)",
    "type": "expression",
    "desc": "เปิดและดับอย่างนุ่มตลอดหนึ่งรอบ เหมาะกับ aura pulse",
    "tip": "ในกราฟ: t×2π → Cosine → Multiply (0.5) → Subtract จาก 0.5",
    "expr": "0.5 - 0.5 * cos(TAU * t)",
    "badge": "cosine 0→1→0",
    "nodeType": "custom"
  },
  {
    "id": "signed-sine-swing",
    "cat": "trig",
    "name": "Signed Sine Swing (แกว่งสองทิศ)",
    "type": "expression",
    "desc": "แกว่งบวกแล้วลบหนึ่งรอบ ใช้กับ displacement หรือทิศทางการส่าย",
    "tip": "ในกราฟ: t×2π → Sine; ค่าเป็นบวกและลบ เหมาะกับ motion offset",
    "expr": "sin(TAU * t)",
    "badge": "signed sine ±1",
    "nodeType": "custom"
  },
  {
    "id": "tapered-ripple",
    "cat": "trig",
    "name": "Tapered Ripple (สั่นแล้วหยุด)",
    "type": "expression",
    "desc": "สั่นสองรอบและลดแรงจนเป็นศูนย์ ใช้กับ ring หรือ shake",
    "tip": "ในกราฟ: t×4π → Sine แล้วคูณ (1−t); ผลลัพธ์มีค่าติดลบ",
    "expr": "(1 - t) * sin(PI * 4 * t)",
    "badge": "linear decay × sine",
    "nodeType": "custom"
  },
  {
    "id": "rectified-sine-pulses",
    "cat": "trig",
    "name": "Rectified Sine Pulses",
    "type": "expression",
    "desc": "คลื่นสามลูกที่เป็นบวกทั้งหมด เหมาะกับ repeated glow",
    "tip": "ในกราฟ: t×3π → Sine → Absolute",
    "expr": "abs(sin(3 * PI * t))",
    "badge": "three rounded pulses",
    "nodeType": "custom"
  },
  {
    "id": "exponential-fade",
    "cat": "exp",
    "name": "Exponential Fade (ดับเร็ว)",
    "type": "expression",
    "desc": "เริ่มเต็มแล้วลดเร็ว มีหางจางยาว เหมาะกับประกายและควัน",
    "tip": "ในกราฟ: t×(−6) → Exponential; ปลายเหลือแสงเล็กน้อย",
    "expr": "exp(-6 * t)",
    "badge": "exp(−6t)",
    "nodeType": "custom"
  },
  {
    "id": "impact-envelope",
    "cat": "exp",
    "name": "Impact Envelope (พัลส์กระแทก)",
    "type": "expression",
    "desc": "ขึ้นเร็วถึงยอดแล้วลดแบบ exponential เหมาะกับ impact emission",
    "tip": "ในกราฟ: 12t × Exp(1−12t); ยอดอยู่ประมาณ t=0.08",
    "expr": "12 * t * exp(1 - 12 * t)",
    "badge": "fast impact envelope",
    "nodeType": "custom"
  },
  {
    "id": "delayed-impact-envelope",
    "cat": "exp",
    "name": "Delayed Impact Envelope",
    "type": "expression",
    "desc": "รอถึง 30% ก่อนเกิดพัลส์กระแทกและหางลดทอน",
    "tip": "ในกราฟ: u=Max(t−0.3,0); คำนวณ 10u×Exp(1−10u)",
    "expr": "10 * max(t - 0.3, 0) * exp(1 - 10 * max(t - 0.3, 0))",
    "badge": "impact after 0.30",
    "nodeType": "custom"
  },
  {
    "id": "triangle-pulse",
    "cat": "piecewise",
    "name": "Triangle Pulse (พัลส์สามเหลี่ยม)",
    "type": "expression",
    "desc": "พัลส์สมมาตรเส้นตรง ขึ้นลงคม ใช้โหนดพื้นฐาน",
    "tip": "ในกราฟ: t×2 → Subtract (1) → Absolute → Subtract จาก 1",
    "expr": "1 - abs(2 * t - 1)",
    "badge": "triangle 0→1→0",
    "nodeType": "custom"
  },
  {
    "id": "triangle-pulse-train",
    "cat": "piecewise",
    "name": "Triangle Pulse Train",
    "type": "expression",
    "desc": "พัลส์สามเหลี่ยมสามจังหวะ ใช้ frac แทนฟังก์ชันคลื่น",
    "tip": "ในกราฟ: t×3 → Fraction → คำนวณคลื่นสามเหลี่ยม",
    "expr": "1 - abs(2 * frac(3 * t) - 1)",
    "badge": "three triangle pulses",
    "nodeType": "custom"
  },
  {
    "id": "hard-gate-window",
    "cat": "piecewise",
    "name": "Hard Gate Window (เปิด–ปิดทันที)",
    "type": "expression",
    "desc": "เปิดค้างช่วงกลางแล้วตัดทันที เหมาะกับ toon flash",
    "tip": "ในกราฟ: Sign และ Saturate ทำขอบเปิด/ปิด แล้วคูณสองฝั่ง",
    "expr": "saturate(sign(t - 0.2)) * saturate(sign(0.6 - t))",
    "badge": "gate 0.20→0.60",
    "nodeType": "custom"
  },
  {
    "id": "flash-hold-decay",
    "cat": "piecewise",
    "name": "Flash Hold Decay",
    "type": "expression",
    "desc": "เปิดเร็ว ค้างสว่าง แล้วลดช่วงท้าย เหมาะกับ muzzle flash",
    "tip": "ในกราฟ: Min ของ Attack ramp และ Decay ramp; ค่าอยู่ช่วง 0–1",
    "expr": "min(saturate(t / 0.05), saturate((1 - t) / 0.25))",
    "badge": "attack / hold / decay",
    "nodeType": "custom"
  },
  {
    "id": "normalized-staircase",
    "cat": "piecewise",
    "name": "Normalized Staircase (0→1)",
    "type": "expression",
    "desc": "เพิ่มทีละ 0.25 และจบที่ 1 เหมาะกับ stepped reveal",
    "tip": "ในกราฟ: t×4 → Floor → Divide (4)",
    "expr": "floor(4 * t) / 4",
    "badge": "four steps to 1",
    "nodeType": "custom"
  },
  {
    "id": "reverse-sawtooth",
    "cat": "piecewise",
    "name": "Reverse Sawtooth (ลดแล้วรีเซ็ต)",
    "type": "expression",
    "desc": "ลดเป็นเส้นตรงแล้วรีเซ็ตสามรอบ เหมาะกับ looping dissolve",
    "tip": "ในกราฟ: t×3 → Fraction → Subtract จาก 1",
    "expr": "1 - frac(3 * t)",
    "badge": "reverse saw ×3",
    "nodeType": "custom"
  }
];

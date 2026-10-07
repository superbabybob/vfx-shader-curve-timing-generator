/**
 * ═══════════════════════════════════════════════════════
 * Presets — VFX Curve preset library (24 entries)
 * ═══════════════════════════════════════════════════════
 */

export const presets = [
  // ── 1. Easing & Transitions ──
  {
    id: 'linear',
    cat: 'easing',
    name: 'Linear (เชิงเส้น)',
    type: 'bezier',
    desc: 'ค่าเปลี่ยนคงที่สม่ำเสมอ เหมาะกับหมุน Loop หรือ UV Scroll',
    tip: 'ในกราฟ: ลากสาย t เข้าใช้งานตรงๆ ได้ทันทีโดยไม่ต้องผ่านโหนดคำนวณ',
    p0: [0, 0], p1: [0.33, 0.33], p2: [0.66, 0.66], p3: [1, 1],
    expr: 't',
    badge: 'y = t',
    nodeType: 'linear'
  },
  {
    id: 'ease-in-quad',
    cat: 'easing',
    name: 'Ease In (Quad)',
    type: 'bezier',
    desc: 'เริ่มช้าแล้วเร่งความเร็ว เหมาะกับจรวดพุ่ง หรือวัตถุดูดเข้าหาหลุมดำ',
    tip: 'ในกราฟ: ต่อ t เข้า Power Node กำหนด Exp = 2.0',
    p0: [0, 0], p1: [0.5, 0.0], p2: [0.75, 0.5], p3: [1, 1],
    expr: 'pow(t, 2.0)',
    badge: 'pow(t, 2)',
    nodeType: 'power',
    nodeParam: 2.0
  },
  {
    id: 'ease-out-quad',
    cat: 'easing',
    name: 'Ease Out (Quad)',
    type: 'bezier',
    desc: 'ระเบิดพุ่งเร็วในพริบตา แล้วค่อยๆ ชะลอความเร็วนุ่มนวล',
    tip: 'ในกราฟ: นำ t เข้า One Minus -> Power (2.0) -> One Minus',
    p0: [0, 0], p1: [0.25, 0.75], p2: [0.5, 1.0], p3: [1, 1],
    expr: '1.0 - pow(1.0 - t, 2.0)',
    badge: '1 - (1-t)²',
    nodeType: 'ease-out',
    nodeParam: 2.0
  },
  {
    id: 'ease-in-cubic',
    cat: 'easing',
    name: 'Ease In (Cubic)',
    type: 'bezier',
    desc: 'หน่วงช่วงแรกนานขึ้น แล้วพุ่งตัวทะยานแรงกว่า Quad',
    tip: 'ในกราฟ: ต่อ t เข้า Power Node กำหนด Exp = 3.0',
    p0: [0, 0], p1: [0.55, 0.055], p2: [0.675, 0.19], p3: [1, 1],
    expr: 'pow(t, 3.0)',
    badge: 'pow(t, 3)',
    nodeType: 'power',
    nodeParam: 3.0
  },
  {
    id: 'ease-out-cubic',
    cat: 'easing',
    name: 'Ease Out (Cubic)',
    type: 'bezier',
    desc: 'กระแทกเปิดตัวแรงมากใน 15% แรก เหมาะกับสะเก็ดประกายไฟ',
    tip: 'ในกราฟ: t -> One Minus -> Power (3.0) -> One Minus',
    p0: [0, 0], p1: [0.215, 0.61], p2: [0.355, 1.0], p3: [1, 1],
    expr: '1.0 - pow(1.0 - t, 3.0)',
    badge: '1 - (1-t)³',
    nodeType: 'ease-out',
    nodeParam: 3.0
  },
  {
    id: 'smoothstep',
    cat: 'easing',
    name: 'Smoothstep (Hermite)',
    type: 'bezier',
    desc: 'ช้าหัว-ท้าย นุ่มนวลตรงกลาง ลดรอยกระตุกของแอนิเมชัน',
    tip: 'ในกราฟ: ใช้โหนด Smoothstep Node ใน Unity หรือ Smoothstep ใน UE ได้โดยตรง',
    p0: [0, 0], p1: [0.42, 0.0], p2: [0.58, 1.0], p3: [1, 1],
    expr: 'smoothstep(0.0, 1.0, t)',
    badge: 'smoothstep',
    nodeType: 'smoothstep',
    min: 0.0, max: 1.0
  },
  {
    id: 'smootherstep',
    cat: 'easing',
    name: 'Smootherstep (Perlin)',
    type: 'expression',
    desc: 'ความนุ่มนวลสูงสุด (2nd derivative = 0) สลาย Fog / Mist',
    tip: 'ในกราฟ: สร้าง Custom Function หรือร้อยเรียงสมการ 6t⁵-15t⁴+10t³',
    expr: 't * t * t * (t * (t * 6.0 - 15.0) + 10.0)',
    p0: [0, 0], p1: [0.4, 0.0], p2: [0.6, 1.0], p3: [1, 1],
    badge: '6t⁵-15t⁴+10t³',
    nodeType: 'custom'
  },
  {
    id: 'expo-ramp',
    cat: 'easing',
    name: 'Exponential Charge',
    type: 'expression',
    desc: 'กักเก็บพลังงานเงียบๆ แล้วสว่างวาบสุดขีดตอนท้าย',
    tip: 'ในกราฟ: ต่อ t เข้า Multiply(4.0) -> Exponential -> Subtract(1) -> Divide',
    expr: '(exp(4.0 * t) - 1.0) / (exp(4.0) - 1.0)',
    p0: [0, 0], p1: [0.8, 0.1], p2: [0.95, 0.5], p3: [1, 1],
    badge: 'exp(4t) ramp',
    nodeType: 'custom'
  },

  // ── 2. Flash & Glow (0 → 1 → 0) ──
  {
    id: 'parabolic-bell',
    cat: 'flash',
    name: 'Parabolic Glow (Bell)',
    type: 'expression',
    desc: 'เส้นโค้งพาราโบลาสว่างขึ้นแล้วมืดลงแบบสมมาตรที่กึ่งกลาง',
    tip: 'ในกราฟ: t -> One Minus (1-t) -> Multiply กับ t -> Multiply ด้วย 4.0',
    expr: '4.0 * t * (1.0 - t)',
    p0: [0, 0], p1: [0.25, 0.95], p2: [0.75, 0.95], p3: [1, 0],
    badge: '4·t·(1-t)',
    nodeType: 'bell'
  },
  {
    id: 'attack-decay-fast',
    cat: 'flash',
    name: 'Muzzle Flash (วาบทันที)',
    type: 'expression',
    desc: 'วาบขึ้น 100% ใน 0.08s แล้วค่อยๆ ดับลงช้าๆ',
    tip: 'ในกราฟ: แยกสาย Attack (Divide 0.08) และ Decay (One Minus / 0.92) แล้วรวบด้วย Min Node',
    expr: 'min(saturate(t / 0.08), saturate((1.0 - t) / 0.92))',
    p0: [0, 0], p1: [0.03, 1.0], p2: [0.3, 0.7], p3: [1, 0],
    badge: 'flash 0.08s',
    nodeType: 'attack-decay'
  },
  {
    id: 'sine-pulse-half',
    cat: 'flash',
    name: 'Sine Ping-Pong',
    type: 'expression',
    desc: 'ยอดคลื่นไซน์ครึ่งลูก นุ่มนวลกว่าพาราโบลา ไม่มีเหลี่ยมคม',
    tip: 'ในกราฟ: ต่อ t -> Multiply (3.14159) -> Sine Node (ใน UE ปรับ Period เป็น 1.0)',
    expr: 'sin(t * 3.14159)',
    p0: [0, 0], p1: [0.2, 0.8], p2: [0.8, 0.8], p3: [1, 0],
    badge: 'sin(π·t)',
    nodeType: 'sine-half'
  },
  {
    id: 'lightning-strobe',
    cat: 'flash',
    name: 'Lightning Double Flash',
    type: 'expression',
    desc: 'ฟ้าผ่ากระพริบเบิ้ล 2 ครั้ง (วาบแรกสั้น วาบสองสว่างกว้าง)',
    tip: 'ในกราฟ: t -> Sine (Freq 12.5) -> Saturate -> Multiply กับ (1-t)',
    expr: 'saturate(sin(t * 12.56) * 1.5) * (1.0 - t)',
    p0: [0, 0], p1: [0.15, 1.0], p2: [0.45, 0.8], p3: [1, 0],
    badge: 'dual flash',
    nodeType: 'custom'
  },

  // ── 3. Physics & Impact & Overshoot ──
  {
    id: 'anticipation-dip',
    cat: 'physics',
    name: 'Anticipation (ง้างถอยหลัง)',
    type: 'bezier',
    desc: 'ยุบตัวต่ำกว่า 0 สะสมแรง ก่อนดีดพุ่งไปข้างหน้า',
    tip: 'ในกราฟ: ใช้ Bézier Custom Function หรือ Power Node ประกอบ',
    p0: [0, 0], p1: [0.35, -0.28], p2: [0.45, 1.05], p3: [1, 1],
    expr: 'pow(t, 2.0) * (3.5 * t - 2.5)',
    badge: 'dip -0.28',
    nodeType: 'bezier-custom'
  },
  {
    id: 'overshoot-backout',
    cat: 'physics',
    name: 'Back Out (เด้งเกิน)',
    type: 'bezier',
    desc: 'พุ่งทะลุ 1.0 ไปถึง 1.25 แล้วดึงกลับมาหยุดอย่างหนักแน่น',
    tip: 'ในกราฟ: ใช้ Cubic Bézier Evaluator หรือสมการ Back-Out Polynomial',
    p0: [0, 0], p1: [0.34, 1.45], p2: [0.64, 1.0], p3: [1, 1],
    expr: '1.0 + 2.70158 * pow(t - 1.0, 3.0) + 1.70158 * pow(t - 1.0, 2.0)',
    badge: 'overshoot 1.25',
    nodeType: 'bezier-custom'
  },
  {
    id: 'elastic-bounce',
    cat: 'physics',
    name: 'Elastic Settle (ดีดดึ๋ง)',
    type: 'expression',
    desc: 'สปริงเด้งสั่นหลายรอบก่อนหยุดนิ่ง เหมาะกับเมือกสไลม์',
    tip: 'ในกราฟ: 1.0 - (Exp(-6t) * Cos(18.84t))',
    expr: '1.0 - exp(-6.0 * t) * cos(t * 18.84)',
    p0: [0, 0], p1: [0.2, 1.3], p2: [0.5, 0.9], p3: [1, 1],
    badge: 'damped spring',
    nodeType: 'custom'
  },
  {
    id: 'heavy-slam-impact',
    cat: 'physics',
    name: 'Heavy Slam (กระแทกพื้นสั่น)',
    type: 'expression',
    desc: 'กระแทกสูงสุดทันที t=0 แล้วสั่นสะเทือนหน่วงเร็ว',
    tip: 'ในกราฟ: Screen Shake หรือคลื่นสะเทือนอุกกาบาต',
    expr: 'exp(-5.0 * t) * cos(t * 25.13)',
    p0: [0, 1], p1: [0.1, -0.4], p2: [0.3, 0.3], p3: [1, 0],
    badge: 'impact wobble',
    nodeType: 'custom'
  },

  // ── 4. Loops & Oscillations ──
  {
    id: 'sine-wave-cycle',
    cat: 'oscillation',
    name: 'Sine Wave Cycle (0-1-0)',
    type: 'expression',
    desc: 'คลื่นลูปสมบูรณ์ 1 รอบ เริ่มจาก 0.5 วิ่งไป 1 ลงไป 0 แล้วกลับมา 0.5',
    tip: 'ในกราฟ: t -> Multiply(6.283) -> Sine -> Multiply(0.5) -> Add(0.5)',
    expr: 'sin(t * 6.28318) * 0.5 + 0.5',
    p0: [0, 0.5], p1: [0.25, 1.0], p2: [0.75, 0.0], p3: [1, 0.5],
    badge: 'sin(2π·t)',
    nodeType: 'sine-cycle'
  },
  {
    id: 'flicker-torch',
    cat: 'oscillation',
    name: 'Torch Flicker (เปลวไฟกระพริบ)',
    type: 'expression',
    desc: 'การสั่นไหวหลายความถี่ ผสานการค่อยๆ ดับช่วงท้าย',
    tip: 'ในกราฟ: ใช้ Noise Node หรือผสม Sine 2 ความถี่',
    expr: 'saturate(0.65 + 0.35 * sin(t * 31.4) * cos(t * 12.5)) * (1.0 - t * 0.5)',
    p0: [0, 0.8], p1: [0.3, 1.0], p2: [0.7, 0.4], p3: [1, 0.5],
    badge: 'flicker noise',
    nodeType: 'custom'
  },
  {
    id: 'multi-hit-sawtooth',
    cat: 'oscillation',
    name: 'Multi-Hit Sawtooth (คอมโบ 3 จังหวะ)',
    type: 'expression',
    desc: 'ฟันดาบ 3 ฮิตต่อเนื่อง เพิ่มสเกลหรือดาเมจเป็นชุด',
    tip: 'ในกราฟ: t -> Multiply(3.0) -> Fraction (Frac) Node',
    expr: 'frac(t * 3.0)',
    p0: [0, 0], p1: [0.33, 1.0], p2: [0.66, 0.0], p3: [1, 1.0],
    badge: 'frac(3t)',
    nodeType: 'frac-saw'
  },
  {
    id: 'heartbeat-double-pulse',
    cat: 'oscillation',
    name: 'Heartbeat (เต้นตุบๆ 2 จังหวะ)',
    type: 'expression',
    desc: 'จังหวะหัวใจเต้น บีบ-คลาย 2 สเต็ปอย่างเป็นธรรมชาติ',
    tip: 'ในกราฟ: รวม Sine Power Pulse 2 ลูกที่มี Offset เวลา',
    expr: 'pow(saturate(sin(t * 6.283)), 8.0) + 0.5 * pow(saturate(sin((t - 0.15) * 6.283)), 8.0)',
    p0: [0, 0], p1: [0.2, 1.0], p2: [0.4, 0.5], p3: [1, 0],
    badge: 'pulse bi-phase',
    nodeType: 'custom'
  },

  // ── 5. Stagger & Steps ──
  {
    id: 'subrange-phase1',
    cat: 'stagger',
    name: 'Phase 1: Delay Start (0.0-0.4)',
    type: 'expression',
    desc: 'ทำงานจบใน 40% แรก เพื่อเปิดทางให้เอฟเฟกต์เฟส 2 ทำงานต่อ',
    tip: 'ในกราฟ: Remap Node [In: 0.0-0.4, Out: 0.0-1.0] หรือ t / 0.4 แล้ว Clamp',
    expr: 'saturate(t / 0.4)',
    p0: [0, 0], p1: [0.15, 0.0], p2: [0.35, 1.0], p3: [0.4, 1.0],
    badge: 'remap [0, 0.4]',
    nodeType: 'remap',
    min: 0.0, max: 0.4
  },
  {
    id: 'subrange-phase2',
    cat: 'stagger',
    name: 'Phase 2: Mid Bloom (0.3-0.7)',
    type: 'expression',
    desc: 'รอเวลาจนถึง 30% จึงเริ่มขยายตัว และเต็มที่ที่ 70%',
    tip: 'ในกราฟ: Smoothstep Node (InMin: 0.3, InMax: 0.7)',
    expr: 'smoothstep(0.3, 0.7, t)',
    p0: [0, 0], p1: [0.3, 0.0], p2: [0.7, 1.0], p3: [1, 1],
    badge: 'remap [0.3, 0.7]',
    nodeType: 'smoothstep',
    min: 0.3, max: 0.7
  },
  {
    id: 'subrange-phase3',
    cat: 'stagger',
    name: 'Phase 3: Late Dissolve (0.6-1.0)',
    type: 'expression',
    desc: 'อยู่นิ่งๆ จนถึง 60% ของไทม์ไลน์ แล้วค่อยเริ่มสลายตัว',
    tip: 'ในกราฟ: Remap Node [InMin: 0.6, InMax: 1.0] หรือ (t - 0.6)/0.4 -> Saturate',
    expr: 'saturate((t - 0.6) / 0.4)',
    p0: [0.6, 0], p1: [0.7, 0.0], p2: [0.9, 1.0], p3: [1, 1],
    badge: 'remap [0.6, 1.0]',
    nodeType: 'remap',
    min: 0.6, max: 1.0
  },
  {
    id: 'stepped-toon-posterize',
    cat: 'stagger',
    name: 'Anime Stepped (5 Steps)',
    type: 'expression',
    desc: 'แบ่งจังหวะออกเป็น 5 สเต็ปคมชัด สไตล์ Genshin / Anime VFX',
    tip: 'ในกราฟ: t -> Multiply(5.0) -> Floor -> Divide(4.0)',
    expr: 'floor(t * 5.0) / 4.0',
    p0: [0, 0], p1: [0.2, 0.25], p2: [0.6, 0.75], p3: [1, 1],
    badge: 'floor(5t) / 4',
    nodeType: 'stepped',
    steps: 5
  }
];

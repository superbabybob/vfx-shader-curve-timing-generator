# VFX Shader Curve & Timing Generator — คู่มือการใช้งานและรายละเอียดฟังก์ชันทั้งหมด

เว็บแอปพลิเคชันสำหรับออกแบบ, ปรับแต่ง, จำลอง (Simulation) และแปลงเส้นโค้งเวลา (**Timing & Easing Curves**) ในงาน **Real-time VFX** ไปเป็น **Native Shader Graph Math Nodes** (Unity Shader Graph / Unreal Engine Material Graph) และโค้ดเชเดอร์มาตรฐาน (**HLSL / GLSL / Unity Function / CSS**) โดยไม่ต้องพึ่งพาโค้ด Custom Function สีดำ (Black-box node)

---

## สารบัญ
1. [ภาพรวมของสถาปัตยกรรม (Architecture Overview)](#1-ภาพรวมของสถาปัตยกรรม)
2. [โหมดการทำงานหลัก (Main Operation Modes)](#2-โหมดการทำงานหลัก)
   - [2.1 โหมด Bézier Handles](#21-โหมด-bézier-handles)
   - [2.2 โหมด Custom Expression & Parameter Tuner](#22-โหมด-custom-expression--parameter-tuner)
3. [คลังสูตรสำเร็จรูป VFX Curve Presets (48 สูตร)](#3-คลังสูตรสำเร็จรูป-vfx-curve-presets-48-สูตร)
   - [หมวด 1: Polynomial & Power Curves](#หมวด-1-polynomial--power-curves-พหุนามและยกกำลัง)
   - [หมวด 2: Hermite & Smoothstep Interpolations](#หมวด-2-hermite--smoothstep-interpolations)
   - [หมวด 3: Trigonometric Waves](#หมวด-3-trigonometric-waves-ตรีโกณมิติ)
   - [หมวด 4: Exponential & Damped Decay](#หมวด-4-exponential--damped-decay-เอกซ์โพเนนเชียลและการหน่วงสลาย)
   - [หมวด 5: Piecewise, Saturate & Steps](#หมวด-5-piecewise-saturate--steps-สมการแยกช่วงและขั้นบันได)
4. [หน้าต่างจำลองอนุภาคแบบเรียลไทม์ (Particle VFX Live Simulation)](#4-หน้าต่างจำลองอนุภาคแบบเรียลไทม์)
   - [โหมดการเคลื่อนไหว (Motion Modes)](#โหมดการเคลื่อนไหว-motion-modes)
   - [ตัวควบคุมการจำลอง (Simulation Controls)](#ตัวควบคุมการจำลอง-simulation-controls)
5. [ระบบแปลงเป็น Universal Math Node Graph Visualizer](#5-ระบบแปลงเป็น-universal-math-node-graph-visualizer)
   - [การจัดเลย์เอาต์อัตโนมัติ (Sugiyama DAG Layered Layout)](#การจัดเลย์เอาต์อัตโนมัติ-sugiyama-dag-layered-layout)
   - [Pan & Zoom Canvas](#การควบคุมมุมมอง-pan--zoom)
6. [ระบบส่งออกโค้ดเชเดอร์ (Code Generator & Exports)](#6-ระบบส่งออกโค้ดเชเดอร์-code-generator--exports)
7. [การทำงานร่วมกันระหว่างโหมดและระบบสลับปุ่มอัจฉริยะ (Smart Mode Safety)](#7-การทำงานร่วมกันระหว่างโหมดและระบบสลับปุ่มอัจฉริยะ)

---

## 1. ภาพรวมของสถาปัตยกรรม

ระบบถูกสร้างขึ้นด้วยเทคโนโลยีเว็บมาตรฐาน (**HTML5 Canvas, SVG, Vanilla ES Modules**) ตามแบบฉบับ **Tempo Workbench UI Design System** (โครงสร้างสีโทนดาร์กเข้ม Layered Depth, ชัดเจน อ่านง่าย ไม่สะท้อนแสงแยงตา):

- **State Module (`src/js/state.js`)**: ศูนย์รวมสถานะส่วนกลาง รองรับ State ข้อมูลเส้นโค้ง, ค่าพิกัด Handles, สมการคณิตศาสตร์, พารามิเตอร์จำลองอนุภาค และโหมดที่กำลังทำงาน
- **Math Engine (`src/js/math-engine.js`)**: ประเมินสูตรพรีเซ็ตโดยตรง และ Bézier แบบ X คงที่ซึ่งใช้ u=t โดยไม่ต้องหา root หรือวนลูป
- **Expression Graph Builder (`src/js/expression-graph-builder.js`)**: ตัวแปลงสมการคณิตศาสตร์ (Tokenizer $\rightarrow$ AST Parser $\rightarrow$ Native Shader Nodes) โดยสลายฟังก์ชันทางคณิตศาสตร์ออกมาเป็นโหนดพื้นฐานจริง
- **Renderers (`src/js/renderers/`)**:
  - `curve-canvas.js`: วาดเส้นโค้ง, สเกลตารางิกัด $X=t \in [0, 1]$, $Y \in [-0.4, 1.6]$, จุด Handles $P_0, P_1, P_2, P_3$ และลูกบอลเรืองแสงตามหัวอ่านเวลา Scrubber
  - `particle-sim.js`: ระบบฟิสิกส์จำลองการตอบสนองของอนุภาคต่อเส้นโค้ง timing $f(t)$ ในรูปแบบต่างๆ
  - `node-graph.js`: เรนเดอร์แผนผังโหนดด้วย SVG พร้อมสายเชื่อมต่อเรืองแสง (Wires glow), พอร์ต Input/Output และฟิลเตอร์เงา 3D
- **Code Generator (`src/js/code-gen.js`)**: แปลงเส้นโค้งและพารามิเตอร์เป็นโค้ดที่สามารถคัดลอกไปวางใน Engine ได้ทันที

---

## 2. โหมดการทำงานหลัก

ผู้ใช้สามารถสลับโหมดการทำงานได้จากแถบเมนูด้านบนขวา:

### 2.1 โหมด Bézier Handles
- **หน้าที่**: ควบคุมเส้นโค้งด้วยจุดควบคุม **Cubic Bézier Curve** 4 จุด ($P_0, P_1, P_2, P_3$)
- **การปฏิสัมพันธ์**:
  - ลากแนวตั้งเพื่อปรับ Y ของจุดจับ $P_1$ (สีน้ำเงิน Action Blue) และ $P_2$ (สีม่วง Accent Purple) บนผืนผ้าใบ `curveCanvas` ได้อย่างอิสระ
  - ป้อนค่า Y โดยตรงได้ ส่วน X ล็อกที่ 0, ⅓, ⅔, 1 เพื่อคำนวณพหุนามตรงสำหรับ realtime shader
- **การสลายสูตร**: แปลงเส้นโค้ง Bézier ออกมาเป็นพหุนาม Bernstein:
  $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$
  Preview ใช้โครงสร้าง Horner คงที่ 6 โหนดคำนวณและค่าคงที่ A/B/C/D เพื่อให้ลากได้ต่อเนื่อง โค้ดส่งออกจะลดพจน์ที่ไม่จำเป็นตามค่า Y ที่จูนไว้

### 2.2 โหมด Custom Expression & Parameter Tuner
- **หน้าที่**: อนุญาตให้พิมพ์สูตรคณิตศาสตร์ใดๆ ก็ตามที่ใช้ใน Shader เช่น:
  ```hlsl
  smoothstep(0.0, 1.0, t)
  pow(t, 2.5) * (1.0 - t)
  sin(t * TAU * 1) * 0.5 + 0.5
  min(saturate(t / 0.1), saturate((1.0 - t) / 0.9))
  ```
- **รองรับฟังก์ชันคณิตศาสตร์สากล**:
  `pow`, `sqrt`, `smoothstep`, `sin`, `cos`, `tan`, `abs`, `exp`, `log`, `min`, `max`, `saturate`, `clamp`, `frac`, `floor`, `ceil`, `sign` และค่าคงที่ `PI`, `TAU`/`TWO_PI`, `PHI`, `E`, `SQRT2`, `HALF_PI`, `FOUR_PI`, `INV_PI`, `INV_TWO_PI`, `INV_FOUR_PI`, `INV_SQRT2`, `PI_DIV_FOUR`, `LOG2_E`
- **Dynamic Parameter Tuner (ปรับแต่งค่าสดผ่าน Slider)**:
  - ระบบจะวิเคราะห์ตัวเลขคงที่ในสมการ เช่น `smoothstep(0.0, 1.0, t)` หรือตัวแปรระบุชื่อ เช่น `pow(t, exp)` แล้ว Expose ออกมาเป็น **Slider ควบคุม** โดยอัตโนมัติ
  - เมื่อผู้ใช้เลื่อน Slider:
    1. กราฟเส้นโค้งปรับรูปทรงทันทีแบบ Real-time
    2. แอนิเมชันอนุภาคเปลี่ยนจังหวะทันที
    3. แผนผัง Node Graph แสดงสูตรที่ปรับให้เบาตามค่าที่จูนไว้ และแชร์ผลคำนวณที่ซ้ำกัน
    4. โค้ดส่งออกใช้ค่าที่จูนเป็นค่าคงที่โดยค่าเริ่มต้น เปิด Runtime parameters เมื่อต้องการเปลี่ยนค่าภายใน engine

---

## 3. คลังสูตรสำเร็จรูป VFX Curve Presets (48 สูตร)

คลังสูตรถูกจัดกลุ่มอย่างเคร่งครัดตาม **หมวดหมู่สมการคณิตศาสตร์ (Mathematical Families)** มีระบบแถบค้นหา (Search Bar) และปุ่มกรองหมวดหมู่ (Category Pills):

### หมวด 1: Polynomial & Power Curves (พหุนามและยกกำลัง)
1. **Linear ($y = t$)**: ค่าแปรผันเชิงเส้นตรงคงที่ เหมาะกับหมุน Loop หรือเลื่อน UV Scroll
2. **Ease In Quad ($pow(t, 2)$)**: เริ่มต้นช้าแล้วเร่งความเร็วพุ่งตัว
3. **Ease Out Quad ($1 - (1-t)^2$)**: ระเบิดตัวเร็วในพริบตาแล้วค่อยๆ ชะลอความเร็ว
4. **Ease In Cubic ($pow(t, 3)$)**: หน่วงช่วงต้นนานขึ้น และพุ่งตัวเร็วกว่า Quad
5. **Ease Out Cubic ($1 - (1-t)^3$)**: กระแทกเปิดตัวรุนแรงใน 15% แรก เหมาะกับสะเก็ดไฟ (Sparks)
6. **Parabolic Bell ($4 \cdot t \cdot (1-t)$)**: เส้นโค้งพาราโบลาระฆังคว่ำ สว่างสูงสุดที่ $t=0.5$ แล้วดับลงสมมาตร
7. **Anticipation Dip ($pow(t, 2) \cdot (3.5t - 2.5)$)**: พหุนามสะสมแรง ยุบตัวต่ำกว่า $0$ เล็กน้อยก่อนดีดตัวไปข้างหน้า
8. **Back Out Overshoot ($1 + 2.7(t-1)^3 + 1.7(t-1)^2$)**: พุ่งทะลุเกิน $1.0$ (เด้งล้น) แล้วดึงกลับมาหยุดนิ่ง

### หมวด 2: Hermite & Smoothstep Interpolations
9. **Smoothstep Hermite ($smoothstep(0, 1, t)$)**: การแทรกสอดแบบ Hermite ($3t^2 - 2t^3$) นุ่มหัว-ท้าย ลดรอยกระตุก
10. **Smootherstep Ken Perlin ($6t^5 - 15t^4 + 10t^3$)**: ความนุ่มนวลระดับอนุพันธ์ขั้นสองเท่ากับ $0$ เหมาะกับการสลายหมอกควัน
11. **Mid Bloom Remap ($smoothstep(0.3, 0.7, t)$)**: ชะลอจนถึง 30% จึงเริ่มขยายตัว และคงที่เมื่อถึง 70%

### หมวด 3: Trigonometric Waves (ตรีโกณมิติ)
12. **Sine Half Pulse ($sin(\pi \cdot t)$)**: ยอดคลื่นไซน์ครึ่งลูก นุ่มนวล กลมกล่อม ไร้เหลี่ยมคม
13. **Sine Cycle 0-1-0 ($sin(2\pi \cdot t) \cdot 0.5 + 0.5$)**: คลื่นลูปไซน์ครบ 1 รอบสมบูรณ์
14. **Lightning Double Flash ($saturate(sin(2\pi\cdot 2t) \cdot 1.5) \cdot (1-t)$)**: ฟ้าผ่าวาบเบิ้ล 2 ครั้งซ้อน
15. **Heartbeat Double Pulse ($sin^8$ Bi-Phase)**: จังหวะหัวใจเต้น บีบ-คลาย 2 สเต็ปอย่างเป็นธรรมชาติ

### หมวด 4: Exponential & Damped Decay (เอกซ์โพเนนเชียลและการหน่วงสลาย)
16. **Exponential Charge ($(e^{4t}-1)/(e^4-1)$)**: กักเก็บพลังงานเงียบๆ แล้วระเบิดสว่างจ้าสุดขีดตอนท้าย
17. **Elastic Settle Spring ($1 - e^{-6t} \cdot cos(2\pi\cdot 3t)$)**: การสั่นสะเทือนแบบสปริงหน่วง ดึ๋งหลายรอบก่อนหยุด
18. **Heavy Slam Impact ($e^{-5t} \cdot cos(2\pi\cdot 4t)$)**: แรงกระแทกสูงสดทันทีที่ $t=0$ แล้วสั่นสะเทือนสลายตัวเร็ว
19. **Torch Flicker Noise**: จำลองการสั่นไหวของเปลวไฟด้วยการผสมผสานหลายความถี่

### หมวด 5: Piecewise, Saturate & Steps (สมการแยกช่วงและขั้นบันได)
20. **Bilinear Min Clamp Flash ($min(\frac{t}{0.08}, \frac{1-t}{0.92})$)**: Muzzle Flash วาบสูงสุดใน $0.08$ วินาที แล้วค่อยๆ ดับ
21. **Linear Remap Phase 1 ($saturate(\frac{t}{0.4})$)**: ทำงานเสร็จสิ้นในช่วง 40% แรกของไทม์ไลน์
22. **Offset Linear Remap Phase 3 ($saturate(\frac{t-0.6}{0.4})$)**: อยู่นิ่งๆ จนถึง 60% แล้วจึงค่อยๆ สลายตัว
23. **Sawtooth Fraction ($frac(3t)$)**: คลื่นฟันปลา 3 จังหวะต่อเนื่อง สำหรับคอมโบฟันดาบ 3 ฮิต
24. **Stepped Anime ($floor(5t) / 4$)**: กราฟขั้นบันได 5 สเต็ปคมชัด สไตล์อนิเมะและสไตล์เกนชิน

---

### สูตรเพิ่มเติม 25–48

ทุกสูตรใช้ Expression โดยตรง ไม่ใช้ Bézier solver; ค่าที่ปรับผ่าน slider ยังจำกัดทศนิยม 2 ตำแหน่ง

| Preset | กลุ่ม | ลักษณะ |
|---|---|---|
| Ease In (Quartic) | polynomial | หน่วงช่วงต้นมากขึ้นแล้วเร่งเข้าปลาย เหมาะกับการสะสมพลัง |
| Ease Out (Quartic) | polynomial | พุ่งออกเร็วแล้วค่อยหยุด เหมาะกับการขยาย shockwave |
| Ease In (Quintic) | polynomial | หน่วงนานแล้วเร่งแรงช่วงท้าย เหมาะกับจังหวะปล่อยพลัง |
| Ease Out (Quintic) | polynomial | ตอบสนองฉับไวและมีช่วงชะลอยาว เหมาะกับ impact scale |
| Early Pulse (พุ่งแล้วสลาย) | polynomial | พัลส์ยอดสูงสุดช่วงหนึ่งในสามแรก แล้วสลายอย่างนุ่ม |
| Late Pulse (สะสมแล้ววาบ) | polynomial | พัลส์ยอดสูงสุดช่วงสองในสามท้าย เหมาะกับ charge flash |
| Compact Bell (พัลส์แคบ) | polynomial | ระฆังหัวท้ายราบและยอดเด่น เหมาะกับแสงวาบหนึ่งจังหวะ |
| Smooth Flash Window | hermite | เปิดแสงนุ่มอย่างรวดเร็ว คงแสงไว้ก่อนค่อยดับ |
| Delayed Ignite (ติดไฟช่วงท้าย) | hermite | รอครึ่งแรกก่อนเร่งขึ้นและคงค่าสูงสุด เหมาะกับ delayed emission |
| Smooth Fade Out | hermite | เริ่มสว่างเต็มแล้วค่อยดับ โดยความชันหัวท้ายเป็นศูนย์ |
| Double Flash Window | hermite | แสงสองจังหวะแยกช่วงชัดเจน ปรับเวลาขึ้นลงแต่ละลูกได้ |
| Cosine Breathing (หายใจหนึ่งรอบ) | trig | เปิดและดับอย่างนุ่มตลอดหนึ่งรอบ เหมาะกับ aura pulse |
| Signed Sine Swing (แกว่งสองทิศ) | trig | แกว่งบวกแล้วลบหนึ่งรอบ ใช้กับ displacement หรือทิศทางการส่าย |
| Tapered Ripple (สั่นแล้วหยุด) | trig | สั่นสองรอบและลดแรงจนเป็นศูนย์ ใช้กับ ring หรือ shake |
| Rectified Sine Pulses | trig | คลื่นสามลูกที่เป็นบวกทั้งหมด เหมาะกับ repeated glow |
| Exponential Fade (ดับเร็ว) | exp | เริ่มเต็มแล้วลดเร็ว มีหางจางยาว เหมาะกับประกายและควัน |
| Impact Envelope (พัลส์กระแทก) | exp | ขึ้นเร็วถึงยอดแล้วลดแบบ exponential เหมาะกับ impact emission |
| Delayed Impact Envelope | exp | รอถึง 30% ก่อนเกิดพัลส์กระแทกและหางลดทอน |
| Triangle Pulse (พัลส์สามเหลี่ยม) | piecewise | พัลส์สมมาตรเส้นตรง ขึ้นลงคม ใช้โหนดพื้นฐาน |
| Triangle Pulse Train | piecewise | พัลส์สามเหลี่ยมสามจังหวะ ใช้ frac แทนฟังก์ชันคลื่น |
| Hard Gate Window (เปิด–ปิดทันที) | piecewise | เปิดค้างช่วงกลางแล้วตัดทันที เหมาะกับ toon flash |
| Flash Hold Decay | piecewise | เปิดเร็ว ค้างสว่าง แล้วลดช่วงท้าย เหมาะกับ muzzle flash |
| Normalized Staircase (0→1) | piecewise | เพิ่มทีละ 0.25 และจบที่ 1 เหมาะกับ stepped reveal |
| Reverse Sawtooth (ลดแล้วรีเซ็ต) | piecewise | ลดเป็นเส้นตรงแล้วรีเซ็ตสามรอบ เหมาะกับ looping dissolve |

## 4. หน้าต่างจำลองอนุภาคแบบเรียลไทม์ (Particle VFX Live Simulation)

ให้ผู้ใช้มองเห็นผลลัพธ์ของเส้นโค้ง Timing ทันทีในรูปแบบวิชวลเอฟเฟกต์ โดยไม่ต้องนำไปทดสอบใน Engine ก่อน:

### โหมดการเคลื่อนไหว (Motion Modes)
1. **Burst Radial**: อนุภาคกระจายตัวรอบทิศทางแบบ Radial 360 องศา (เหมาะกับระเบิด, ประกายไฟ)
2. **Left $\rightarrow$ Right (1P)**: อนุภาคเดี่ยววิ่งบนเส้นไม้บรรทัด 1 มิติ พร้อมรอยทาง (Motion Trail) เพื่อเช็คความเร่ง
3. **⚔️ Sword Slash**: ดาบพลังงานแสงฟาดฟัน พร้อมใบมีดและคลื่นดาบเรืองแสงไล่ระดับ 4 ชั้น (Glow Aura, Body Ribbon, Cutting Edge, Inner Highlight)

### ตัวควบคุมการจำลอง (Simulation Controls)
- **Play / Pause & Scrubber**: กดหยุดชั่วคราว หรือลากแทร็กไทม์ไลน์ $t \in [0, 1]$ ไป-มาเพื่อตรวจดูเฟรมต่อเฟรม
- **Particle Count**: เลือกจำนวนอนุภาคได้ระหว่าง 8, 12 หรือ 16 อนุภาค
- **Stagger Slider**: ปรับความเหลื่อมล้ำทางเวลา (Time Offset) ระหว่างอนุภาคแต่ละตัว
- **Checkboxes ช่องรับผลกระทบ**:
  - `Position`: นำค่า $y$ ไปควบคุมระยะทาง/ตำแหน่ง
  - `Scale`: นำค่า $y$ ไปควบคุมขนาดของอนุภาค
  - `Alpha`: นำค่า $y$ ไปควบคุมความโปร่งแสง (Opacity)

---

## 5. ระบบแปลงเป็น Universal Math Node Graph Visualizer

จุดเด่นสำคัญของเว็บนี้คือ **การแปลงสมการคณิตศาสตร์และเส้นโค้ง Bézier ให้กลายเป็น Native Math Nodes ของ Shader Graph โดยตรง**

### การจัดเลย์เอาต์อัตโนมัติ (Sugiyama DAG Layered Layout)
- ไม่มีการวางโหนดทับซ้อนกันแบบมั่วซั่ว
- ระบบคำนวณกราฟแบบ Directed Acyclic Graph (DAG) จัดกลุ่มโหนดออกเป็นคอลัมน์ลำดับชั้น (Columns by Dependency Level)
- จัดเรียงความสูงตามแนวแกน $Y$ อิงจากตำแหน่งเฉลี่ยของโหนดต้นทาง (Barycentric Sorting) ทำให้สายเชื่อมต่อเดินทางจากซ้ายไปขวาอย่างเป็นระเบียบสวยงาม

### การควบคุมมุมมอง (Pan & Zoom)
- **Pan**: คลิกเมาส์ค้างแล้วลากบนผืนผ้าใบ SVG เพื่อเลื่อนดูโครงข่ายโหนดทั้งหมด
- **Zoom**: เลื่อน Scroll Wheel เพื่อขยาย/ย่อขนาด (ตั้งแต่ 40% ถึง 250%)
- **Touch Gestures**: รองรับการลากด้วย 1 นิ้ว และ Pinch-to-zoom ด้วย 2 นิ้วบนสมาร์ทโฟนและแท็บเล็ต
- **ปุ่ม Reset View**: คืนค่าตำแหน่งมุมมองกลับมาที่จุดกึ่งกลางทันที

---

## 6. ระบบส่งออกโค้ดเชเดอร์ (Code Generator & Exports)

มีแท็บ Export โค้ดให้เลือกคัดลอกได้ด้วยคลิกเดียว (ปุ่ม Copy to Clipboard):

1. **Math Node Graph**: แสดงผังโหนด SVG แบบโต้ตอบได้
2. **HLSL / GLSL** (แยกแท็บสำหรับแต่ละภาษา):
   ฟังก์ชันเชเดอร์ภาษา HLSL/GLSL ที่ปรับให้เบา โดยค่าเริ่มต้นค่าที่จูนจะถูกใส่ในสูตรเป็นค่าคงที่ หากเปิด Runtime parameters จะรับพารามิเตอร์ เช่น:
   ```hlsl
   // HLSL / GLSL Custom Expression with Exposed Parameters
   float EvaluateVFXCurve(float t, float param1 /* = 0.70 */, float param2 /* = 1.00 */)
   {
       float val = smoothstep(param1, param2, t);
       return val;
   }
   ```
3. **Compact Math**:
   สมการบรรทัดเดียว สั้นกระชับ สำหรับนำไปแปะในฟังก์ชันคำนวณด่วน:
   ```hlsl
   // Parameters: param1=0.70, param2=1.00
   float y = smoothstep(param1, param2, t);
   ```
4. **Shader Function**:
   โค้ดรูปแบบเฉพาะสำหรับนำไปใส่ใน Custom Function Node ของ Unity Shader Graph
5. **CSS Animation**:
   ฟังก์ชัน `cubic-bezier(...)` หรือคอมเมนต์สมการ สำหรับนักพัฒนา Web VFX / UI Animation

---

## 7. การทำงานร่วมกันระหว่างโหมดและระบบสลับปุ่มอัจฉริยะ (Smart Mode Safety)

- **สมการที่ไม่รองรับ Bézier**:
  สมการบางชนิด (เช่น คลื่นไซน์วนลูป, ฟังก์ชันขั้นบันได, เอกซ์โพเนนเชียลดีดดึ๋ง) ไม่สามารถแทนที่ด้วยจุดควบคุม 4 จุดของ Cubic Bézier ได้อย่างถูกต้อง
- **Smart UI Hiding**:
  เมื่อผู้ใช้เลือกพรีเซ็ตในกลุ่มที่ไม่รองรับ Bézier ปุ่มแท็บ **"Bézier Handles" จะถูกซ่อนออกไปโดยอัตโนมัติ** เพื่อป้องกันความสับสน และระบบจะคงการซ่อนไว้แม้ผู้ใช้จะกดปุ่ม Plot Curve ซ้ำ
- **Seamless Parameter Reflection**:
  เมื่อปรับแต่งค่าในสไลเดอร์ กราฟใน Canvas, อณูของ Particle, ผังโหนดใน SVG และโค้ดส่งออกในแท็บทุกแท็บจะซิงค์ค่าตรงกัน โดยใช้ state เดียวกัน ใช้สูตรพหุนามตรงสำหรับ Bézier แบบ X คงที่ และอัปเดตภาพในเฟรมถัดไป


## 8. Realtime Shader Optimization

ทุกพรีเซ็ตเปิดในโหมด Expression โดยใช้สูตรตรง ไม่ผ่าน Bézier solver และไม่มีลูปใน shader ที่ส่งออกด้วยค่าตั้งต้น

- Bake ค่าที่จูนผ่านสไลเดอร์เป็นค่าคงที่ก่อนสร้างโค้ดส่งออก ส่วน preview ใช้ parameter nodes เพื่อให้เห็นการเชื่อมต่อ
- แทนกำลังจำนวนเต็มด้วยผลคูณที่แชร์กัน เช่น x⁸ ใช้ x² → x⁴ → x⁸ รวม 3 Multiply
- คำนวณนิพจน์ค่าคงที่ล่วงหน้า รวม exp(4) ในตัวหาร Exponential Charge
- เปลี่ยนการหารด้วยค่าคงที่เป็นการคูณ reciprocal และแชร์นิพจน์ที่ซ้ำกัน
- Ease Out Quad ใช้ t*(2-t); Back Out ใช้ t*(t*(2.7t-6.4)+4.7) ซึ่งเทียบเท่าสูตรเดิม
- min(saturate(a),saturate(b)) ลดเป็น saturate(min(a,b))
- คง sin/cos/exp ที่เป็นส่วนสำคัญของเอฟเฟกต์ ไม่ใช้สูตรประมาณที่เปลี่ยนลักษณะคลื่น

**Runtime parameters** ปิดโดยค่าเริ่มต้น เปิดเมื่อต้องการปรับค่าใน Unity/Unreal ขณะรันเท่านั้น การเปิดอาจทำให้ใช้ pow หรือ arithmetic เพิ่มขึ้นเพราะค่าบางตัวไม่เป็นค่าคงที่อีกต่อไป

**Bézier Handles** เป็นตัวแก้พหุนามแบบ Y-only โดย X ล็อกที่ 0, ⅓, ⅔, 1 ไม่มี X→u solver, subgraph หรือปุ่ม Expand ใน preview สามารถเลือกพรีเซ็ตที่รองรับแล้วเปิด Bézier Handles เพื่อปรับ Y ได้ การสลับกลับเป็น Expression ใช้สูตร Horner เดิม

สูตร custom ที่ผู้ใช้พิมพ์ `bezier(...)` เองยังรองรับ arbitrary X และต้องใช้ numerical solver กรณีนี้ไม่ใช่เส้นทางของพรีเซ็ตหรือ Bézier editor ปกติ

### จำนวน Math Operations หลัง bake สำหรับส่งออก (ค่าตั้งต้น, ไม่รวม Input/Output)

| Preset | Math Nodes |
|---|---:|
| Linear | 0 |
| Ease In Quad | 1 |
| Ease Out Quad | 2 |
| Ease In Cubic | 2 |
| Ease Out Cubic | 4 |
| Parabolic Bell | 3 |
| Anticipation Dip | 4 |
| Back Out | 5 |
| Smoothstep | 1 |
| Smootherstep | 7 |
| Bounded Smoothstep | 1 |
| Half Sine | 2 |
| Full Sine | 4 |
| Lightning Strobe | 6 |
| Torch Flicker | 11 |
| Heartbeat | 15 |
| Exponential Charge | 4 |
| Damped Spring | 6 |
| Damped Impact | 5 |
| Bilinear Flash | 5 |
| Linear Remap | 2 |
| Offset Remap | 3 |
| Sawtooth | 2 |
| Stepped | 3 |

จำนวนโหนดไม่เท่ากับต้นทุน GPU โดยตรง เช่น sin/exp และ Multiply มีต้นทุนต่างกัน และ shader compiler อาจลด arithmetic เพิ่มเติม

## การส่งออกและทดสอบ

- Unity Custom Function Node แบบ File: Function Name `EvaluateVFXCurve`, Precision Float และ input ตาม signature ในโค้ด
- HLSL/GLSL แยกแท็บ; GLSL ใช้ fract และ helper saturate เฉพาะภาษา
- Runtime parameters สำหรับ Bézier editor รับ coefficients A/B/C/D; แบบ bake ส่งค่าพหุนามตรง
- CSS cubic-bezier ใช้ได้เมื่อปลาย P0=(0,0), P3=(1,1); กรณีอื่นใช้คำอธิบายสูตร
- รัน `npm install`, `npm test`, `npm run test:browser` เพื่อทดสอบ Browser tests ใช้ Edge บน Windows หรือ Chromium (`npx playwright install chromium`) บนระบบอื่น
- ทดสอบ 48 พรีเซ็ต × 101 จุด: สูตรต้นทาง, preview, Native Graph และโค้ดส่งออกให้ผลตรงกัน รวมการคอมไพล์ GLSL จริงใน WebGL2
- ยังไม่ได้ทดสอบ shader ภายใน Unity/Unreal หรือวัดเวลา GPU บน target hardware

## Node graph preview

- เว้นช่องระหว่างโหนดและระหว่างแถวพอร์ต โดยแยก Output อยู่ด้านล่าง
- แสดงชื่อ operation ในหัวโหนด และค่าคงที่ที่พอร์ต เพื่อลดข้อความซ้ำ
- ตัวเลขใน preview ย่อให้มีทศนิยมไม่เกิน 2 ตำแหน่ง; วางเมาส์ที่ข้อความเพื่อดูค่าเต็ม การย่อไม่เปลี่ยนการคำนวณหรือ shader export
- มุมมองเริ่มต้นและ Reset View แสดงกราฟครบ รวม Input/Output; ใช้ Expand View เพื่อขยายเต็มจอ, Scroll เพื่อซูม และลากเพื่อเลื่อน กด Escape หรือ Close View เพื่อกลับ

- Node Graph แสดงแต่ละ slider เป็น Parameter Node เช่น `Param (param1)` พร้อมค่าปัจจุบัน และต่อสายไปยังพอร์ตที่ใช้ เช่น `Edge1 (param1)` แม้ปิด Runtime parameters
- ปรับ slider แล้วอัปเดตค่าในโหนดเดิม โดยคงตำแหน่งโหนดและสาย; การเปิด/ปิด Runtime parameters เปลี่ยนเฉพาะโค้ดส่งออก
- Preview แสดงโหนดตามสมการโดยตรงและคงพารามิเตอร์เป็น input จึงอาจแสดง Power/Divide และจำนวนโหนดต่างจาก shader export ที่ bake ค่าคงที่และลด operation แล้ว ทั้งสองวิธีให้ผลคำนวณตรงกัน

## Curve editor navigation

- ลากพื้นที่ว่างของกราฟด้วยเมาส์หรือนิ้วเพื่อเลื่อนมุมมอง (ลากที่ handle เพื่อแก้ค่า Y ตามเดิม)
- Scroll บนกราฟเพื่อซูมเข้า/ออกโดยยึดตำแหน่งเมาส์; กริดแสดงค่าตามช่วงที่มองเห็น
- Fit Curve ปรับมุมมองให้เห็นเส้นโค้งและจุด P0–P3 ทั้งหมด รวม handle ที่อยู่นอกกรอบ
- Reset View คืนมุมมองตั้งต้นโดยไม่เปลี่ยนเส้นโค้ง พารามิเตอร์ หรือ shader export; Reset (Linear) ยังคงใช้สำหรับรีเซ็ตเส้นโค้ง

- Power ใน preview แทนการเรียก `pow` หนึ่งครั้งโดยตรง เช่น `1 - pow(1-t,3)` มี Subtract → Power → Subtract พร้อม parameter nodes ไม่ขยายชุดตรวจเครื่องหมายและจำนวนเต็มในภาพ
- Preview เป็นกราฟของสมการ ไม่ใช่การแสดงทุก operation ของ shader ที่คอมไพล์: โค้ดส่งออกยังลด integer power เป็น Multiply เมื่อ bake และใช้ signed-power helper เฉพาะกรณีที่ฐานอาจติดลบ ผล preview ยังคงใช้นิยามเดียวกับโค้ดส่งออก (ฐานติดลบยกกำลังที่ไม่ใช่จำนวนเต็มให้ 0)

## Decimal precision in editing

- Slider ปรับขั้นละ 0.01; สมการที่โหลดหรือกด Plot Curve และค่า parameter ปัดให้มีทศนิยมไม่เกิน 2 ตำแหน่ง โดย preview และ export ใช้ค่า parameter เดียวกัน
- ช่อง Y ของ Bézier ปรับขั้นละ 0.01 และปัด input เป็น 2 ตำแหน่ง; ช่อง X ที่ล็อกแสดง 2 ตำแหน่ง แต่ค่าจริง ⅓ และ ⅔ คงเดิมเพื่อรักษา direct polynomial
- Node Graph แสดงค่าไม่เกิน 2 ตำแหน่ง การคำนวณ coefficients และ shader export คงความละเอียดของผลคำนวณ ไม่ปัดค่าระหว่างขั้นตอน

## Integer powers → Multiply

- เปิดตัวเลือกเพื่อปัด exponent ของ `pow` เป็นจำนวนเต็มที่ใกล้ที่สุด และสร้าง Multiply แทน Power ทั้ง graph preview และ shader export
- เช่น `pow(t,2.7)` ปัดเป็น `pow(t,3)` และคำนวณ t×t×t; slider ของ exponent ปรับขั้นละ 1 ขณะเปิดตัวเลือก ปิดแล้วปรับขั้นละ 0.01 อีกครั้ง แต่ไม่คืนค่าทศนิยมที่ปัดไปแล้ว
- แชร์กำลังย่อยเพื่อลดโหนด: x⁸ ใช้ x² → x⁴ → x⁸ รวม 3 Multiply; x⁰ = 1, x¹ = x, กำลังติดลบใช้ reciprocal
- Exponent ต้องเป็นค่าคงที่หรือ parameter โดยตรง (รองรับเครื่องหมายลบ) ถ้าขึ้นกับ t หรือเป็นนิพจน์อื่นยังใช้ Power ตามเดิม
- จำนวนครั้งการคูณกำหนดตอนส่งออก เลขกำลังจึงไม่เป็น runtime input; ปรับ exponent แล้วต้องส่งออกโค้ดใหม่ ส่วน parameter ที่ยังใช้ในฐานหรือส่วนอื่นยังเป็น runtime input ได้

## Standard constants

- ค่าคงที่มาตรฐานเป็น Constant Node ที่แชร์ใช้ร่วมกัน ไม่เป็น slider หรือ runtime argument และคงความแม่นยำเต็ม แม้ตัวเลขใน preview จะแสดงเพียง 2 ตำแหน่ง
- Presets ใช้ PI/TAU และจำนวนรอบ เช่น `sin(t * TAU * 1)` แทน slider ที่มีค่าเริ่มต้น 6.28318; จำนวนรอบยังเป็น parameter ที่ปรับได้
- ตัวเลขละเอียดตั้งแต่ 5 ตำแหน่งที่ตรงกับค่าคงที่ (เช่น 3.14159, 6.2831853) แปลงเป็นชื่อก่อนปัดทศนิยม ส่วน 3.14 และค่าที่จูนทั่วไปยังเป็น parameter
- HLSL/Unity/GLSL/Compact Math คงชื่อค่าคงที่ในสูตร โดย TAU ส่งออกเป็น TWO_PI ใช้ macro ของ engine ที่มีอยู่ และใช้ guarded fallback เฉพาะค่าที่ไม่มีนิยาม มีการรองรับ UNITY_PI/UNITY_TWO_PI แบบเก่าด้วย
- GLSL ไม่มี PI เป็น mathematical built-in ในตัวภาษา จึงแนบ fallback เพื่อให้โค้ด standalone คอมไพล์ได้ ทั้ง constants และ fallback เป็น compile-time constants
- Unity Constant Node รองรับ PI, TAU, PHI, E, SQRT2 ส่วนค่ามุมอื่นใช้ macro ในโค้ดหรือประกอบจาก PI ในกราฟตามต้องการ

อ้างอิง: [Unity Constant Node](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Constant-Node.html), [Unity ShaderLibrary Macros](https://github.com/Unity-Technologies/Graphics/blob/master/Packages/com.unity.render-pipelines.core/ShaderLibrary/Macros.hlsl), [GLSL ES specification: Built-in Constants](https://registry.khronos.org/OpenGL/specs/es/3.2/GLSL_ES_Specification_3.20.pdf)

- FOUR_PI แสดงเป็น Constant PI → Multiply (4) แทนโหนด FOUR_PI; code export ใช้ `PI * 4.0` เช่นเดียวกัน Preset Tapered Ripple แสดงสูตร `sin(PI * 4 * t)`

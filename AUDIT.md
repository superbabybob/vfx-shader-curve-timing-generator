# รายงานตรวจเทียบ DOCUMENTATION.md

ตรวจและแก้ไขวันที่ 7 ตุลาคม 2026

## บั๊กที่แก้แล้ว

- Bézier preview ใช้ X แต่ export/Node Graph เดิมคำนวณเฉพาะ Y: ใช้โปรแกรมคำนวณร่วม รวมการหา u และค่า P0 ครบทุกจุด
- พรีเซ็ต polynomial/Hermite เดิมใช้ Handles โดยประมาณ: เปลี่ยนเป็นตัวแทนสูตรที่ตรงกัน รวม Back Out และ Anticipation
- pow เดิมตัดฐานลบเป็นศูนย์ ทำให้ Back Out ผิด: รองรับกำลังจำนวนเต็มบนฐานลบ พร้อมโค้ด shader และโหนดที่สอดคล้องกัน
- sqrt/tan/log/sign ที่เอกสารระบุยังประเมินไม่ได้: รองรับครบ ใช้ AST แทน new Function และ cache AST
- Parser ยอมรับสูตรขาดวงเล็บ ข้ามอักขระผิด และปล่อยสูตรผิดผ่าน Plot: ตรวจ syntax และจำนวน argument ก่อนแก้ state
- Sliders ชื่อซ้ำ ค่าเดิมค้างจากพรีเซ็ตก่อน ตัวแปร exp ไม่ถูกตรวจพบ และค่าทศนิยมเริ่มต้นไม่ตรง slider: แยกชื่อ ลด stale state และรักษาค่าเริ่มต้น
- Clamp ถูกแปลงเป็น Saturate; constant arguments/output และ PI ไม่ตรงสูตร: สร้างพอร์ตและค่าคงที่ครบพร้อม precision
- Node layout ใช้ระยะคงที่ทำให้โหนดใหญ่ทับกัน: จัดตามขนาดจริง พร้อม viewBox, pan/zoom พิกัด SVG และ touch gestures
- Stagger inline handler อ้าง state ที่ไม่อยู่ใน global และไม่อัปเดตอนุภาค: เพิ่ม controller และ normalize phase ทุกช่วง
- Pause ยังเพิ่ม motion history, scrub ย้อนสร้างรอยทางผิด, Slash ไม่ใช้ Position checkbox และ Alpha มีค่าขั้นต่ำ: แก้การตอบสนอง
- เปลี่ยน input ไม่ล้าง selected preset และแก้ Y แล้วพิกัด X ถูกปัดทศนิยม: อัปเดตเฉพาะ field ที่แก้
- เปลี่ยนโหมด Expression ซ้ำทำสูตรเดิมหาย: รักษาสูตร/ค่าที่จูน และเพิ่มการแปลง Bézier ที่แก้ด้วยมืออย่างถูกต้อง
- HLSL/GLSL เดิมเป็นโค้ดเดียวและมี intrinsic ไม่ตรงภาษา: แยก output พร้อมแก้ float literals
- Unity export เดิมเป็น statements: ส่งออก named function สำหรับ File mode
- Clipboard fallback ไม่ทำงานเมื่อ API ไม่มีหรือถูกปฏิเสธ: ใช้ fallback ร่วมและแจ้งผลตามจริง
- Search empty state แทรก HTML จากข้อความค้นหา: ใช้ textContent
- ข้อความ UI แสดง markup LaTeX ที่ไม่ได้ render: เปลี่ยนเป็นข้อความอ่านได้

## ผลตรวจ

- `npm test`: ผ่าน 24 พรีเซ็ต × 101 ตัวอย่าง (2,424 จุด), เทียบสูตร/preview/Native Graph, ตรวจ layout และทิศทางสาย, ฟังก์ชันตามเอกสาร, syntax ผิด, parameters และ Bézier compact export
- `npm run test:browser`: ผ่าน desktop/mobile, count/stagger, เปลี่ยน preset/mode, slider, validation, pause/scrub, ทั้งหก motion modes, export tabs และ zoom/reset
- GLSL 27 กรณีผ่าน shader compiler ของ WebGL2 จริง
- ไม่พบ browser runtime error และไม่มี horizontal overflow ที่หน้าจอกว้าง 390px

## ขอบเขตการยืนยัน

ยังไม่ได้เปิด Unity/Unreal เพื่อนำ shader ไปคอมไพล์หรือประกอบ nodes ใน engine จริง การทดสอบยืนยันสูตรและโครงสร้าง Native Graph ในแอป และคอมไพล์ GLSL ในเบราว์เซอร์

Bézier ที่มี X ไม่เป็นเส้นตรงใช้ bisection 24 รอบ กราฟ Native Nodes จึงมีขนาดใหญ่กว่าพรีเซ็ต polynomial และอาจต้อง zoom เพื่ออ่านรายละเอียด ความคลาดเคลื่อนเลขทศนิยมระหว่าง CPU/GPU ยังคงมีตาม precision ของ engine


## ปรับลดโหนด Power ที่ไม่จำเป็น

สูตร Heartbeat เดิมถูกขยาย signed-power handling แม้ฐานผ่าน Saturate แล้ว แก้ให้พิสูจน์ฐานไม่ติดลบจากโครงสร้างสูตร (ไม่อิงค่า slider ปัจจุบัน) และใช้ Power โดยตรง พร้อมแชร์ subexpression ที่ซ้ำกัน สูตร Heartbeat จึงเหลือ Math Nodes 11 ตัว หรือรวม Input/Parameter/Output เป็น 19 ตัว ทดสอบจำนวนโหนด ผลคำนวณหลังปรับ exponent และกรณีฐานที่อาจติดลบซึ่งยังต้องใช้ signed-power handling แล้ว


## B?zier preview performance correction

A small X-handle edit previously switched from the linear-X shortcut to hundreds of unrolled bisection nodes and regenerated graph, SVG and shader strings on every pointer event. The default preview now shows the native X solver as a collapsed subgraph with an explicit expand/collapse control. Full expansion remains available without scaling the viewport down to an unreadable line. Model caching reuses the SVG during pan/zoom; drag updates are coalesced per frame, and hidden shader exports are generated lazily.

Regression checks cover collapsed versus expanded numerical parity, a compact preview under 30 nodes, expand/collapse behavior and unchanged DOM reuse. The browser measurement for the tested edited curve was 15 preview nodes with approximately 1.2 ms median render time over 12 edits (machine-dependent). This improves editor performance; it does not reduce the shader's 24 solver iterations.


## Stable graph templates for B?zier edits

Replaced the linear/nonlinear preview branch with a reusable fixed template. Both preview views retain named coordinate nodes and every Bernstein term; zero-valued handles no longer add/remove nodes. The X solver exists before editing. Changes update model coordinate values and existing SVG text in place, without regenerating wiring or layout.

Regression tests verify model/node identity, IDs, connections, positions and evaluated values across X edits (including exact/rounded 1/3) and negative/zero/positive Y values in both views. Browser tests verify DOM reuse and updated X-port text after edits. The compact template has 25 nodes and the tested updates measured approximately 0.1 ms median on this machine.


## Realtime preset pipeline (supersedes the prior inverse-Bézier preview approach)

All 24 presets now load their direct expression. The default shader and native graph bake slider values, fold constants, replace division by constants with reciprocal multiplication, share common expressions and integer-power multiplies, and reduce redundant saturation. Ease Out Quad and Back Out use algebraically equivalent shorter polynomials. No default preset export contains a loop, Bézier solver or generic pow helper.

The Bézier editor now locks X to 0, 1/3, 2/3, 1 and edits Y only. Its stable preview uses four precomputed coefficients and six Horner math nodes; exported constants simplify further. Removed inverse-solver preview/expand controls. Runtime parameters are opt-in, including A/B/C/D for the polynomial editor. Explicit user-authored `bezier(...)` expressions remain an advanced inverse-solver path.

Validation: 24 presets × 101 points compare original/direct formula, live preview, optimized native graph and generated shader math. Separate assertions check the algebraic rewrites against their original formulas, loop/helper-free default exports, fixed polynomial topology, all 24 preset UI transitions, slider text synchronization, optional runtime parameters and 27 actual GLSL shader compilations. No target-engine GPU timing claim is made.

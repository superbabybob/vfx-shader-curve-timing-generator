import {constantName,standardConstants,standardLiteralName} from './standard-constants.js';

/**
 * ═══════════════════════════════════════════════════════
 * Expression AST to Math Node Graph Generator
 * Parses custom math expressions (pow, smoothstep, sin,
 * cos, exp, saturate, clamp, frac, floor, +, -, *, /) into
 * actual connected Shader Math Nodes without "Custom Node".
 * ═══════════════════════════════════════════════════════
 */

// Token types
const TOKEN = {
  NUMBER: 'NUMBER',
  IDENT: 'IDENT',
  OP: 'OP',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA'
};

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const start = i;
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i + 1] || ''))) {
      const match = expr.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      i += match[0].length;
      tokens.push({ type: TOKEN.NUMBER, value: Number(match[0]), start, end: i });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i++];
      }
      tokens.push({ type: TOKEN.IDENT, value: ident, start, end: i });
      continue;
    }
    if (ch === '(') { tokens.push({ type: TOKEN.LPAREN, start, end: ++i }); continue; }
    if (ch === ')') { tokens.push({ type: TOKEN.RPAREN, start, end: ++i }); continue; }
    if (ch === ',') { tokens.push({ type: TOKEN.COMMA, start, end: ++i }); continue; }
    if (['+', '-', '*', '/', '^'].includes(ch)) {
      tokens.push({ type: TOKEN.OP, value: ch, start, end: ++i });
      continue;
    }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

// Recursive Descent Parser
class ExprParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  consume() { return this.tokens[this.pos++]; }

  parse() {
    const ast = this.parseAddSub();
    if (this.peek()) throw new Error("Unexpected token");
    return ast;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.peek() && this.peek().type === TOKEN.OP && ['+', '-'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (this.peek() && this.peek().type === TOKEN.OP && ['*', '/'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.peek() && this.peek().type === TOKEN.OP && ['+', '-'].includes(this.peek().value)) {
      const op = this.consume().value;
      const operand = this.parseUnary();
      if (op === '-') {
        if (operand.type === 'number') {
          return { type: 'number', value: -operand.value };
        }
        return { type: 'unary', op: '-', operand };
      }
      return operand;
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();
    if (!t) throw new Error('Expected expression');

    if (t.type === TOKEN.NUMBER) {
      this.consume();
      return { type: 'number', value: t.value };
    }

    if (t.type === TOKEN.LPAREN) {
      this.consume(); // (
      const expr = this.parseAddSub();
      if (this.peek()?.type !== TOKEN.RPAREN) throw new Error('Expected closing parenthesis');
      this.consume();
      return expr;
    }

    if (t.type === TOKEN.IDENT) {
      this.consume();
      const name = t.value;
      // Function call: ident ( args... )
      if (this.peek() && this.peek().type === TOKEN.LPAREN) {
        this.consume(); // (
        const args = [];
        if (!this.peek() || this.peek().type !== TOKEN.RPAREN) {
          while (true) {
            args.push(this.parseAddSub());
            if (this.peek() && this.peek().type === TOKEN.COMMA) {
              this.consume();
            } else {
              break;
            }
          }
        }
        if (this.peek()?.type !== TOKEN.RPAREN) throw new Error('Expected closing parenthesis');
      this.consume();
        if (!Object.hasOwn(mathFunctions,name) || args.length !== functionArity[name]) throw new Error(`Unknown function or wrong argument count: ${name}`);
        return { type: 'call', fn: name, args };
      }
      // Variable or constant
      const constant=constantName(name);
      if (constant) return {type:'number',value:standardConstants[constant],constantName:constant};
      return { type: 'variable', name };
    }

    throw new Error('Expected number, variable or function');
  }
}

/**
 * Detects numbers in expression and returns parameter definitions
 * e.g. "pow(t, 0.5)" -> [{ name: 'exp', defaultVal: 0.5, min: 0.1, max: 5.0, step: 0.05 }]
 */
export const mathFunctions = {
  pow: (a,b) => a < 0 && !Number.isInteger(b) ? 0 : Math.pow(a,b), sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  abs: Math.abs, exp: Math.exp, log: Math.log, min: Math.min, max: Math.max,
  saturate: x => Math.min(1, Math.max(0, x)),
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
  smoothstep: (lo, hi, x) => { const u = Math.min(1, Math.max(0, (x-lo)/(hi-lo))); return u*u*(3-2*u); },
  bezier: (t,x0,y0,x1,y1,x2,y2,x3,y3) => {
    if(t<=x0)return y0;if(t>=x3)return y3;
    const polynomial=(u,a,b,c,d)=>{const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;};
    let lo=0,hi=1;
    for(let i=0;i<24;i++){const u=(lo+hi)/2;if(polynomial(u,x0,x1,x2,x3)<t)lo=u;else hi=u;}
    return polynomial((lo+hi)/2,y0,y1,y2,y3);
  },
  frac: x => x - Math.floor(x), floor: Math.floor, ceil: Math.ceil, sign: Math.sign
};
const functionArity = Object.fromEntries(Object.keys(mathFunctions).map(k => [k,
  k === 'bezier' ? 9 : ['clamp','smoothstep'].includes(k) ? 3 : ['pow','min','max'].includes(k) ? 2 : 1]));
const astCache = new Map();
export function parseExpression(expr) {
  if (!astCache.has(expr)) {
    const ast = new ExprParser(tokenize(expr)).parse();
    if (astCache.size > 100) astCache.clear();
    astCache.set(expr, ast);
  }
  return astCache.get(expr);
}
// Prove from expression structure, not today's slider values: tuning must stay safe.
export function isNonNegative(n) {
  if (n.type === 'number') return n.value >= 0;
  if (n.type === 'binary' && ['+','*'].includes(n.op)) return isNonNegative(n.left) && isNonNegative(n.right);
  if (n.type !== 'call') return false;
  if (['saturate','abs','sqrt','exp'].includes(n.fn)) return true;
  if (['min','max'].includes(n.fn)) return n.args.every(isNonNegative);
  if (n.fn === 'pow') return isNonNegative(n.args[0]);
  return false;
}

export function printExpression(n) {
  if(n.type==='number') return n.constantName || String(n.value);
  if(n.type==='variable') return n.name;
  if(n.type==='unary') return `(-${printExpression(n.operand)})`;
  if(n.type==='binary') return `(${printExpression(n.left)}${n.op}${printExpression(n.right)})`;
  return `${n.fn}(${n.args.map(printExpression).join(',')})`;
}
export function evaluateExpression(expr, t, params = {}) {
  function visit(n) {
    if (n.type === 'number') return n.value;
    if (n.type === 'variable') {
      if (n.name === 't') return t;
      if (Object.hasOwn(params, n.name)) return params[n.name];
      throw new Error(`Unknown parameter: ${n.name}`);
    }
    if (n.type === 'unary') return -visit(n.operand);
    if (n.type === 'call') return mathFunctions[n.fn](...n.args.map(visit));
    const a = visit(n.left), b = visit(n.right);
    return n.op === '+' ? a+b : n.op === '-' ? a-b : n.op === '*' ? a*b : a/b;
  }
  return visit(typeof expr==='string'?parseExpression(expr):expr);
}

// Round editable literals by token position, without touching identifiers.
export function normalizeStandardConstantLiterals(expression){
  parseExpression(expression);
  let result=expression;
  for(const token of tokenize(expression).filter(t=>t.type===TOKEN.NUMBER).reverse()){
    const name=standardLiteralName(token.value,expression.slice(token.start,token.end));
    if(name)result=result.slice(0,token.start)+name+result.slice(token.end);
  }
  return result;
}
export function roundExpressionNumbers(expression){
  expression=normalizeStandardConstantLiterals(expression);
  let result=expression;
  for(const token of tokenize(expression).filter(t=>t.type===TOKEN.NUMBER).reverse()){
    result=result.slice(0,token.start)+String(Number(token.value.toFixed(2)))+result.slice(token.end);
  }
  return result;
}

export function extractExpressionParameters(exprStr) {
  exprStr=normalizeStandardConstantLiterals(exprStr);
  const tokens = tokenize(exprStr);
  const params = [];
  const seen = new Set();
  tokens.forEach((tok, i) => {
    if (tok.type !== TOKEN.IDENT || tokens[i+1]?.type === TOKEN.LPAREN || (tok.value==='t' || constantName(tok.value))) return;
    if (seen.has(tok.value)) return;
    seen.add(tok.value);
    params.push({name: tok.value, defaultVal: 1, min: -10, max: 10, step: 0.01});
  });
  let parameterized = exprStr;
  if (!params.length) {
    const numbers = tokens.filter(tok => tok.type === TOKEN.NUMBER);
    numbers.forEach((tok, i) => {
      const name = `param${i+1}`;
      params.push({name, defaultVal: tok.value, min: 0, max: Math.ceil(Math.max(2, tok.value*2)*100)/100, step: 0.01, start:tok.start, end:tok.end});
    });
    [...params].reverse().forEach(p => {
      parameterized = parameterized.slice(0,p.start)+p.name+parameterized.slice(p.end);
    });
  }
  params.parameterizedExpr = parameterized;
  return params;
}

// Specialize to the chosen slider values before building realtime shader math.
export function optimizeExpression(expr, params = {}) {
  const num=value=>({type:'number',value});
  const binary=(op,left,right)=>({type:'binary',op,left,right});
  function power(base, exponent){
    if(exponent===0)return num(1);
    if(exponent===1)return base;
    const half=power(base,Math.floor(exponent/2));
    const square=binary('*',half,half);
    return exponent%2 ? binary('*',square,base) : square;
  }
  function visit(n){
    if(n.type==='number')return n;
    if(n.type==='variable')return Object.hasOwn(params,n.name)?{...num(params[n.name]),sourceParams:[n.name]}:n;
    if(n.type==='unary'){
      const operand=visit(n.operand);
      return operand.type==='number' && !operand.constantName?{...num(-operand.value),sourceParams:operand.sourceParams}:{...n,operand};
    }
    if(n.type==='call'){
      const args=n.args.map(visit);
      if(args.every(a=>a.type==='number' && !a.constantName)){
        const value=mathFunctions[n.fn](...args.map(a=>a.value));
        if(Number.isFinite(value))return {...num(value),sourceParams:[...new Set(args.flatMap(a=>a.sourceParams || []))]};
      }
      if(n.fn==='pow' && args[1].type==='number' && Number.isInteger(args[1].value) && args[1].value>=0 && args[1].value<=16)return {...power(args[0],args[1].value),parameterNotes:(args[1].sourceParams || []).map(name=>`${name}: exponent = ${args[1].value}`)};
      // Monotone clamp: min(clamp(a),clamp(b)) = clamp(min(a,b)).
      if(n.fn==='min' && args.every(a=>a.type==='call' && a.fn==='saturate'))return {type:'call',fn:'saturate',args:[{type:'call',fn:'min',args:args.map(a=>a.args[0])}]};
      return {...n,args};
    }
    const left=visit(n.left),right=visit(n.right);
    if(left.type==='number' && right.type==='number' && !left.constantName && !right.constantName){
      const a=left.value,b=right.value;
      const value=n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:a/b;
      if(Number.isFinite(value))return {...num(value),sourceParams:[...new Set([...(left.sourceParams || []),...(right.sourceParams || [])])]};
    }
    if(n.op==='*'){
      if(left.type==='number' && left.value===1)return right;
      if(right.type==='number' && right.value===1)return left;
    }
    if(['+','-'].includes(n.op) && right.type==='number' && right.value===0)return left;
    if(n.op==='+' && left.type==='number' && left.value===0)return right;
    if(n.op==='/' && right.type==='number' && !right.constantName && right.value!==0)return binary('*',left,{...num(1/right.value),sourceParams:right.sourceParams});
    return {...n,left,right};
  }
  return visit(typeof expr==='string'?parseExpression(expr):expr);
}

/**
 * Converts AST into nodes and wires layout
 */
export function buildGraphFromExpression(exprStr, paramValues = {}, locals = {}, externalInputs = {}, options = {}) {
  try {
    const ast = typeof exprStr === 'string' ? parseExpression(exprStr) : exprStr;

    const nodes = [];
    const wires = [];
    const recipeSteps = [];
    let nodeIdCounter = 1;

    // Fixed Input Node (t)
    const inputNodeId = 'in_t';
    nodes.push({
      id: inputNodeId,
      title: 'Input (t)',
      x: 30,
      y: 160,
      w: 120,
      h: 64,
      type: 'input',
      outPort: 'Out'
    });

    // Parameter Nodes registry
    const paramNodeIds = new Map();
    if (paramValues && typeof paramValues === 'object') {
      Object.entries(paramValues).forEach(([pName, pVal], pIdx) => {
        const pId = `param_${pName}`;
        paramNodeIds.set(pName, pId);
        nodes.push({
          id: pId,
          title: `Param (${pName})`,
          value:pVal,
          x: 30,
          y: 250 + pIdx * 80,
          w: 130,
          h: 64,
          type: 'input',
          outPort: String(pVal)
        });
      });
    }

    Object.values(externalInputs).forEach(node => {
      nodes.push(node);
      wires.push({from:inputNodeId,to:node.id,fromPort:'Out',toPort:node.inPorts[0]});
    });
    let layoutLevel = 1;
    const localResults = new Map();

    // Share repeated expressions, including base signals used by signed Power.
    const compiledExpressions = new Map();
    function compileNode(astNode, level) {
      const key = JSON.stringify(astNode);
      if (!compiledExpressions.has(key)) {
        const result=compileNodeImpl(astNode,level);
        if(astNode.parameterNotes?.length){
          const node=nodes.find(n=>n.id===result.id);
          if(node)node.parameterNotes=astNode.parameterNotes;
        }
        compiledExpressions.set(key,result);
      }
      return compiledExpressions.get(key);
    }
    // Traverse AST to emit native shader nodes
    function compileNodeImpl(astNode, level) {
      if (!astNode) return { id: inputNodeId, port: 'Out' };

      // Number literal
      if (astNode.type === 'number') {
        if(astNode.constantName){
          const name=astNode.constantName,id=`constant_${name}`;
          if(!nodes.some(n=>n.id===id))nodes.push({id,title:`Constant (${name})`,type:'constant',value:astNode.value,x:30,y:0,w:160,h:86,outPort:String(astNode.value)});
          return {id,port:'Out',isStandardConstant:true,name};
        }
        const valStr = astNode.value;
        return { isConstant: true, value: valStr, sourceParams:astNode.sourceParams };
      }

      // Variable (t or exposed parameter name)
      if (astNode.type === 'variable') {
        const vName = astNode.name;
        if (Object.hasOwn(externalInputs,vName)) return {id:externalInputs[vName].id,port:'Out'};
        if (Object.hasOwn(locals, vName)) {
          if (!localResults.has(vName)) localResults.set(vName, compileNode(parseExpression(locals[vName]), level));
          return localResults.get(vName);
        }
        if (paramNodeIds.has(vName)) {
          const pId = paramNodeIds.get(vName);
          const pVal = paramValues[astNode.name] ?? paramValues[vName];
          return { id: pId, port: 'Out', isParam: true, name: astNode.name };
        }
        if (vName !== 't') throw new Error(`Unknown variable: ${vName}`);
        return { id: inputNodeId, port: 'Out' };
      }

      // Unary negation (-x) -> Multiply by -1 or Negate
      if (astNode.type === 'unary' && astNode.op === '-') {
        const opRes = compileNode(astNode.operand, level);
        const nid = `math_${nodeIdCounter++}`;
        const nodeX = 180 + level * 165;
        const nodeY = 120;
        nodes.push({
          id: nid,
          title: 'Negate / Mul(-1)',
          x: nodeX,
          y: nodeY,
          w: 135,
          h: 64,
          type: 'math',
          inPorts: [opRes.isConstant ? `In (${opRes.value})` : 'In'],
          outPort: 'Out', op:'negate', args:[opRes]
        });
        if (opRes.id) wires.push({ from: opRes.id, to: nid, fromPort: opRes.port, toPort: 'In' });
        recipeSteps.push('กลับเครื่องหมายเป็นลบ (Negate)');
        return { id: nid, port: 'Out' };
      }

      // Binary operation (+, -, *, /)
      if (astNode.type === 'binary') {
        const leftRes = compileNode(astNode.left, level);
        const rightRes = compileNode(astNode.right, level);

        const nid = `math_${nodeIdCounter++}`;
        const nodeX = 180 + level * 165;
        const nodeY = 80 + (nodeIdCounter % 4) * 45;

        let title = 'Multiply';
        let opName = 'Multiply';
        if (astNode.op === '+') { title = 'Add'; opName = 'Add'; }
        if (astNode.op === '-') { title = 'Subtract'; opName = 'Subtract'; }
        if (astNode.op === '/') { title = 'Divide'; opName = 'Divide'; }

        // Special: (1.0 - x) -> One Minus Node
        if (astNode.op === '-' && leftRes.isConstant && leftRes.value === 1.0) {
          nodes.push({
            id: nid,
            title: 'One Minus',
            x: nodeX,
            y: nodeY,
            w: 125,
            h: 64,
            type: 'math',
            inPorts: [rightRes.isConstant ? `In (${rightRes.value})` : 'In'],
            outPort: 'Out', op:'oneMinus', args:[rightRes]
          });
          if (rightRes.id) wires.push({ from: rightRes.id, to: nid, fromPort: rightRes.port, toPort: 'In' });
          recipeSteps.push('ส่งสัญญาณเข้าโหนด `One Minus` (1 - In)');
          return { id: nid, port: 'Out' };
        }

        const inPorts = [];
        const portA = leftRes.isConstant ? `A (${leftRes.value})` : 'A';
        const portB = rightRes.isConstant ? `B (${rightRes.value})` : 'B';
        inPorts.push(portA, portB);

        nodes.push({
          id: nid,
          title: leftRes.isConstant && !rightRes.isConstant ? `${title} (${leftRes.value})` : (rightRes.isConstant && !leftRes.isConstant ? `${title} (${rightRes.value})` : title),
          x: nodeX,
          y: nodeY,
          w: 140,
          h: 84,
          type: 'math',
          inPorts,
          outPort: 'Out', op:astNode.op,args:[leftRes,rightRes]
        });

        if (leftRes.id) wires.push({ from: leftRes.id, to: nid, fromPort: leftRes.port, toPort: portA });
        if (rightRes.id) wires.push({ from: rightRes.id, to: nid, fromPort: rightRes.port, toPort: portB });

        recipeSteps.push(`คำนวณโหนด \`${opName}\` (${leftRes.isConstant ? leftRes.value : 'สัญญาณ'} ${astNode.op} ${rightRes.isConstant ? rightRes.value : 'สัญญาณ'})`);
        return { id: nid, port: 'Out' };
      }

      // Function calls (pow, sin, cos, smoothstep, saturate, exp, frac, floor)
      if (astNode.type === 'call') {
        const fn = astNode.fn;
        if(fn === 'bezier') {
          const prefix=`curve${nodeIdCounter++}_`;
          const names=astNode.args.map((arg,i)=>{const k=prefix+'arg'+i;locals[k]=printExpression(arg);return k;});
          const polynomial=(u,indices)=>`(1.0-${u})*(1.0-${u})*(1.0-${u})*${names[indices[0]]}+3.0*(1.0-${u})*(1.0-${u})*${u}*${names[indices[1]]}+3.0*(1.0-${u})*${u}*${u}*${names[indices[2]]}+${u}*${u}*${u}*${names[indices[3]]}`;
          locals[prefix+'target']=`clamp(${names[0]},${names[1]},${names[7]})`;
          locals[prefix+'lo0']='0.0';locals[prefix+'hi0']='1.0';
          for(let i=0;i<24;i++){
            const lo=prefix+'lo'+i,hi=prefix+'hi'+i,mid=prefix+'mid'+i,pick=prefix+'pick'+i;
            locals[mid]=`(${lo}+${hi})*0.5`;
            locals[prefix+'x'+i]=polynomial(mid,[1,3,5,7]);
            locals[pick]=`max(sign(${prefix}target-${prefix}x${i}),0.0)`;
            locals[prefix+'lo'+(i+1)]=`${lo}+(${mid}-${lo})*${pick}`;
            locals[prefix+'hi'+(i+1)]=`${mid}+(${hi}-${mid})*${pick}`;
          }
          locals[prefix+'u']=`(${prefix}lo24+${prefix}hi24)*0.5`;
          return compileNode(parseExpression(polynomial(prefix+'u',[2,4,6,8])),level);
        }
        if (options.expandSignedPower !== false && fn === 'pow' && !astNode.nativePower && !isNonNegative(astNode.args[0])) {
          const base=printExpression(astNode.args[0]), exponent=printExpression(astNode.args[1]);
          const negative=`max(-sign(${base}),0.0)`;
          const integral=`(1.0-sign(abs((${exponent})-floor(${exponent}))))`;
          const rewritten=structuredClone(parseExpression(`pow(abs(${base}),${exponent})*(1.0-${negative}+${negative}*${integral}*(1.0-4.0*frac((${exponent})*0.5)))`));
          // Mark only the introduced absolute-base Power as native.
          const mark=n=>{ if(n.type==='call' && n.fn==='pow') n.nativePower=true; if(n.type==='binary'){mark(n.left);mark(n.right);} };
          mark(rewritten);
          return compileNode(rewritten,level);
        }
        const argResults = astNode.args.map(a => compileNode(a, level));

        const nid = `math_${nodeIdCounter++}`;
        const nodeX = 180 + level * 165;
        const nodeY = 80 + (nodeIdCounter % 4) * 45;

        const titles = {pow:'Power',sin:'Sine',cos:'Cosine',tan:'Tangent',sqrt:'Square Root',abs:'Absolute',exp:'Exponential',log:'Log',saturate:'Saturate',clamp:'Clamp',smoothstep:'Smoothstep',frac:'Fraction',floor:'Floor',ceil:'Ceiling',sign:'Sign',min:'Minimum',max:'Maximum'};
        const labels = fn === 'pow' ? ['Base','Exp'] : fn === 'smoothstep' ? ['Edge1','Edge2','In'] : fn === 'clamp' ? ['In','Min','Max'] : argResults.length === 2 ? ['A','B'] : ['In'];
        const inPorts = labels.map((label,i) => argResults[i].isConstant ? `${label} (${argResults[i].value})` : label);
        nodes.push({id:nid,title:titles[fn],x:nodeX,y:nodeY,w:165,h:50+inPorts.length*20,type:'math',inPorts,outPort:'Out',op:fn,args:argResults});
        argResults.forEach((r,i) => { if(r.id) wires.push({from:r.id,to:nid,fromPort:r.port,toPort:inPorts[i]}); });
        recipeSteps.push(`สร้างโหนด ${titles[fn]} (${inPorts.join(', ')}) และเชื่อมต่อสายจาก ${argResults.map(r=>r.id || r.value).join(', ')}`);
        return {id:nid,port:'Out'};
      }

      return { id: inputNodeId, port: 'Out' };
    }

    const finalRes = compileNode(ast, layoutLevel);
    // Keep slider identities even when their values are baked and simplified.
    nodes.forEach(node=>{
      node.portLabels=(node.args || []).map((arg,i)=>{
        const label=node.inPorts?.[i] || node.inPort;
        if(arg.isStandardConstant)return `${label} (${arg.name})`;
        if(arg.isParam)return `${label} (${arg.name})`;
        if(!arg.sourceParams?.length)return label;
        const sources=arg.sourceParams.map(name=>`${name}=${paramValues[name]}`).join(', ');
        const value=arg.sourceParams.length===1 && paramValues[arg.sourceParams[0]]===arg.value ? sources : `${sources}; result=${arg.value}`;
        return `${label.split(' (')[0]} (${value})`;
      });
    });

    // Output Node
    const outputNode = {
      id: 'out',
      title: 'Output (y)',
      x: 0,
      y: 0,
      w: 130,
      h: 64,
      type: 'output',
      inPort: finalRes.isConstant ? `In (${finalRes.value})` : 'In', args:[finalRes]
    };
    nodes.push(outputNode);

    if (finalRes.id) {
      wires.push({ from: finalRes.id, to: 'out', fromPort: finalRes.port, toPort: 'In' });
    }

    // Baked parameters are represented at ports rather than disconnected nodes.
    for(let i=nodes.length-1;i>=0;i--)if(nodes[i].id.startsWith('param_') && !wires.some(w=>w.from===nodes[i].id))nodes.splice(i,1);

    // Reserve a header, separate input rows and an output footer.
    nodes.forEach(node=>{
      node.w=Math.max(node.w, node.type==='math' ? 176 : 144);
      node.h=Math.max(node.h, 62+(node.inPorts?.length || 1)*24)+(node.parameterNotes?.length || 0)*24;
    });

    // ── Layered DAG Auto-Layout (Sugiyama / Barycenter) ──
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inEdges = new Map(nodes.map(n => [n.id, []]));
    const outEdges = new Map(nodes.map(n => [n.id, []]));

    wires.forEach(w => {
      if (inEdges.has(w.to)) inEdges.get(w.to).push(w.from);
      if (outEdges.has(w.from)) outEdges.get(w.from).push(w.to);
    });

    // 1. Longest Path Layering from Input
    const levels = new Map();
    nodes.forEach(n => levels.set(n.id, 0));

    let changed = true;
    let iters = 0;
    while (changed && iters < 100) {
      changed = false;
      iters++;
      for (const [to, froms] of inEdges.entries()) {
        for (const from of froms) {
          if (levels.get(to) <= levels.get(from)) {
            levels.set(to, levels.get(from) + 1);
            changed = true;
          }
        }
      }
    }

    // Group nodes into columns by level
    const columns = new Map();
    nodes.forEach(n => {
      const lvl = levels.get(n.id);
      if (!columns.has(lvl)) columns.set(lvl, []);
      columns.get(lvl).push(n);
    });

    const sortedLevels = Array.from(columns.keys()).sort((a, b) => a - b);
    const X_START = 20;
    const Y_CENTER = 150;

    let columnX = X_START;
    sortedLevels.forEach(lvl => {
      const col = columns.get(lvl);
      col.sort((a,b) => {
        const avg = n => { const preds=inEdges.get(n.id); return preds.length ? preds.reduce((v,id)=>v+nodeMap.get(id).y,0)/preds.length : 0; };
        return avg(a)-avg(b);
      });
      let y = Y_CENTER - col.reduce((sum,n)=>sum+n.h+40,0)/2;
      col.forEach(n => {n.x=columnX;n.y=y;y+=n.h+40;});
      columnX += Math.max(...col.map(n=>n.w))+64;
    });

    recipeSteps.push('เชื่อมต่อสัญญาณผลลัพธ์สุดท้ายเข้าพอร์ต Output (Alpha / Scale / Emissive)');

    return { nodes, wires, recipe: recipeSteps };
  } catch {
    // If parsing fails, emit simple fallback
    return null;
  }
}

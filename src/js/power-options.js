import {parseExpression,printExpression} from './expression-graph-builder.js';

// Exponents become compile-time integers; other parameters remain editable inputs.
export function integerExponentParameters(expression){
  const names=new Set();
  function visit(n){
    if(n.type==='call'){
      if(n.fn==='pow'){
        const exponent=n.args[1];
        if(exponent.type==='variable' && exponent.name!=='t')names.add(exponent.name);
        if(exponent.type==='unary' && exponent.operand.type==='variable' && exponent.operand.name!=='t')names.add(exponent.operand.name);
      }
      n.args.forEach(visit);
    }else if(n.type==='binary'){visit(n.left);visit(n.right);}
    else if(n.type==='unary')visit(n.operand);
  }
  visit(typeof expression==='string'?parseExpression(expression):expression);
  return names;
}
export function expressionWithPowerOptions(expression,params,enabled){
  const ast=typeof expression==='string'?parseExpression(expression):expression;
  if(!enabled)return ast;
  const number=value=>({type:'number',value});
  const binary=(op,left,right)=>({type:'binary',op,left,right});
  function exponentValue(n){
    if(n.type==='number')return n.value;
    if(n.type==='variable' && n.name!=='t')return params[n.name];
    if(n.type==='unary'){const value=exponentValue(n.operand);return value===undefined?undefined:-value;}
  }
  // Reuse squares: x^8 needs x^2, x^4, x^8 instead of seven multiplies.
  function power(base,n){
    if(n===0)return number(1);
    if(n===1)return base;
    const half=power(base,Math.floor(n/2)),square=binary('*',half,half);
    return n%2?binary('*',square,base):square;
  }
  function visit(n){
    if(n.type==='call'){
      const args=n.args.map(visit);
      if(n.fn==='pow'){
        const value=exponentValue(n.args[1]),exponent=Math.round(value);
        if(Number.isSafeInteger(exponent)){
          const product=power(args[0],Math.abs(exponent));
          return exponent<0?binary('/',number(1),product):product;
        }
      }
      return {...n,args};
    }
    if(n.type==='binary')return {...n,left:visit(n.left),right:visit(n.right)};
    if(n.type==='unary')return {...n,operand:visit(n.operand)};
    return n;
  }
  return visit(ast);
}
export function expressionVariables(ast){
  const names=new Set();
  function visit(n){
    if(n.type==='variable')names.add(n.name);
    else if(n.type==='call')n.args.forEach(visit);
    else if(n.type==='binary'){visit(n.left);visit(n.right);}
    else if(n.type==='unary')visit(n.operand);
  }
  visit(ast);return names;
}

export function roundLiteralPowerExponents(expression){
  const ast=parseExpression(expression);let changed=false;
  function visit(n){
    if(n.type==='call'){
      n.args.forEach(visit);
      if(n.fn==='pow' && n.args[1].type==='number'){
        const value=Math.round(n.args[1].value);
        if(Number.isSafeInteger(value) && value!==n.args[1].value){n.args[1]={type:'number',value};changed=true;}
      }
    }else if(n.type==='binary'){visit(n.left);visit(n.right);}
    else if(n.type==='unary')visit(n.operand);
  }
  // Never mutate the parser's cached AST.
  const copy=structuredClone(ast);visit(copy);
  return changed?printExpression(copy).replaceAll(',',', '):expression;
}


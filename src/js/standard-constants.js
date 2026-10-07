// Constant Node choices plus the common angle macros in Unity ShaderLibrary.
export const standardConstants=Object.freeze({
  PI:Math.PI, TAU:2*Math.PI, PHI:(1+Math.sqrt(5))/2, E:Math.E, SQRT2:Math.SQRT2,
  HALF_PI:Math.PI/2, FOUR_PI:4*Math.PI, INV_PI:1/Math.PI,
  INV_TWO_PI:1/(2*Math.PI), INV_FOUR_PI:1/(4*Math.PI), INV_SQRT2:Math.SQRT1_2,
  PI_DIV_FOUR:Math.PI/4, LOG2_E:Math.LOG2E
});
const aliases={TWO_PI:'TAU',SQRT_TWO:'SQRT2'};
export function constantName(name){
  const canonical=aliases[name] || name;
  return Object.hasOwn(standardConstants,canonical)?canonical:null;
}
export function constantCodeName(name){return name==='TAU'?'TWO_PI':name;}
export const shaderConstants=Object.freeze(Object.fromEntries(Object.entries(standardConstants).map(([name,value])=>[constantCodeName(name),value])));
export function constantDefinitions(body){
  const used=Object.keys(shaderConstants).filter(name=>new RegExp(`\\b${name}\\b`).test(body));
  const legacy={PI:'UNITY_PI',TWO_PI:'UNITY_TWO_PI',HALF_PI:'UNITY_HALF_PI',INV_PI:'UNITY_INV_PI'};
  return used.map(name=>{
    const fallback=`#define ${name} ${shaderConstants[name]}`;
    const definition=legacy[name]?`#if defined(${legacy[name]})\n#define ${name} ${legacy[name]}\n#else\n${fallback}\n#endif`:fallback;
    return `#ifndef ${name}\n${definition}\n#endif\n`;
  }).join('');
}

// Only recognize precise literals, never editable approximations such as 3.14.
export function standardLiteralName(value,spelling){
  const decimals=(spelling.split(/[eE]/)[0].split('.')[1] || '').length;
  if(decimals<5)return null;
  const tolerance=10**(-decimals)+Number.EPSILON*Math.max(1,Math.abs(value))*2;
  return Object.keys(standardConstants).find(name=>Math.abs(value-standardConstants[name])<=tolerance) || null;
}

// Display rounding never changes graph values or generated shader math.
export function formatGraphNumber(value) {
  if(!Number.isFinite(value))return String(value);
  if(Object.is(value,-0))return '0';
  return String(Number(value.toFixed(2)));
}
export function formatGraphLabel(label='') {
  return String(label).replace(/(?<![\w.])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?(?![\w.])/g, text=>formatGraphNumber(Number(text)));
}
export function graphNodeTitle(node) {
  const names={'+':'Add','-':'Subtract','*':'Multiply','/':'Divide',negate:'Negate',oneMinus:'One Minus'};
  return names[node.op] || node.title;
}

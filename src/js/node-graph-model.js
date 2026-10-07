import { expressionWithPowerOptions, integerExponentParameters } from './power-options.js';
import { state } from './state.js';
import { getBezierCoefficients } from './code-gen.js';
import { buildGraphFromExpression } from './expression-graph-builder.js';

const bezierTemplates = new Map();
let cachedKey = '', cachedModel = null;
function bezierModel(){
  const values=getBezierCoefficients();
  const key=JSON.stringify(values);
  let graph=bezierTemplates.get('polynomial');
  if(!graph){
    graph=buildGraphFromExpression('((a*t+b)*t+c)*t+d',values);
    graph.revision=0;bezierTemplates.set('polynomial',graph);
  }
  if(graph.coordinateKey!==key){
    graph.nodes.forEach(node=>{
      if(node.id.startsWith('param_')){const k=node.id.slice(6);node.value=values[k];node.outPort=String(Number(values[k].toPrecision(12)));node.title=`Coefficient ${k.toUpperCase()}`;}
    });
    graph.coordinateKey=key;graph.revision++;
  }
  return graph;
}
export function generateNodeGraphModel() {
  if(state.mode==='bezier')return bezierModel();
  // The graph is an editable parameter graph; baking is an export choice.
  const expression=state.parameterizedExpr || state.customExpr;
  const key=JSON.stringify([expression,!!state.multiplyIntegerPowers,state.multiplyIntegerPowers?[...integerExponentParameters(expression)].map(name=>Math.round(state.customParams[name])):[]]);
  if(key!==cachedKey || !cachedModel){
    cachedModel=buildGraphFromExpression(expressionWithPowerOptions(expression,state.customParams,state.multiplyIntegerPowers),state.customParams,{}, {}, {expandSignedPower:false});
    cachedModel.revision=0;
    cachedKey=key;
  }
  const valueKey=JSON.stringify(state.customParams);
  if(cachedModel.valueKey!==valueKey){
    cachedModel.nodes.forEach(node=>{
      if(!node.id.startsWith('param_'))return;
      const name=node.id.slice(6);
      node.value=state.customParams[name];
      node.outPort=String(node.value);
    });
    cachedModel.valueKey=valueKey;
    cachedModel.revision++;
  }
  return cachedModel;
}

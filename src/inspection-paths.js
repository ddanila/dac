import paths from './robotron-inspection-paths.json' with {type:'json'};
export function inspectionOffset(name,fraction){const points=paths[name];if(!Array.isArray(points))throw Error('Unknown inspection path');const t=Math.max(0,Math.min(1,fraction))*(points.length-1),i=Math.min(Math.floor(t),points.length-2);return points[i].map((a,n)=>a+(points[i+1][n]-a)*(t-i));}

export function keyboardLayersFraction(fraction){return Math.max(0,Math.min(1,fraction/paths['keyboard-layer-opening-fraction']));}

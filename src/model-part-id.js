// Names and occurrence among same-named siblings survive asynchronous loads of
// differently named parts. Numeric child indices alone do not.
export function partId(root,object){
 const path=[];for(let o=object;o&&o!==root;o=o.parent){if(!o.parent)throw Error('Component is outside this model.');path.unshift([o.name,o.parent.children.filter(c=>c.name===o.name).indexOf(o)]);}return JSON.stringify(path);
}
export function findPart(root,id){
 if(typeof id!=='string'||id.length>8192)throw Error('Invalid component selection.');
 const path=JSON.parse(id);if(!Array.isArray(path)||path.length>40)throw Error('Invalid component path.');
 let o=root;for(const step of path){if(!Array.isArray(step)||step.length!==2||typeof step[0]!=='string'||!Number.isInteger(step[1])||step[1]<0)throw Error('Invalid component path.');o=o?.children.filter(c=>c.name===step[0])[step[1]];}if(!o?.isMesh)throw Error('Component is no longer available.');return o;
}

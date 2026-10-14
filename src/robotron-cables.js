const ease = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Exact plug ends move together; board/PSU ends stay anchored. The middle is
// illustrative deformation, not a measurement of available cable slack.
export function cableWeight(name,x,y,z){
 return name.startsWith('ribbon-') ? ease((100-y)/55)*ease((z-53)/13) : ease((-20-x)/30);
}

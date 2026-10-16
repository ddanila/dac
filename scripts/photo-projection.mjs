// Planar homography for image-space review, never a claim of 3D dimensions.
export function projectPoint(h,[x,y]){const w=h[6]*x+h[7]*y+1;if(Math.abs(w)<1e-10)throw Error('Point lies on projection horizon.');return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];}
export function fitProjection(pairs){
 if(pairs.length<4)throw Error('At least four training landmarks are required.');
 const equations=[];
 for(const {model:[x,y],photo:[u,v]} of pairs){equations.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 const a=Array.from({length:8},(_,i)=>Array.from({length:9},(_,j)=>equations.reduce((sum,row)=>sum+row[i]*row[j],0)));
 for(let i=0;i<8;i++){let pivot=i;for(let k=i+1;k<8;k++)if(Math.abs(a[k][i])>Math.abs(a[pivot][i]))pivot=k;
  [a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i];if(Math.abs(d)<1e-9)throw Error('Landmarks are degenerate; spread them across the same planar surface.');
  for(let j=i;j<9;j++)a[i][j]/=d;
  for(let k=0;k<8;k++)if(k!==i){const f=a[k][i];for(let j=i;j<9;j++)a[k][j]-=f*a[i][j];}
 }
 return a.map(row=>row[8]);
}

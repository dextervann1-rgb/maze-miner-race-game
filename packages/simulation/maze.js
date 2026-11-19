// packages/simulation/maze.js — CANONICAL maze generation. Single source of truth.
// Browser + Node import the SAME file. No duplication. Version: 10.0.0
export function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function genMaze(seed){
  const rng=mulberry(hash(seed));const W=21,H=21,maze=Array.from({length:H},()=>Array(W).fill(1));
  let stack=[[1,1]];maze[1][1]=0;const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
  while(stack.length){let [x,y]=stack[stack.length-1];let opts=[];for(let [dx,dy] of dirs){let nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&maze[ny][nx]==1)opts.push([dx,dy,nx,ny]);}if(!opts.length){stack.pop();continue;}let [dx,dy,nx,ny]=opts[Math.floor(rng()*opts.length)];maze[y+dy/2][x+dx/2]=0;maze[ny][nx]=0;stack.push([nx,ny]);}
  maze[1][1]=0;maze[19][19]=0;maze[19][18]=0;maze[18][19]=0;
  const blocks={};for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(maze[y][x]==1){let r=rng();let kind=r<.35?'dirt':r<.65?'stone':r<.85?'iron':r<.94?'crystal':'gamble';blocks[x+','+y]={kind,hp:kind=='dirt'?1:kind=='stone'?2:kind=='iron'?3:kind=='crystal'?4:2,max:kind=='dirt'?1:kind=='stone'?2:kind=='iron'?3:kind=='crystal'?4:2};}
  const gems={};for(let i=0;i<14;i++){let x=1+Math.floor(rng()*19),y=1+Math.floor(rng()*19);if(maze[y][x]==0&&!(x==1&&y==1))gems[x+','+y]=true}
  const powers={};const plist=['pick','speed','lantern','shield','sonar','clock'];for(let i=0;i<6;i++){let x=1+Math.floor(rng()*19),y=1+Math.floor(rng()*19);if(maze[y][x]==0)powers[x+','+y]=plist[i%6]}
  Object.keys(blocks).forEach((k,i)=>{if(i%14==0)blocks[k].special='explosive';else if(i%17==0)blocks[k].special='ice';else if(i%19==0)blocks[k].special='lava';else if(i%23==0)blocks[k].special='locked';else if(i%29==0)blocks[k].special='hidden';});
  return{maze,blocks,gems,powers};
}
export function bfsPath(maze,blocks,sx,sy,tx,ty){
  let q=[[sx,sy]],prev={},seen=new Set([sx+','+sy]);
  while(q.length){let [x,y]=q.shift();if(x==tx&&y==ty)break;for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>20||ny>20)continue;let k=nx+','+ny;if(seen.has(k))continue;if(blocks[k])continue;seen.add(k);prev[k]=[x,y];q.push([nx,ny]);}}
  if(!seen.has(tx+','+ty))return null;let path=[],cur=[tx,ty];while(!(cur[0]==sx&&cur[1]==sy)){path.unshift(cur);cur=prev[cur[0]+','+cur[1]];if(!cur)break}return path;
}

const page=await browser.getPage('issue17-shared-physics');
const state=JSON.parse(await readFile('issue17-navigation-state.json'));
const points=state.start.route.split(' ').map(pair=>{const [x,z]=pair.split(',').map(Number);return {x,z};});
if(!state.initialized){state.heading=Math.atan2(points[1].z-points[0].z,points[1].x-points[0].x);state.initialized=true;}
if(await page.getByRole('heading',{name:'Session en pause',exact:true}).count())await page.getByRole('button',{name:'Reprendre →',exact:true}).click();
let keys=new Set();
for(let i=0;i<32;i++){
 if(await page.getByRole('heading',{name:'Résultat',exact:true}).count())break;
 const visible=await page.evaluate(()=>{const circles=document.querySelectorAll('.race-map circle'),c=circles[0],opponent=circles[1];return {x:Number(c.getAttribute('cx')),z:Number(c.getAttribute('cy')),opponent:{x:Number(opponent.getAttribute('cx')),z:Number(opponent.getAttribute('cy'))},speed:Number(document.querySelector('.speedometer strong').textContent),hud:document.querySelector('.race-timing').textContent};});
 const dx=visible.x-state.last.x,dz=visible.z-state.last.z;
 if(Math.hypot(dx,dz)>.08)state.heading=Math.atan2(dz,dx);
 let nearest=0,distance=Infinity;
 for(let n=0;n<points.length-1;n++){const d=Math.hypot(points[n].x-visible.x,points[n].z-visible.z);if(d<distance){distance=d;nearest=n;}}
 const penalty=Number(visible.hud.match(/\+(\d+) s/)?.[1] ?? 0);
 if(state.penalty!==undefined && penalty-state.penalty>=5){const afterReset=points[(nearest+1)%(points.length-1)];state.heading=Math.atan2(afterReset.z-points[nearest].z,afterReset.x-points[nearest].x);}
 state.penalty=penalty;
 const next=(nearest+7)%(points.length-1),routeTarget=points[next],after=points[(next+1)%(points.length-1)];
 const tangent=Math.atan2(after.z-routeTarget.z,after.x-routeTarget.x);
 const lane=Math.hypot(visible.x-visible.opponent.x,visible.z-visible.opponent.z)<7 ? 3.5 : 0;
 const target={x:routeTarget.x+Math.sin(tangent)*lane,z:routeTarget.z-Math.cos(tangent)*lane};
 const desired=Math.atan2(target.z-visible.z,target.x-visible.x);
 const error=Math.atan2(Math.sin(desired-state.heading),Math.cos(desired-state.heading));
 const wanted=new Set();
 if(visible.speed<18)wanted.add('ArrowUp');
 if(visible.speed>23)wanted.add('ArrowDown');

 for(const key of keys)if(!wanted.has(key))await page.keyboard.up(key);
 for(const key of wanted)if(!keys.has(key))await page.keyboard.down(key);
 keys=wanted;
 state.records.push({...visible,nearest,distance,error,keys:[...keys]});state.last={x:visible.x,z:visible.z};
 const steer=error>.1 ? 'ArrowRight' : error<-.1 ? 'ArrowLeft' : null;
 state.records[state.records.length-1].steer=steer;
 const pulse=steer ? Math.min(220,Math.max(80,Math.abs(error)*300)) : 0;
 state.records[state.records.length-1].pulse=pulse;
 if(steer){await page.keyboard.down(steer);await page.waitForTimeout(pulse);await page.keyboard.up(steer);}
 await page.waitForTimeout(350-pulse);
}
for(const key of keys)await page.keyboard.up(key);
await page.keyboard.press('Escape');
await writeFile('issue17-navigation-state.json',JSON.stringify(state));
console.log(JSON.stringify({records:state.records.length,last:state.records[state.records.length-1],result:await page.getByRole('heading',{name:'Résultat',exact:true}).count()}));

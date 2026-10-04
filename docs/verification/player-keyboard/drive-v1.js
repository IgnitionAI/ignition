const page=await browser.getPage('issue17-shared-physics');
const state=JSON.parse(await readFile('issue17-navigation-state.json'));
const points=state.start.route.split(' ').map(pair=>{const [x,z]=pair.split(',').map(Number);return {x,z};});
if(!state.initialized){state.heading=Math.atan2(points[1].z-points[0].z,points[1].x-points[0].x);state.initialized=true;}
if(await page.getByRole('heading',{name:'Session en pause',exact:true}).count())await page.getByRole('button',{name:'Reprendre →',exact:true}).click();
let keys=new Set();
for(let i=0;i<32;i++){
 if(await page.getByRole('heading',{name:'Résultat',exact:true}).count())break;
 const visible=await page.evaluate(()=>{const c=document.querySelector('.race-map circle');return {x:Number(c.getAttribute('cx')),z:Number(c.getAttribute('cy')),speed:Number(document.querySelector('.speedometer strong').textContent),hud:document.querySelector('.race-timing').textContent};});
 const dx=visible.x-state.last.x,dz=visible.z-state.last.z;
 if(Math.hypot(dx,dz)>.08)state.heading=Math.atan2(dz,dx);
 let nearest=0,distance=Infinity;
 for(let n=0;n<points.length-1;n++){const d=Math.hypot(points[n].x-visible.x,points[n].z-visible.z);if(d<distance){distance=d;nearest=n;}}
 const next=(nearest+10)%(points.length-1),routeTarget=points[next],after=points[(next+1)%(points.length-1)];
 const tangent=Math.atan2(after.z-routeTarget.z,after.x-routeTarget.x);
 const target={x:routeTarget.x+Math.sin(tangent)*3.5,z:routeTarget.z-Math.cos(tangent)*3.5};
 const desired=Math.atan2(target.z-visible.z,target.x-visible.x);
 const error=Math.atan2(Math.sin(desired-state.heading),Math.cos(desired-state.heading));
 const wanted=new Set();
 if(visible.speed<29)wanted.add('ArrowUp');
 if(visible.speed>35)wanted.add('ArrowDown');
 if(error>.07)wanted.add('ArrowRight');else if(error<-.07)wanted.add('ArrowLeft');
 for(const key of keys)if(!wanted.has(key))await page.keyboard.up(key);
 for(const key of wanted)if(!keys.has(key))await page.keyboard.down(key);
 keys=wanted;
 state.records.push({...visible,nearest,distance,error,keys:[...keys]});state.last={x:visible.x,z:visible.z};
 await page.waitForTimeout(250);
}
for(const key of keys)await page.keyboard.up(key);
await page.keyboard.press('Escape');
await writeFile('issue17-navigation-state.json',JSON.stringify(state));
console.log(JSON.stringify({records:state.records.length,last:state.records[state.records.length-1],result:await page.getByRole('heading',{name:'Résultat',exact:true}).count()}));

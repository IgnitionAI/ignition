const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const output = path.resolve(process.argv[2]);
fs.mkdirSync(output, { recursive:true });
(async () => {
 const browser = await chromium.launch({headless:false, executablePath:process.env.CHROMIUM_PATH});
 const page = await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 page.setDefaultTimeout(20000);
 const base=process.env.BLOG_URL || 'http://localhost:3071';
 const slug='ball-thrust-physique-rapier';
 const metrics={sha:execSync('git rev-parse HEAD',{encoding:'utf8'}).trim(),browser:await browser.version(),headless:false,locales:[],errors:[],warnings:[],cancelledRequests:[]};
 page.on('pageerror',e=>metrics.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')metrics.errors.push(m.text());if(m.type()==='warning')metrics.warnings.push(m.text());});
 page.on('requestfailed',r=>{const error=r.failure()?.errorText;if(error==='net::ERR_ABORTED')metrics.cancelledRequests.push(r.url());else metrics.errors.push(`${r.url()}: ${error}`)});
 page.on('response',r=>{if(r.status()>=400)metrics.errors.push(`${r.status()} ${r.url()}`)});
 const read=async()=>({training:parseFloat(await page.getByTestId('train-steps').textContent()),updates:Number(await page.getByTestId('updates').textContent()),inference:Number(await page.getByTestId('infer-steps').textContent()),fingerprint:await page.getByTestId('weight-fingerprint').textContent()});
 const pause=async()=>{await page.getByTestId('pause').click();await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='En pause')};
 try {
  for(const locale of ['fr','en']){
   const response=await page.goto(`${base}/${locale}/#demos`);assert.equal(response.status(),200);
   const links=await page.locator('#demos a[href^="/demos/"]').evaluateAll(items=>[...new Set(items.map(a=>a.getAttribute('href')))]);
   assert.equal(links.length,9);assert(links.includes('/demos/ball-thrust/'));
   const entry=page.locator('#demos a[href="/demos/ball-thrust/"]').first();
   await entry.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`catalogue-${locale}.png`)});
   await entry.click();
   await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='Manuel');
   assert.equal(new URL(page.url()).pathname.replace(/\/$/, ''), '/demos/ball-thrust');
   const origin=await page.getByTestId('position').textContent();
   await page.getByRole('region',{name:/Arène/}).focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
   const moved=await page.getByTestId('position').textContent();assert.notEqual(origin,moved);
   await page.getByTestId('new-episode').click();await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='En pause');
   await page.getByTestId('train').click();await page.waitForFunction(()=>parseFloat(document.querySelector('[data-testid="train-steps"]').textContent)>=64);await pause();
   const trained=await read();assert(trained.updates>0);
   await page.getByTestId('save').click();await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='En pause');
   await page.reload();await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='Manuel');
   await page.getByTestId('load').click();await page.waitForFunction(()=>parseFloat(document.querySelector('[data-testid="train-steps"]').textContent)>0);
   const loaded=await read();assert.equal(loaded.fingerprint,trained.fingerprint);assert.equal(loaded.updates,trained.updates);
   await page.getByTestId('inference').click();await page.waitForFunction(()=>Number(document.querySelector('[data-testid="infer-steps"]').textContent)>=5);await pause();
   const inferred=await read();assert.equal(inferred.fingerprint,trained.fingerprint);assert.equal(inferred.updates,trained.updates);
   await page.screenshot({path:path.join(output,`embedded-inference-${locale}.png`),fullPage:true});
   await page.goBack();await page.locator('#demos').waitFor();assert(page.url().includes(`/${locale}`));
   await page.goto(`${base}/${locale}/blog`);
   await page.locator(`a[href="/${locale}/blog/${slug}"]`).first().click();
   await page.locator(`article[lang="${locale}"] h1`).waitFor();
   const title=await page.locator('h1').innerText();assert(title.includes(locale==='fr'?'DQN entraînable':'trainable DQN'));
   assert((await page.locator('article').innerText()).includes('4096'));
   assert((await page.locator('pre').allTextContents()).some(t=>t.includes('export class BallThrustEnv')));
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('article img')).every(i=>i.complete&&i.naturalWidth>0));
   const table=page.locator('article table');assert.equal(await table.locator('tbody tr').count(),6);assert.equal(await table.locator('td').count(),12);
   await page.screenshot({path:path.join(output,`article-${locale}.png`)});
   await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(output,`article-${locale}-narrow.png`)});
   await page.setViewportSize({width:1440,height:1100});
   await page.locator('article a[href="/demos/ball-thrust/"]').first().click();await page.waitForFunction(()=>document.querySelector('[data-testid="mode"]')?.textContent==='Manuel');
   await page.goBack();await page.locator(`article[lang="${locale}"]`).waitFor();
   metrics.locales.push({locale,catalogue:links.length,route:'/demos/ball-thrust/',manual:{origin,moved},trained,loaded,inferred,title,semanticTable:{rows:6,cells:12},returnNavigation:true});
  }
  assert.deepEqual(metrics.errors,[]);metrics.passed=true;
 }catch(error){metrics.failure=error.stack;await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error}
 finally{fs.writeFileSync(path.join(output,'site-browser.json'),JSON.stringify(metrics,null,2)+'\n');await browser.close()}
 console.log(JSON.stringify(metrics,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

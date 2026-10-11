import puppeteer from 'puppeteer';
const [url,out]=process.argv.slice(2);
const b=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const p=await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1});
await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
await new Promise(r=>setTimeout(r,5000));
await p.screenshot({path:out}); await b.close();

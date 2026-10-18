/** Optional source download; no network requests are needed during deployment. */
import fs from 'node:fs/promises';import {parseHTML} from 'linkedom';
await fs.mkdir('.cache/olympiads',{recursive:true});
for(const [file,url] of [['.cache/harp-raw.zip','https://raw.githubusercontent.com/aadityasingh/HARP/main/HARP_raw.jsonl.zip'],['.cache/mohs-official.pdf','https://web.evanchen.cc/upload/MOHS-hardness.pdf']]){try{await fs.access(file);continue;}catch{}const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${r.status}: ${url}`);await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));}
const index=await (await fetch('https://web.evanchen.cc/problems.html')).text();const doc=parseHTML(index).document;
const paths=[...new Set([...doc.querySelectorAll('a')].map(a=>a.getAttribute('href')||'').filter(u=>/\/(?:IMO|USAMO|JMO)-\d{4}-notes\.tex$/.test(u)))];
const available=[],missing=[];let next=0;
async function worker(){while(next<paths.length){const path=paths[next++];const match=path.match(/(IMO|USAMO|JMO)-(\d{4})-notes\.tex$/);if(!match)continue;const [,kind,year]=match;let complete=true;
 for(const ext of ['tex','pdf']){const file=`.cache/olympiads/${kind}-${year}.${ext}`;try{await fs.access(file);continue;}catch{}const url=new URL(path.replace(/tex$/,ext),'https://web.evanchen.cc').href;const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok){missing.push({url,status:r.status});complete=false;break;}await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));}
 if(complete)available.push({kind,year:Number(year)});if((available.length+missing.length)%10===0)console.log('Publisher exams checked:',available.length+missing.length,'/',paths.length);
}}
await Promise.all([worker(),worker(),worker()]);await fs.writeFile('.cache/olympiads/exams.json',JSON.stringify({available,missing}));console.log('Published exams:',available.length,'unavailable:',missing.length);

/** Optional source download; no network requests are needed during deployment. */
import fs from 'node:fs/promises';
await fs.mkdir('.cache/olympiads',{recursive:true});
for(const [file,url] of [['.cache/harp-raw.zip','https://raw.githubusercontent.com/aadityasingh/HARP/main/HARP_raw.jsonl.zip'],['.cache/mohs-official.pdf','https://web.evanchen.cc/upload/MOHS-hardness.pdf']]){try{await fs.access(file);continue;}catch{}const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${r.status}: ${url}`);await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));}
for(const year of [2020,2021,2022,2023,2024,2025,2026])for(const ext of ['tex','pdf']){
 const file=`.cache/olympiads/IMO-${year}.${ext}`;
 try{await fs.access(file);continue;}catch{}
 const url=`https://web.evanchen.cc/exams/IMO-${year}-notes.${ext}`;
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(response.status===404){console.log('Not published:',url);continue;}if(!response.ok)throw Error(`${response.status}: ${url}`);
 await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
 console.log('Saved',file);
}

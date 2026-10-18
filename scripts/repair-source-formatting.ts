/** Re-import existing publisher text from cached originals, preserving math before HTML parsing. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {protectMathHTML} from '../lib/render';
import type {RecordProblem} from '../lib/types';
const bank=JSON.parse(fs.readFileSync('data/problems.json','utf8')) as RecordProblem[];
const assets=JSON.parse(fs.readFileSync('data/source-import-report.json','utf8')).diagrams;
const assetPaths=new Map(Object.entries(assets).map(([path,url])=>[url,path]));
const cached=new Map<string,any>();
function exam(url:string){
 if(cached.has(url))return cached.get(url);
 const path='.cache/sources/'+createHash('sha256').update(url).digest('hex')+'.html';
 const raw=fs.readFileSync(path,'utf8');
 const payload=raw.match(/<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
 const data=JSON.parse(payload||'{}').props?.pageProps;
 if(!Array.isArray(data?.baseQuestions))throw Error('Missing original source: '+url);
 cached.set(url,data);return data;
}
function importContent(source:string){
 const {document}=parseHTML('<html><body>'+protectMathHTML(source)+'</body></html>');
 for(const img of document.querySelectorAll('img')){
  const src=img.getAttribute('src')||'';
  const url=new URL(src.startsWith('/images/')?src:'/images/past-contests'+src,'https://live.poshenloh.com').href;
  const path=assetPaths.get(url);if(!path||!fs.existsSync('public'+path))throw Error('Original image is missing: '+url);
  img.setAttribute('src',String(path));img.setAttribute('alt','Contest problem diagram');img.removeAttribute('style');
 }
 return document.body.innerHTML;
}
const changed:{id:string;sourceUrl:string;fields:string[]}[]=[];
for(const p of bank){
 const url=p.archiveUrl;if(!url?.startsWith('https://live.poshenloh.com/past-contests/'))continue;
 const data=exam(url),q=data.baseQuestions[p.number-1];
 if(data.contest!==p.contest.toLowerCase().replace(/ /g,'')||Number(String(data.year).slice(0,4))!==p.year)throw Error('Wrong exam: '+p.id);
 if(!q||String(q.answer).trim().toUpperCase()!==(p.contest==='AIME'?String(p.answer).padStart(3,'0'):p.answer)&&Number(q.answer)!==Number(p.answer))throw Error('Answer mismatch: '+p.id);
 const fields:string[]=[];
 const question=importContent(q.question);
 if(p.problemFormat==='html'&&p.problem!==question){p.problem=question;fields.push('problem');}
 const solution=importContent(q.solutions);
 if(p.solutionFormat==='html'&&!p.archiveName&&p.solution!==solution){p.solution=solution;fields.push('solution');}
 for(const extra of p.extraSolutions||[])if(extra.sourceName==='LIVE by Po-Shen Loh'&&extra.sourceUrl===url&&extra.content!==solution){extra.content=solution;fields.push('publisher solution');}
 if(p.choiceFormat==='html')for(const choice of p.choices){const value=importContent(String(q[choice.letter.toLowerCase()]||''));if(choice.tex!==value){choice.tex=value;fields.push('choice '+choice.letter);}}
 if(fields.length)changed.push({id:p.id,sourceUrl:url,fields});
}
fs.writeFileSync('data/problems.json',JSON.stringify(bank));
if(changed.length||!fs.existsSync('data/formatting-repair-report.json'))fs.writeFileSync('data/formatting-repair-report.json',JSON.stringify({method:'Existing publisher records re-imported from the original cached exam JSON. Source inequalities are escaped before parsing HTML, preserving the original math and original image files. Exam identities and answers are checked before replacing text.',changed},null,2));
console.log(JSON.stringify({repaired:changed.length,fields:changed.reduce((n,p)=>n+p.fields.length,0),count:bank.length}));

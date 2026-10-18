import fs from 'node:fs';
import {renderText,renderRich} from '../lib/render';
import type {RecordProblem,ArchivedSolution} from '../lib/types';
const candidates=JSON.parse(fs.readFileSync('.cache/olympiad-candidates.json','utf8')) as RecordProblem[];
const report=JSON.parse(fs.readFileSync('.cache/olympiad-import-report.json','utf8'));
const bank=new Map((JSON.parse(fs.readFileSync('data/problems.json','utf8')) as RecordProblem[]).map(p=>[p.id,p]));
const added:string[]=[];
for(const p of candidates){
 try{
  if(renderText(p.problem).includes('katex-error'))throw Error('Unsupported source statement TeX');
  const approaches:ArchivedSolution[]=[{title:'Published solution',content:p.solution,format:p.solutionFormat||'text',sourceName:p.archiveName!,sourceUrl:p.archiveUrl!},...(p.extraSolutions||[])];
  const valid=approaches.filter(s=>{
   if((s.format==='html'?renderRich(s.content):renderText(s.content)).includes('katex-error')){report.skipped.push({id:p.id,solution:s.title,reason:'Unsupported source solution TeX'});return false;}
   return true;
  });
  if(!valid.length)throw Error('No supported complete published solution');
  p.solution=valid[0].content;if(valid[0].format==='html')p.solutionFormat='html';else delete p.solutionFormat;
  p.extraSolutions=valid.slice(1);
  bank.set(p.id,p);added.push(p.id);
 }catch(e){report.skipped.push({id:p.id,reason:String(e)});}
}
const records=[...bank.values()].sort((a,b)=>b.year-a.year||a.contest.localeCompare(b.contest)||a.variant.localeCompare(b.variant)||a.number-b.number);
fs.writeFileSync('data/problems.json',JSON.stringify(records));
fs.writeFileSync('public/catalog.json',JSON.stringify(records.map(p=>Object.fromEntries(['id','title','contest','year','variant','number','topics','sourceUrl'].map(k=>[k,p[k as keyof RecordProblem]])))));
report.importedAt=new Date().toISOString();report.added=added;report.counts=Object.fromEntries(['USAJMO','USAMO','IMO'].map(c=>[c,records.filter(p=>p.contest===c).length]));
fs.writeFileSync('data/olympiad-import-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({added:added.length,counts:report.counts,skipped:report.skipped.length}));

import fs from 'node:fs';
import {renderText,renderRich} from '../lib/render';
import type {RecordProblem,ArchivedSolution} from '../lib/types';
const report=JSON.parse(fs.readFileSync('.cache/olympiad-import-report.json','utf8'));
const historical=JSON.parse(fs.readFileSync('.cache/kalva-report.json','utf8'));report.sources.push(...historical.sources);report.historicalAssets=historical.assets;report.skipped.push(...historical.skipped);
const candidates=[...JSON.parse(fs.readFileSync('.cache/kalva-candidates.json','utf8')),...JSON.parse(fs.readFileSync('.cache/olympiad-candidates.json','utf8'))] as RecordProblem[];
const bank=new Map((JSON.parse(fs.readFileSync('data/problems.json','utf8')) as RecordProblem[]).map(p=>[p.id,p]));
const added:string[]=[];
const main=(p:RecordProblem):ArchivedSolution=>({title:p.archiveName==='Evan Chen'?'Published solution notes':'Published solution',content:p.solution,format:p.solutionFormat||'text',sourceName:p.archiveName!,sourceUrl:p.archiveUrl!});
const renders=(source:string,format?:string)=>format==='html'?renderRich(source):renderText(source);
for(const p of candidates){
 try{
  const old=bank.get(p.id);
  const incoming=[main(p),...(p.extraSolutions||[])].filter(s=>{
   if(renders(s.content,s.format).includes('katex-error')){report.skipped.push({id:p.id,solution:s.title,reason:'Unsupported source solution TeX'});return false;}return true;
  });
  if(!incoming.length)throw Error('No supported complete published solution');
  if(renders(p.problem,p.problemFormat).includes('katex-error')||p.problem.includes('[asy]')||/\\begin\{(?:asy|tikzpicture)\}/.test(p.problem)){
   if(!old)throw Error('Unsupported source statement TeX');
   old.extraSolutions=[...(old.extraSolutions||[]),...incoming];report.skipped.push({id:p.id,reason:'Retained the existing verified statement and added published solution alternatives'});continue;
  }
  p.topics=[...new Set([...(old?.topics||[]),...p.topics])];p.topicSource=p.topicSource||old?.topicSource||'';
  const all=[...incoming,...(old?[main(old),...(old.extraSolutions||[])]:[])];
  const seen=new Set<string>();const valid=all.filter(s=>{const key=s.format+'|'+s.content.replace(/\s+/g,' ').trim();if(seen.has(key))return false;seen.add(key);return true;});
  p.solution=valid[0].content;if(valid[0].format==='html')p.solutionFormat='html';else delete p.solutionFormat;p.extraSolutions=valid.slice(1);
  bank.set(p.id,p);added.push(p.id);
 }catch(e){report.skipped.push({id:p.id,reason:String(e)});}
}
// Deduplicate alternatives accumulated when rerunning imports or keeping an older statement.
for(const p of bank.values())if(p.extraSolutions){const seen=new Set([main(p).format+'|'+p.solution.replace(/\s+/g,' ').trim()]);p.extraSolutions=p.extraSolutions.filter(s=>{const key=s.format+'|'+s.content.replace(/\s+/g,' ').trim();if(seen.has(key))return false;seen.add(key);return true;});}
const records=[...bank.values()].sort((a,b)=>b.year-a.year||a.contest.localeCompare(b.contest)||a.variant.localeCompare(b.variant)||a.number-b.number);
fs.writeFileSync('data/problems.json',JSON.stringify(records));
fs.writeFileSync('public/catalog.json',JSON.stringify(records.map(p=>Object.fromEntries(['id','title','contest','year','variant','number','topics','sourceUrl'].map(k=>[k,p[k as keyof RecordProblem]])))));
report.importedAt=new Date().toISOString();report.imported=[...new Set(added)];report.counts=Object.fromEntries(['USAJMO','USAMO','IMO'].map(c=>[c,records.filter(p=>p.contest===c).length]));
fs.writeFileSync('data/olympiad-import-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({imported:report.imported.length,counts:report.counts,skipped:report.skipped.length}));

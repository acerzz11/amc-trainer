/** Import publisher-authored alternatives and original diagrams; never generate math. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {renderRich,math} from '../lib/render';
import type {RecordProblem,Topic} from '../lib/types';
const origin='https://live.poshenloh.com';
await fs.mkdir('.cache/sources',{recursive:true});await fs.mkdir('public/diagrams',{recursive:true});
async function page(url:string){
 const file='.cache/sources/'+createHash('sha256').update(url).digest('hex')+'.html';
 try{return await fs.readFile(file,'utf8');}catch{}
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`${response.status}: ${url}`);
 const html=await response.text();await fs.writeFile(file,html);return html;
}
const previousReport=JSON.parse(await fs.readFile('data/source-import-report.json','utf8'));
const diagrams:Record<string,string>={...previousReport.diagrams};const downloads=new Map<string,Promise<string>>();
async function diagram(src:string){
 const url=new URL(src.startsWith('/images/')?src:'/images/past-contests'+src,origin);
 if(url.origin!==origin||!/^\/images\/past-contests\//.test(url.pathname))throw Error('Unsupported diagram origin');
 if(downloads.has(url.href))return downloads.get(url.href)!;
 const download=(async()=>{
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error(`Missing diagram ${url.href}`);
  let bytes=Buffer.from(await response.arrayBuffer());let extension='';
  if(response.headers.get('content-type')?.includes('svg')){
   let svg=bytes.toString('utf8');const{document}=parseHTML(svg);const root=document.querySelector('svg');if(!root)throw Error('Invalid SVG');
   for(const el of Array.from(root.querySelectorAll('*'))){if(['script','foreignobject','iframe','object','embed','a','image'].includes(el.tagName.toLowerCase())){el.remove();continue;}for(const a of Array.from(el.attributes)){if(/^on/i.test(a.name)||/^(?:href|xlink:href)$/i.test(a.name)&&!a.value.startsWith('#')||/url\(\s*['"]?(?!#)/i.test(a.value))el.removeAttribute(a.name);}}
   for(const a of Array.from(root.attributes))if(/^on/i.test(a.name))root.removeAttribute(a.name);
   // Publisher style elements contain geometric presentation; reject external references.
   for(const style of Array.from(root.querySelectorAll('style')))if(/@import|url\(/i.test(style.textContent||''))style.remove();
   bytes=Buffer.from(root.outerHTML);extension='svg';
  }else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))extension='png';
  else if(bytes[0]===255&&bytes[1]===216)extension='jpg';else throw Error('Unsupported diagram format');
  const name=createHash('sha256').update(url.href).digest('hex').slice(0,24)+'.'+extension;
  await fs.writeFile('public/diagrams/'+name,bytes);diagrams['/diagrams/'+name]=url.href;return '/diagrams/'+name;
 })();downloads.set(url.href,download);return download;
}
async function importImages(html:string){
 const{document}=parseHTML('<html><body>'+html+'</body></html>');
 for(const img of Array.from(document.querySelectorAll('img'))){img.setAttribute('src',await diagram(img.getAttribute('src')||''));img.setAttribute('alt','Contest problem diagram');img.removeAttribute('style');}
 return document.body.innerHTML;
}
const original:RecordProblem[]=JSON.parse(await fs.readFile('data/problems.json','utf8'));
const bank=new Map(original.map(p=>[p.id,p]));
const provenance=JSON.parse(await fs.readFile('data/topic-provenance.json','utf8'));
const topics:Record<string,Topic>={'algebra':'Algebra','geometry':'Geometry','number-theory':'Number theory','combinatorics':'Combinatorics'};
// Map publisher-authored concepts to our four broad filters; never guess from question keywords.
const conceptDoc=parseHTML(await page(origin+'/past-contests/concepts')).document;
const groups=JSON.parse(conceptDoc.querySelector('#__NEXT_DATA__')?.textContent||'{}').props?.pageProps?.groups;
if(!Array.isArray(groups))throw Error('Publisher concept taxonomy unavailable');
const subjectMap:Record<string,Topic>={'arithmetic':'Algebra','algebra':'Algebra','number theory':'Number theory','geometry':'Geometry','combinatorics':'Combinatorics','probability and statistics':'Combinatorics'};
const normalizeConcept=(s:string)=>s.trim().toLowerCase().replace(/[’‘]/g,"'");
const conceptMap=new Map<string,Topic>();
for(const group of groups)for(const concept of group.concepts){const topic=subjectMap[group.subject];if(topic)conceptMap.set(normalizeConcept(concept.name),topic);}
// Statistical averages fit our algebra category; probability remains combinatorics.
for(const name of ['mean','median (data)','mode','range','weighted mean','harmonic mean','data and graph interpretation'])conceptMap.set(name,'Algebra');
const topicRecords:Record<string,{sourceUrl:string;concepts:string[];topics:Topic[]}>={};
const{document}=parseHTML(await page(origin+'/past-contests'));
const paths=[...new Set(Array.from(document.querySelectorAll('a')).map(a=>a.getAttribute('href')||'').filter(u=>/^\/past-contests\/(?:amc10|amc12|aime)\/\d{4}(?:[A-D]|I|II)?$/.test(u)&&Number(u.match(/\/(\d{4})/)![1])<=new Date().getUTCFullYear()))];
const report={importedAt:new Date().toISOString(),examPages:0,added:[] as string[],enriched:[] as string[],skipped:[] as {id:string;reason:string}[],diagrams,source:'LIVE by Po-Shen Loh'};
const excluded=new Set(['2012-amc12b-12','2015-amc10a-20','2022-aimeii-8']);
let next=0;
async function worker(){while(next<paths.length){const path=paths[next++];
 try{
  const html=await page(origin+path+'/solutions');const doc=parseHTML(html).document;
  const data=JSON.parse(doc.querySelector('#__NEXT_DATA__')?.textContent||'{}').props?.pageProps;
  const[,kind,exam]=path.match(/\/past-contests\/(\w+)\/(.+)/)!;
  if(data?.contest!==kind||data?.year!==exam||!Array.isArray(data.baseQuestions))throw Error('Exam identity mismatch');
  const year=Number(exam.slice(0,4));const suffix=exam.slice(4);const fall=year===2021&&['C','D'].includes(suffix);
  const variant=fall?(suffix==='C'?'A':'B'):suffix;
  const contest=kind==='aime'?'AIME':kind==='amc10'?'AMC 10':'AMC 12';
  if(data.baseQuestions.length!==(contest==='AIME'?15:25))throw Error('Incomplete exam');
  report.examPages++;
  for(const [index,q] of data.baseQuestions.entries()){
   const number=index+1,id=`${year}-${fall?'fall-':''}${kind}${variant.toLowerCase()}-${number}`;
   try{
    if(excluded.has(id))continue;
    // Publisher *ProblemNumber fields are difficulty equivalents, not contest indices.
    // The published page numbers baseQuestions in array order, verified against the rendered exam.
    const old=bank.get(id);const hasDiagram=/<img\b/i.test(q.question+' '+q.solutions);
    // Import every supported published problem, including those without diagrams.
    const answer=String(q.answer).trim().toUpperCase();if(!(contest==='AIME'?/^\d{1,3}$/:/^[A-E]$/).test(answer))throw Error('Invalid answer key');
    if(old&&Number.isNaN(Number(answer))&&old.answer!==answer||old&&contest==='AIME'&&Number(old.answer)!==Number(answer)){bank.delete(id);throw Error('Answer disagrees with existing source; quarantined');}
    if(typeof q.question!=='string'||typeof q.solutions!=='string'||q.solutions.trim().length<30)throw Error('Missing question or solution');
    const problem=await importImages(q.question);const solution=await importImages(q.solutions);
    const choiceLetters=['A','B','C','D','E'];const choices=contest==='AIME'?[]:choiceLetters.map(letter=>({letter,tex:String(q[letter.toLowerCase()]||'').replace(/^\\\(|\\\)$/g,'').replace(/^\$|\$$/g,'')}));
    if(choices.some(c=>!c.tex||math(c.tex).includes('katex-error')))throw Error('Unsupported answer-choice formatting');
    if(renderRich(problem).includes('katex-error')||renderRich(solution).includes('katex-error'))throw Error('Unsupported math formatting');
    const title=`${year}${fall?' Fall':''} ${contest}${contest==='AIME'&&variant?' ':''}${variant} Problems/Problem ${number}`;
    const sourceUrl='https://artofproblemsolving.com/wiki/index.php/'+title.replace(/ /g,'_');
    const archiveUrl=origin+path+'/solutions';
    const concepts=typeof q.concepts==='string'?q.concepts.split(';').map((s:string)=>s.trim()).filter(Boolean):[];
    const publishedTopics=[...new Set(concepts.map((c:string)=>conceptMap.get(normalizeConcept(c))).filter((t:Topic|undefined):t is Topic=>!!t))] as Topic[];
    topicRecords[id]={sourceUrl:archiveUrl,concepts,topics:publishedTopics};
    if(old){
     old.topics=[...new Set([...old.topics,...publishedTopics])];
     old.extraSolutions=(old.extraSolutions||[]).filter(s=>s.sourceName!=='LIVE by Po-Shen Loh');
     if(!(old.solutionFormat==='html'&&old.archiveUrl===archiveUrl))old.extraSolutions.push({title:'Solution',content:solution,format:'html',sourceName:'LIVE by Po-Shen Loh',sourceUrl:archiveUrl});
     // Keep original AoPS text when complete; use publisher diagrams when an old archive omitted them.
     if(hasDiagram&&/<img\b/.test(problem)){old.problem=problem;old.problemFormat='html';old.archiveUrl=archiveUrl;old.archiveSource='LIVE by Po-Shen Loh';old.choices=choices;}
     report.enriched.push(id);
    }else{
     const tag=provenance.tags?.[sourceUrl]?.topic;
     bank.set(id,{id,title,contest,year,variant:(fall?'Fall ':'')+variant,number,topics:[...new Set([...(tag&&topics[tag]?[topics[tag]]:[]),...publishedTopics])],problem,problemFormat:'html',solution,solutionFormat:'html',answer:contest==='AIME'?String(Number(answer)):answer,sourceUrl,archiveSource:'LIVE by Po-Shen Loh',archiveUrl,choices});report.added.push(id);
    }
   }catch(e){report.skipped.push({id,reason:String(e)});}
  }
  if(report.examPages%15===0)console.log(`Imported ${report.examPages}/${paths.length} exams; ${report.enriched.length} alternatives, ${report.added.length} added problems.`);
 }catch(e){report.skipped.push({id:path,reason:String(e)});}
}}
await Promise.all([worker(),worker(),worker()]);
const records=[...bank.values()].sort((a,b)=>b.year-a.year||a.contest.localeCompare(b.contest)||a.variant.localeCompare(b.variant)||a.number-b.number);
await fs.writeFile('data/problems.json',JSON.stringify(records));
await fs.writeFile('public/catalog.json',JSON.stringify(records.map(p=>Object.fromEntries(['id','title','contest','year','variant','number','topics','sourceUrl'].map(k=>[k,p[k as keyof RecordProblem]])))));
await fs.writeFile('data/source-import-report.json',JSON.stringify(report,null,2));
await fs.writeFile('data/publisher-topics.json',JSON.stringify({source:origin+'/past-contests/concepts',method:'Exact publisher concept names mapped through publisher subject groups. Arithmetic and statistical averages map to Algebra; probability maps to Combinatorics. General logic/technique-only labels do not imply a topic.',subjectMap,records:topicRecords},null,2));
console.log(JSON.stringify({count:records.length,exams:report.examPages,added:report.added.length,enriched:report.enriched.length,skipped:report.skipped.length,diagrams:Object.keys(diagrams).length}));

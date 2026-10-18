import {isProofContest,CONTESTS} from '../lib/contests';
import {POST as checkSingle} from '../app/api/check/route';
import {chooseSet,matchesSetFilters,mapLimit,MAX_SET_SIZE} from '../lib/sets';
import {POST as checkSet} from '../app/api/check-set/route';
import {test} from 'node:test';
import {matchesFilters,maxProblemNumber,type ProblemFilters} from '../lib/filters';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {parseRandomMath} from '../lib/randommath';
import assert from 'node:assert/strict';
import {problems,judge,normalizeAnswer,getProblem,getSolution} from '../lib/problems';
import {renderText,cleanWikiHTML,splitWiki,extractKey,math,renderRich,safeImageURL} from '../lib/render';
test('AMC and AIME grading has strict format and canonical leading zero handling',()=>{
 assert.equal(judge(' b ','B',false),true);assert.equal(judge('A','B',false),false);assert.equal(judge('7','007',true),true);assert.equal(judge('007','7',true),true);assert.equal(judge('000','0',true),true);
 for(const value of ['1000','-1','1.0','1e2','Infinity','7 or 8',''])assert.equal(normalizeAnswer(value,true),null);
 for(const value of ['AA','F','1','A/B'])assert.equal(normalizeAnswer(value,false),null);
});
test('bank consists of unique real-test identifiers, sourced answers, and complete choices',()=>{
 assert.ok(problems.length>1000);assert.equal(new Set(problems.map(p=>p.id)).size,problems.length);
 for(const p of problems){assert.ok(p.sourceUrl.endsWith(p.title.replace(/ /g,'_')),p.id);assert.match(p.sourceUrl,/^https:\/\/artofproblemsolving.com\/wiki\/index.php\//);assert.ok(p.problem.length>10&&p.solution.length>10,p.id);assert.ok(!p.problem.includes('[asy]')&&!p.solution.includes('[asy]'));if(isProofContest(p.contest)){assert.equal(p.answer,'');assert.deepEqual(p.choices,[]);assert.ok(p.number>=1&&p.number<=6);assert.ok(p.archiveName&&p.archiveUrl&&p.topicSource,p.id);}else if(p.contest==='AIME'){assert.match(p.answer,/^\d{1,3}$/);assert.ok(+p.answer<=999);assert.ok(p.number<=15);}else{assert.match(p.answer,/^[A-E]$/);if(p.choices.length)assert.deepEqual(p.choices.map(c=>c.letter),['A','B','C','D','E']);assert.ok(p.choices.every(c=>c.tex.length>0),p.id);}}
});
test('all twelve contest/topic combinations contain eligible problems',()=>{for(const contest of ['AMC 10','AMC 12','AIME'])for(const topic of ['Algebra','Geometry','Number theory','Combinatorics'])assert.ok(problems.some(p=>p.contest===contest&&p.topics.includes(topic as any)),contest+' '+topic)});
test('AoPS HTML is sanitized while math and diagrams survive',()=>{
 const html=cleanWikiHTML('<p onclick="bad()">Test <img class="latex" alt="$x^2$" src="/x"/><script>alert(1)</script><a href="javascript:bad()">unsafe</a><img alt="[asy]x[/asy]" src="https://latex.artofproblemsolving.com/a.png"/></p>');
 assert.ok(html.includes('katex'));assert.ok(html.includes('Contest problem diagram'));assert.ok(!html.includes('onclick'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('script'));assert.ok(!html.includes('evil.example'));assert.equal(safeImageURL('https://evil.example/a.png'),null);assert.equal(safeImageURL('https://artofproblemsolving.com.evil.example/a.png'),null);assert.throws(()=>cleanWikiHTML('<img src="javascript:alert(1)">'));
});
test('problem/solution separation does not expose the solution in the question',()=>{
 const html='<div class="mw-parser-output"><h2>Problem</h2><p>QUESTION</p><h2>Solution 1</h2><p>SECRET</p><h2>See Also</h2><p>RELATED</p></div>';const out=splitWiki(html);assert.ok(out.problemHtml.includes('QUESTION'));assert.ok(!out.problemHtml.includes('SECRET'));assert.ok(out.solutionHtml.includes('SECRET'));assert.ok(!out.solutionHtml.includes('RELATED'));
 assert.equal(extractKey('<ol><li>B</li><li>D</li></ol>',2,false),'D');assert.equal(extractKey('<ol><li>007</li></ol>',1,true),'7');assert.equal(extractKey('<ol><li>guess</li></ol>',1,false),null);
});
test('archive text escapes HTML and renders inline/display equations',()=>{const html=renderText('<script>alert(1)</script> $x^2$ and \\[x=3\\]');assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('katex-display'));});
test('all answer choices parse as valid TeX',()=>{const bad=[];for(const p of problems)for(const c of p.choices){if(math(c.tex).includes('katex-error'))bad.push(`${p.id} ${c.letter}: ${c.tex}`);}assert.deepEqual(bad,[])});

test('all cached questions and solutions render without TeX errors',()=>{const bad=problems.filter(p=>(p.problemFormat==='html'?renderRich(p.problem):renderText(p.problem)).includes('katex-error')||(p.solutionFormat==='html'?renderRich(p.solution):renderText(p.solution)).includes('katex-error')||(p.extraSolutions||[]).some(s=>(s.format==='html'?renderRich(s.content):renderText(s.content)).includes('katex-error'))).map(p=>p.id);assert.deepEqual(bad,[])});

test('all AoPS solutions retain subheadings and diagrams, without related-page content',()=>{
 const out=splitWiki('<div class="mw-parser-output"><div class="mw-heading mw-heading2"><h2>Problem</h2></div><p>QUESTION</p><h2>Solution 1</h2><p>FIRST</p><h3>Case 1</h3><p>CASE CONTENT</p><h3>Proof</h3><p>PROOF CONTENT</p><h2>Solution 2</h2><p>SECOND</p><img src="https://latex.artofproblemsolving.com/diagram.png"><h2>See Also</h2><p>RELATED</p></div>');
 assert.equal(out.solutions.length,2);assert.match(out.solutions[0].html,/CASE CONTENT/);assert.match(out.solutions[0].html,/PROOF CONTENT/);assert.match(out.solutions[1].html,/<img/);assert.doesNotMatch(out.solutionHtml,/RELATED/);assert.doesNotMatch(out.problemHtml,/FIRST|SECOND/);
});
test('Random Math validates the exact exam and keeps every published approach',()=>{
 const p=problems.find(p=>p.id==='2020-amc10a-1')!;
 const fixture='<page><template slot="contents"><div><h1>¶ 2020 AMC 10A Problem 1</h1><p><strong>Problem:</strong> QUESTION</p><p><strong>Solution 1:</strong> FIRST APPROACH with enough explanation</p><p><strong>Solution 2:</strong></p><p>SECOND APPROACH with enough explanation</p></div></template></page>';
 const items=parseRandomMath(fixture,p);assert.equal(items.length,2);assert.match(items[0].html,/FIRST APPROACH/);assert.match(items[1].html,/SECOND APPROACH/);assert.throws(()=>parseRandomMath(fixture,{...p,number:2,title:'2020 AMC 10A Problems/Problem 2'}));
});
test('publisher math is re-rendered once and imported diagrams are allowed',()=>{
 const html=renderRich('<p>Equation \\(x^2\\)</p><span class="katex"><span class="katex-mathml"><math><mrow><mi>x</mi></mrow>x+1</math></span><span class="katex-html">DUPLICATE</span></span><img src="/diagrams/abcdef.svg" onerror="bad()">');
 assert.match(html,/katex/);assert.doesNotMatch(html,/DUPLICATE|onerror/);assert.match(html,/\/diagrams\/abcdef.svg/);
});
test('every referenced bundled diagram exists, and SVGs contain no executable or external content',()=>{
 const paths=new Set<string>();for(const p of problems)for(const source of [p.problem,p.solution,...(p.extraSolutions||[]).map(s=>s.content)])for(const [,path] of source.matchAll(/src="(\/diagrams\/[^" ]+)"/g))paths.add(path);
 assert.ok(paths.size>300);for(const path of paths){assert.ok(fs.existsSync('public'+path),path);if(path.endsWith('.svg')){const svg=fs.readFileSync('public'+path,'utf8');const root=parseHTML(svg).document.querySelector('svg');assert.ok(root,path);assert.equal(root.querySelectorAll('script,foreignObject,iframe,object,embed,image,a').length,0,path);for(const el of [root,...Array.from(root.querySelectorAll('*'))])for(const attr of Array.from(el.attributes)){assert.ok(!/^on/i.test(attr.name),path);if(/^(href|xlink:href)$/i.test(attr.name))assert.ok(attr.value.startsWith('#'),path);}}}
});
test('offline fallback keeps alternatives private until solutions are requested',async()=>{
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:503});
 try{const p=problems.find(p=>(p.extraSolutions||[]).length)!;const question=await getProblem(p);assert.equal(question.delivery,'archive');for(const field of ['answer','solution','extraSolutions','solutionFormat'])assert.equal(field in question,false);
 const solutions=await getSolution(p);assert.ok(solutions.items.length>=2);assert.equal(solutions.items[0].sourceName,'AoPS archive');assert.ok(solutions.items.some(s=>s.sourceName==='LIVE by Po-Shen Loh'));assert.ok(solutions.items.every(s=>s.html.length>10));
 }finally{globalThis.fetch=oldFetch;}
});
test('live AoPS solutions have priority and all approaches are returned',async()=>{
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({parse:{text:{'*':'<div class="mw-parser-output"><h2>Problem</h2><p>A complete question here.</p><h2>Solution 1</h2><p>The first complete approach.</p><h2>Solution 2</h2><p>The second complete approach.</p></div>'}}});
 try{const p={...problems[0],title:'2099 AMC 10A Problems/Problem 1',extraSolutions:[]};const solutions=await getSolution(p);assert.equal(solutions.items.length,2);assert.ok(solutions.items.every(s=>s.sourceName==='AoPS Wiki'&&s.delivery==='live'));}finally{globalThis.fetch=oldFetch;}
});


test('year and problem-number ranges are inclusive and combine with contest/topic',()=>{
 const filters:ProblemFilters={contest:'AMC 10',topic:'Geometry',yearFrom:2015,yearTo:2020,numberFrom:10,numberTo:15};
 const p={contest:'AMC 10' as const,topics:['Geometry' as const],year:2015,number:10};
 assert.equal(matchesFilters(p,filters),true);
 assert.equal(matchesFilters({...p,year:2020,number:15},filters),true);
 for(const other of [{...p,year:2014},{...p,year:2021},{...p,number:9},{...p,number:16},{...p,contest:'AMC 12' as const},{...p,topics:['Algebra' as const]}])assert.equal(matchesFilters(other,filters),false);
 assert.equal(matchesFilters(p,{...filters,yearFrom:2015,yearTo:2015,numberFrom:10,numberTo:10}),true);
 assert.equal(matchesFilters({...p,number:11},{...filters,numberFrom:10,numberTo:10}),false);
});
test('open ranges use the contest limits and empty combinations stay empty',()=>{
 const filters:ProblemFilters={contest:'AIME',topic:'All topics',yearFrom:null,yearTo:null,numberFrom:1,numberTo:null};
 assert.equal(maxProblemNumber('AMC 10'),25);assert.equal(maxProblemNumber('AMC 12'),25);assert.equal(maxProblemNumber('AIME'),15);
 assert.equal(matchesFilters({contest:'AIME',topics:[],year:2000,number:15},filters),true);
 assert.equal(matchesFilters({contest:'AIME',topics:[],year:2024,number:16},filters),false);
 assert.equal(problems.filter(p=>matchesFilters(p,{...filters,yearFrom:1900,yearTo:1900})).length,0);
 const selected=problems.filter(p=>matchesFilters(p,{...filters,yearFrom:2020,yearTo:2024,numberFrom:10,numberTo:15}));assert.ok(selected.length>0);
});

test('expanded bank substantially increases AMC 12, AIME, and source-backed topic coverage',()=>{
 assert.ok(problems.filter(p=>p.contest==='AMC 12').length>=1200);
 assert.ok(problems.filter(p=>p.contest==='AIME').length>=1000);
 assert.ok(problems.filter(p=>p.topics.length).length/problems.length>0.95);
 const provenance=JSON.parse(fs.readFileSync('data/publisher-topics.json','utf8'));
 for(const [id,record] of Object.entries(provenance.records) as [string,{sourceUrl:string;concepts:string[];topics:string[]}][]){assert.ok(record.sourceUrl.startsWith('https://live.poshenloh.com/past-contests/'));assert.ok(record.concepts.length||!record.topics.length,id);const p=problems.find(p=>p.id===id);assert.ok(p,id);assert.ok(record.topics.every(t=>p.topics.includes(t as any)),id);}
});
test('mixed sets honor all filters, balance contests, and never repeat IDs',()=>{
 const filters={contests:['AMC 12','AIME'] as const,topics:['Geometry','Algebra'] as const,yearFrom:2010,yearTo:2020,numberFrom:5,numberTo:12};
 const pool=problems.filter(p=>matchesSetFilters(p,{...filters,contests:[...filters.contests],topics:[...filters.topics]}));
 const set=chooseSet([...pool,...pool],10,()=>0.5);
 assert.equal(set.length,10);assert.equal(new Set(set.map(p=>p.id)).size,10);
 assert.equal(set.filter(p=>p.contest==='AIME').length,5);
 for(const p of set){assert.ok(p.year>=2010&&p.year<=2020&&p.number>=5&&p.number<=12);assert.ok(p.topics.includes('Geometry')||p.topics.includes('Algebra'));}
 assert.deepEqual(problems.filter(p=>matchesSetFilters(p,{...filters,contests:[],topics:[]})),[]);
 for(const count of [0,1.5,MAX_SET_SIZE+1])assert.throws(()=>chooseSet(pool,count));
 assert.throws(()=>chooseSet(pool.slice(0,2),3));
 assert.equal(chooseSet(pool,1).length,1);
});
test('bounded parallel operations preserve question order and cap concurrency',async()=>{
 let active=0,maxActive=0;
 const result=await mapLimit([1,2,3,4,5],2,async n=>{active++;maxActive=Math.max(active,maxActive);await new Promise(resolve=>setTimeout(resolve,6-n));active--;return n*2;});
 assert.deepEqual(result,[2,4,6,8,10]);assert.equal(maxActive,2);
});
test('set submission grades mixed formats and blanks, without returning solution bodies',async()=>{
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:503});
 try{
  const amc=problems.find(p=>p.contest==='AMC 12')!,aime=problems.find(p=>p.contest==='AIME')!,blank=problems.find(p=>p.contest==='AMC 10')!;
  const res=await checkSet(new Request('http://localhost/api/check-set',{method:'POST',body:JSON.stringify({answers:[{id:amc.id,answer:amc.answer.toLowerCase()},{id:aime.id,answer:aime.answer.padStart(3,'0')},{id:blank.id,answer:''}]})}));
  assert.equal(res.status,200);const data=await res.json();assert.equal(data.correct,2);assert.equal(data.total,3);assert.equal(data.unanswered,1);assert.equal(data.results[2].correct,false);assert.deepEqual(data.results.map((r:any)=>r.id),[amc.id,aime.id,blank.id]);assert.ok(data.results.every((r:any)=>!('solution' in r)));
 }finally{globalThis.fetch=oldFetch;}
});
test('set API rejects malformed, repeated, unknown, oversized, and invalid answers before grading',async()=>{
 const p=problems.find(p=>p.contest==='AIME')!;
 for(const [body,status] of [[null,400],[{answers:[]},400],[{answers:Array(51).fill({id:p.id,answer:'1'})},400],[{answers:[{id:p.id,answer:'1'},{id:p.id,answer:'2'}]},400],[{answers:[{id:'missing',answer:'A'}]},404],[{answers:[{id:p.id,answer:'1000'}]},400],[{answers:[{id:p.id,answer:1}]},400],[{answers:[null]},400]] as const){const r=await checkSet(new Request('http://localhost/api/check-set',{method:'POST',body:JSON.stringify(body)}));assert.equal(r.status,status);}
 const badJSON=await checkSet(new Request('http://localhost/api/check-set',{method:'POST',body:'{'}));assert.equal(badJSON.status,400);
});

test('all six contests and every olympiad topic are backed by real archived problems',()=>{
 for(const contest of CONTESTS)assert.ok(problems.some(p=>p.contest===contest),contest);
 for(const contest of ['USAJMO','USAMO','IMO'] as const){assert.equal(maxProblemNumber(contest),6);for(const topic of ['Algebra','Geometry','Number theory','Combinatorics'] as const)assert.ok(problems.some(p=>p.contest===contest&&p.topics.includes(topic)),contest+' '+topic);}
 const report=JSON.parse(fs.readFileSync('data/olympiad-import-report.json','utf8'));
 for(const [path,record] of Object.entries(report.assets) as [string,{problem:string;sourceUrl:string;page:number}][]){assert.ok(fs.existsSync('public'+path));assert.match(record.sourceUrl,/^https:\/\/web.evanchen.cc\/exams\/IMO-20\d\d-notes.pdf$/);assert.ok(record.page>=1);assert.ok(problems.some(p=>p.id===record.problem),record.problem);}
});
test('proof question responses contain only statements and published proof solutions stay available offline',async()=>{
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:503});
 try{for(const contest of ['USAJMO','USAMO','IMO'] as const){const p=problems.find(p=>p.contest===contest)!;const question=await getProblem(p);assert.equal(question.contest,contest);assert.deepEqual(question.choicesHtml,[]);for(const field of ['answer','solution','extraSolutions','solutionFormat','topicSource'])assert.equal(field in question,false);const solutions=await getSolution(p);assert.ok(solutions.items.length>=1);assert.ok(solutions.items.every(s=>s.html.length>20&&s.sourceUrl));if(contest==='IMO'){assert.match(solutions.items[0].html,/proof-pages/);assert.equal(solutions.items[0].sourceName,'Evan Chen');}}}finally{globalThis.fetch=oldFetch;}
});
test('both grading APIs reject proof problems explicitly instead of assigning a false grade',async()=>{
 for(const contest of ['USAJMO','USAMO','IMO'] as const){const p=problems.find(p=>p.contest===contest)!;const r=await checkSingle(new Request('http://localhost/api/check',{method:'POST',body:JSON.stringify({id:p.id,answer:'A'})}));assert.equal(r.status,400);assert.match((await r.json()).error,/cannot be automatically graded/);const set=await checkSet(new Request('http://localhost/api/check-set',{method:'POST',body:JSON.stringify({answers:[{id:p.id,answer:''}]})}));assert.equal(set.status,400);assert.match((await set.json()).error,/cannot be automatically graded/);}
});
test('mixed olympiad sets respect number limits and preserve original diagram pages safely',()=>{
 const pool=problems.filter(p=>matchesSetFilters(p,{contests:['AMC 12','USAJMO','USAMO','IMO'],topics:[],yearFrom:2020,yearTo:2024,numberFrom:1,numberTo:6}));const selected=chooseSet(pool,12,()=>0.4);for(const contest of ['AMC 12','USAJMO','USAMO','IMO'])assert.equal(selected.filter(p=>p.contest===contest).length,3);
 assert.equal(safeImageURL('/proof-pages/abcdef.svg'),'/proof-pages/abcdef.svg');assert.equal(safeImageURL('/proof-pages/../../secrets.svg'),null);
 for(const file of fs.readdirSync('public/proof-pages')){const svg=fs.readFileSync('public/proof-pages/'+file,'utf8');const root=parseHTML(svg).document.querySelector('svg');assert.ok(root,file);assert.equal(root.querySelectorAll('script,foreignObject,iframe,object,embed').length,0,file);for(const el of [root,...Array.from(root.querySelectorAll('*'))])for(const attr of Array.from(el.attributes)){assert.ok(!/^on/i.test(attr.name),file);if(/^(href|xlink:href)$/i.test(attr.name))assert.ok(attr.value.startsWith('#')||attr.value.startsWith('data:image/'),file);}}
});

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
 for(const p of problems){assert.ok(p.sourceUrl.endsWith(p.title.replace(/ /g,'_')),p.id);assert.match(p.sourceUrl,/^https:\/\/artofproblemsolving.com\/wiki\/index.php\//);assert.ok(p.problem.length>10&&p.solution.length>10,p.id);assert.ok(!p.problem.includes('[asy]')&&!p.solution.includes('[asy]'));if(p.contest==='AIME'){assert.match(p.answer,/^\d{1,3}$/);assert.ok(+p.answer<=999);assert.ok(p.number<=15);}else{assert.match(p.answer,/^[A-E]$/);if(p.choices.length)assert.deepEqual(p.choices.map(c=>c.letter),['A','B','C','D','E']);assert.ok(p.choices.every(c=>c.tex.length>0),p.id);}}
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
 assert.equal(problems.filter(p=>matchesFilters(p,{...filters,yearFrom:1999,yearTo:1999})).length,0);
 const selected=problems.filter(p=>matchesFilters(p,{...filters,yearFrom:2020,yearTo:2024,numberFrom:10,numberTo:15}));assert.ok(selected.length>0);
});

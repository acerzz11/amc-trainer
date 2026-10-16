import {test} from 'node:test';
import assert from 'node:assert/strict';
import {problems,judge,normalizeAnswer} from '../lib/problems';
import {renderText,cleanWikiHTML,splitWiki,extractKey,math} from '../lib/render';
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
 const html=cleanWikiHTML('<p onclick="bad()">Test <img class="latex" alt="$x^2$" src="/x"/><script>alert(1)</script><a href="javascript:bad()">unsafe</a><img src="https://evil.example/a.png"/><img alt="[asy]x[/asy]" src="https://latex.artofproblemsolving.com/a.png"/></p>');
 assert.ok(html.includes('katex'));assert.ok(html.includes('Contest problem diagram'));assert.ok(!html.includes('onclick'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('script'));assert.ok(!html.includes('evil.example'));
});
test('problem/solution separation does not expose the solution in the question',()=>{
 const html='<div class="mw-parser-output"><h2>Problem</h2><p>QUESTION</p><h2>Solution 1</h2><p>SECRET</p><h2>See Also</h2><p>RELATED</p></div>';const out=splitWiki(html);assert.ok(out.problemHtml.includes('QUESTION'));assert.ok(!out.problemHtml.includes('SECRET'));assert.ok(out.solutionHtml.includes('SECRET'));assert.ok(!out.solutionHtml.includes('RELATED'));
 assert.equal(extractKey('<ol><li>B</li><li>D</li></ol>',2,false),'D');assert.equal(extractKey('<ol><li>007</li></ol>',1,true),'7');assert.equal(extractKey('<ol><li>guess</li></ol>',1,false),null);
});
test('archive text escapes HTML and renders inline/display equations',()=>{const html=renderText('<script>alert(1)</script> $x^2$ and \\[x=3\\]');assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('katex-display'));});
test('all answer choices parse as valid TeX',()=>{const bad=[];for(const p of problems)for(const c of p.choices){if(math(c.tex).includes('katex-error'))bad.push(`${p.id} ${c.letter}: ${c.tex}`);}assert.deepEqual(bad,[])});

test('all cached questions and solutions render without TeX errors',()=>{const bad=problems.filter(p=>renderText(p.problem).includes('katex-error')||renderText(p.solution).includes('katex-error')).map(p=>p.id);assert.deepEqual(bad,[])});

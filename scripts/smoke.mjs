import fs from 'node:fs';import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('data/problems.json','utf8'));const base=process.env.BASE_URL || 'http://127.0.0.1:3000';
for(const contest of ['AMC 8','AMC 10','AMC 12','AIME'])for(const topic of ['Algebra','Geometry','Number theory','Combinatorics']){
 const p=bank.find(p=>p.contest===contest&&p.topics.includes(topic));assert.ok(p);
 const res=await fetch(base+'/api/problem?id='+p.id);assert.equal(res.status,200);const q=await res.json();assert.equal(q.id,p.id);assert.ok(q.problemHtml);assert.equal('answer'in q,false);assert.equal('solution'in q,false);assert.equal('extraSolutions'in q,false);
 const checked=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:contest==='AIME'?p.answer.padStart(3,'0'):p.answer.toLowerCase()})});assert.equal(checked.status,200);assert.equal((await checked.json()).correct,true);
}
const p=bank.find(p=>p.contest==='AMC 10');const wrong=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:p.answer==='A'?'B':'A'})});const miss=await wrong.json();assert.equal(miss.correct,false);assert.ok(miss.solution.items.length>0);assert.ok(miss.solution.items.every(s=>s.html.length>30&&s.sourceUrl&&s.sourceName));
const bad=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:'banana'})});assert.equal(bad.status,400);
assert.equal((await fetch(base+'/api/problem?id=does-not-exist')).status,404);
console.log('PASS: all 16 objective contest/topic combinations, correct grading, wrong-answer solutions, invalid input, unknown IDs, and no answers in question payloads.');

const diagramProblem=bank.find(p=>p.problem.includes('/diagrams/'));assert.ok(diagramProblem);
const diagramResponse=await fetch(base+'/api/problem?id='+diagramProblem.id);const diagramQuestion=await diagramResponse.json();assert.ok(diagramQuestion.problemHtml.includes('<img'));
for(const [,src] of diagramQuestion.problemHtml.matchAll(/<img[^>]*src="([^" ]+)"/g)){const image=await fetch(src.startsWith('/')?base+src:src);assert.equal(image.status,200);assert.match(image.headers.get('content-type')||'',/image/);}
const solutionsResponse=await fetch(base+'/api/solution?id='+p.id);assert.equal(solutionsResponse.status,200);assert.ok((await solutionsResponse.json()).items.length>=1);
console.log('PASS: diagram problem, image HTTP delivery, and solutions list.');

const mixed=bank.filter(p=>p.contest==='AMC 8').slice(0,3);
const batch=await fetch(base+'/api/check-set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:mixed.map((p,i)=>({id:p.id,answer:i===0?'':i===1?(p.answer==='A'?'B':'A'):p.answer}))})});
assert.equal(batch.status,200);const review=await batch.json();assert.equal(review.total,3);assert.equal(review.correct,1);assert.equal(review.unanswered,1);assert.deepEqual(review.results.map(r=>r.id),mixed.map(p=>p.id));assert.ok(review.results.every(r=>!('solution' in r)));
console.log('PASS: single-contest set grading, incorrect/blank answers, and lazy solutions.');
const rejected=await fetch(base+'/api/check-set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:['AMC 8','AIME'].map(c=>{const p=bank.find(p=>p.contest===c);return {id:p.id,answer:p.answer};})})});assert.equal(rejected.status,400);assert.match((await rejected.json()).error,/only one contest/);

for(const contest of ['USAJMO','USAMO','IMO']){
 for(const topic of ['Algebra','Geometry','Number theory','Combinatorics']){
  const p=bank.find(p=>p.contest===contest&&p.topics.includes(topic));assert.ok(p);const response=await fetch(base+'/api/problem?id='+p.id);assert.equal(response.status,200);const q=await response.json();assert.equal(q.contest,contest);assert.deepEqual(q.choicesHtml,[]);for(const field of ['answer','solution','extraSolutions'])assert.equal(field in q,false);
 }
 const p=bank.find(p=>p.contest===contest);const response=await fetch(base+'/api/solution?id='+p.id);assert.equal(response.status,200);const solution=await response.json();assert.ok(solution.items.length>0);if(contest==='IMO')for(const [,src] of solution.items.flatMap(s=>[...s.html.matchAll(/src="(\/proof-pages\/[^"]+)"/g)])){const image=await fetch(base+src);assert.equal(image.status,200);assert.match(image.headers.get('content-type')||'',/image\/svg/);}
 const denied=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:'A'})});assert.equal(denied.status,400);
}
console.log('PASS: all 12 olympiad/topic combinations, published proofs, original IMO page assets, and explicit automatic-grading rejection.');

const repaired=await fetch(base+'/api/solution?id=1991-aime-5');assert.equal(repaired.status,200);const approaches=(await repaired.json()).items;assert.ok(approaches.some(s=>s.html.includes('0&lt;\\frac{a}{b}&lt;1.')&&s.html.includes('<msup>')));
for(const id of ['2023-imo-5','2022-usajmo-3','2022-usamo-2','2021-usamo-3','2009-usamo-3','2004-imo-3']){const r=await fetch(base+'/api/problem?id='+id);assert.equal(r.status,200);const q=await r.json();assert.doesNotMatch(q.problemHtml,/\\begin\{asy\}/);for(const [,src] of q.problemHtml.matchAll(/src="(\/diagrams\/[^" ]+)"/g))assert.equal((await fetch(base+src)).status,200);}
console.log('PASS: repaired AIME inequality/exponent and six original olympiad statement figures.');

import fs from 'node:fs';import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('data/problems.json','utf8'));const base=process.env.BASE_URL || 'http://127.0.0.1:3000';
for(const contest of ['AMC 10','AMC 12','AIME'])for(const topic of ['Algebra','Geometry','Number theory','Combinatorics']){
 const p=bank.find(p=>p.contest===contest&&p.topics.includes(topic));assert.ok(p);
 const res=await fetch(base+'/api/problem?id='+p.id);assert.equal(res.status,200);const q=await res.json();assert.equal(q.id,p.id);assert.ok(q.problemHtml);assert.equal('answer'in q,false);assert.equal('solution'in q,false);assert.equal('extraSolutions'in q,false);
 const checked=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:contest==='AIME'?p.answer.padStart(3,'0'):p.answer.toLowerCase()})});assert.equal(checked.status,200);assert.equal((await checked.json()).correct,true);
}
const p=bank.find(p=>p.contest==='AMC 10');const wrong=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:p.answer==='A'?'B':'A'})});const miss=await wrong.json();assert.equal(miss.correct,false);assert.ok(miss.solution.items.length>0);assert.ok(miss.solution.items.every(s=>s.html.length>30&&s.sourceUrl&&s.sourceName));
const bad=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:'banana'})});assert.equal(bad.status,400);
assert.equal((await fetch(base+'/api/problem?id=does-not-exist')).status,404);
console.log('PASS: all 12 contest/topic combinations, correct grading, wrong-answer solutions, invalid input, unknown IDs, and no answers in question payloads.');

const diagramProblem=bank.find(p=>p.problem.includes('/diagrams/'));assert.ok(diagramProblem);
const diagramResponse=await fetch(base+'/api/problem?id='+diagramProblem.id);const diagramQuestion=await diagramResponse.json();assert.ok(diagramQuestion.problemHtml.includes('<img'));
for(const [,src] of diagramQuestion.problemHtml.matchAll(/<img[^>]*src="([^" ]+)"/g)){const image=await fetch(src.startsWith('/')?base+src:src);assert.equal(image.status,200);assert.match(image.headers.get('content-type')||'',/image/);}
const solutionsResponse=await fetch(base+'/api/solution?id='+p.id);assert.equal(solutionsResponse.status,200);assert.ok((await solutionsResponse.json()).items.length>=1);
console.log('PASS: diagram problem, image HTTP delivery, and solutions list.');

const mixed=['AMC 10','AMC 12','AIME'].map(c=>bank.find(p=>p.contest===c));
const batch=await fetch(base+'/api/check-set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:mixed.map((p,i)=>({id:p.id,answer:i===0?'':i===1?(p.answer==='A'?'B':'A'):p.answer.padStart(3,'0')}))})});
assert.equal(batch.status,200);const review=await batch.json();assert.equal(review.total,3);assert.equal(review.correct,1);assert.equal(review.unanswered,1);assert.deepEqual(review.results.map(r=>r.id),mixed.map(p=>p.id));assert.ok(review.results.every(r=>!('solution' in r)));
console.log('PASS: mixed set grading, leading zeroes, incorrect/blank answers, and lazy solutions.');

import fs from 'node:fs';import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('data/problems.json','utf8'));const base=process.env.BASE_URL || 'http://127.0.0.1:3000';
for(const contest of ['AMC 10','AMC 12','AIME'])for(const topic of ['Algebra','Geometry','Number theory','Combinatorics']){
 const p=bank.find(p=>p.contest===contest&&p.topics.includes(topic));assert.ok(p);
 const res=await fetch(base+'/api/problem?id='+p.id);assert.equal(res.status,200);const q=await res.json();assert.equal(q.id,p.id);assert.ok(q.problemHtml);assert.equal('answer'in q,false);assert.equal('solution'in q,false);
 const checked=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:contest==='AIME'?p.answer.padStart(3,'0'):p.answer.toLowerCase()})});assert.equal(checked.status,200);assert.equal((await checked.json()).correct,true);
}
const p=bank.find(p=>p.contest==='AMC 10');const wrong=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:p.answer==='A'?'B':'A'})});const miss=await wrong.json();assert.equal(miss.correct,false);assert.ok(miss.solution.html.length>30);
const bad=await fetch(base+'/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,answer:'banana'})});assert.equal(bad.status,400);
assert.equal((await fetch(base+'/api/problem?id=does-not-exist')).status,404);
console.log('PASS: all 12 contest/topic combinations, correct grading, wrong-answer solutions, invalid input, unknown IDs, and no answers in question payloads.');

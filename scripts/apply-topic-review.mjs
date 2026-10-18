import fs from 'node:fs';
const review=JSON.parse(fs.readFileSync('data/topic-review.json','utf8'));
const bank=JSON.parse(fs.readFileSync('data/problems.json','utf8'));
for(const p of bank){const r=review.records[p.id];if(!r)continue;if(r.sourceUrl!==p.sourceUrl)throw Error('Topic review source mismatch: '+p.id);p.topics=[...new Set([...p.topics,...r.topics])];if(!p.topicSource)p.topicSource='Editorial review; see data/topic-review.json';}
fs.writeFileSync('data/problems.json',JSON.stringify(bank));
fs.writeFileSync('public/catalog.json',JSON.stringify(bank.map(p=>Object.fromEntries(['id','title','contest','year','variant','number','topics','sourceUrl'].map(k=>[k,p[k]])))));
console.log('Topic review applied; '+bank.filter(p=>!p.topics.length).length+' unclassified problems.');

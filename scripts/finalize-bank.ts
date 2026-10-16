import fs from 'node:fs';
import {renderText,math} from '../lib/render';
const data=JSON.parse(fs.readFileSync('data/problems.json','utf8'));
const omitted:any[]=[],fixed:any[]=[];
const out=data.filter((p:any)=>{
 if(p.choices.some((c:any)=>math(c.tex).includes('katex-error'))){p.problem=p.originalProblem;p.choices=[];fixed.push(p.id);}
 delete p.originalProblem;
 // Remove a leaked section heading, not any mathematical content.
 p.problem=p.problem.replace(/\nSolution\s*$/,'').trim();
 if(renderText(p.problem).includes('katex-error')||renderText(p.solution).includes('katex-error')){omitted.push(p.id);return false;}
 return true;
});
fs.writeFileSync('data/problems.json',JSON.stringify(out));
fs.writeFileSync('public/catalog.json',JSON.stringify(out.map((p:any)=>Object.fromEntries(['id','title','contest','year','variant','number','topics','sourceUrl'].map(k=>[k,p[k]])))));
fs.writeFileSync('data/validation-report.json',JSON.stringify({count:out.length,tagged:out.filter((p:any)=>p.topics.length).length,restoredOriginalChoiceLayout:fixed,omittedDueToInvalidSourceTex:omitted},null,2));
console.log(JSON.stringify({count:out.length,tagged:out.filter((p:any)=>p.topics.length).length,restoredOriginalChoiceLayout:fixed.length,omittedDueToInvalidSourceTex:omitted.length}));

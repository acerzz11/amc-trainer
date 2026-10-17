export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
import {findProblem,checkAnswer,normalizeAnswer} from '../../../lib/problems';
import {MAX_SET_SIZE,mapLimit} from '../../../lib/sets';
export async function POST(req:Request){
 let body:unknown;try{body=await req.json();}catch{return Response.json({error:'Invalid submission.'},{status:400});}
 const entries=(body as {answers?:unknown}|null)?.answers;
 if(!Array.isArray(entries)||!entries.length||entries.length>MAX_SET_SIZE)return Response.json({error:`Submit between 1 and ${MAX_SET_SIZE} answers.`},{status:400});
 const ids=new Set<string>();
 for(const entry of entries){
  if(!entry||typeof entry.id!=='string'||typeof entry.answer!=='string'||ids.has(entry.id))return Response.json({error:'Each problem must appear once with an answer or an empty string.'},{status:400});
  ids.add(entry.id);const problem=findProblem(entry.id);
  if(!problem)return Response.json({error:'A problem in this set was not found.'},{status:404});
  if(entry.answer.trim()&&normalizeAnswer(entry.answer,problem.contest==='AIME')===null)return Response.json({error:`Invalid answer for ${problem.title}.`},{status:400});
 }
 try{
  const results=await mapLimit(entries,8,async entry=>{const problem=findProblem(entry.id)!;const submitted=entry.answer.trim();const result=await checkAnswer(problem,submitted);return {id:problem.id,correct:!!submitted&&result.correct,answer:result.answer,submitted,unanswered:!submitted};});
  return Response.json({results,correct:results.filter(r=>r.correct).length,total:results.length,unanswered:results.filter(r=>r.unanswered).length});
 }catch{return Response.json({error:'Unable to grade the set. Your answers are still here; please retry.'},{status:500});}
}

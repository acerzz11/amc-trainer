export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import {findProblem,checkAnswer,normalizeAnswer,getSolution} from '../../../lib/problems';
export async function POST(req:Request){try{const body=await req.json() as {id?:string;answer?:string};if(typeof body.id!=='string'||typeof body.answer!=='string')return Response.json({error:'Enter an answer.'},{status:400});const p=findProblem(body.id);if(!p)return Response.json({error:'Problem not found.'},{status:404});if(normalizeAnswer(body.answer,p.contest==='AIME')===null)return Response.json({error:p.contest==='AIME'?'Enter a whole number from 0 to 999.':'Enter a letter from A to E.'},{status:400});const result=await checkAnswer(p,body.answer);return Response.json({...result,solution:!result.correct?await getSolution(p):null});}catch{return Response.json({error:'Unable to check this answer. Please try again.'},{status:500});}}

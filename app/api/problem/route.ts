export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import {findProblem,getProblem} from '../../../lib/problems';
export async function GET(req:Request){const id=new URL(req.url).searchParams.get('id');const p=id?findProblem(id):null;if(!p)return Response.json({error:'Problem not found.'},{status:404});return Response.json(await getProblem(p));}

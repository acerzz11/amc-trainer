import type {Contest,PublicProblem,Topic} from './types';
import {matchesFilters} from './filters';
export const MAX_SET_SIZE=50;
export type CatalogEntry=Pick<PublicProblem,'id'|'title'|'contest'|'year'|'variant'|'number'|'topics'|'sourceUrl'>;
export type SetFilters={contest:Contest;topics:Topic[];yearFrom:number|null;yearTo:number|null;numberFrom:number;numberTo:number|null};
export type SetResult={id:string;correct:boolean;answer:string;submitted:string;unanswered:boolean};
export type SetReview={results:SetResult[];correct:number;total:number;unanswered:number;proofCount?:number};
export function matchesSetFilters(p:CatalogEntry,f:SetFilters){
 return f.contest===p.contest&&(!f.topics.length||f.topics.some(t=>p.topics.includes(t)))
  &&matchesFilters(p,{...f,contest:p.contest,topic:'All topics'});
}
function shuffled<T>(items:T[],random:()=>number){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
// One contest per set; sampling without replacement keeps every question unique.
export function chooseSet(entries:CatalogEntry[],count:number,random:()=>number=Math.random):CatalogEntry[]{
 const unique=[...new Map(entries.map(p=>[p.id,p])).values()];
 if(!Number.isInteger(count)||count<1||count>MAX_SET_SIZE)throw Error(`Choose between 1 and ${MAX_SET_SIZE} problems.`);
 if(new Set(unique.map(p=>p.contest)).size>1)throw Error('A problem set can contain only one contest.');
 if(count>unique.length)throw Error(`Only ${unique.length} problems match. Reduce the set size or widen the filters.`);
 return shuffled(unique,random).slice(0,count);
}
export async function mapLimit<T,R>(items:T[],limit:number,fn:(item:T,index:number)=>Promise<R>):Promise<R[]>{
 const results=new Array<R>(items.length);let next=0;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const index=next++;results[index]=await fn(items[index],index);}}));return results;
}

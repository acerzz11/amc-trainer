import {isProofContest} from './contests';
import bank from '../data/problems.json';
import type {RecordProblem,PublicProblem,SolutionItem,SolutionResponse} from './types';
import {renderText,renderRich,math,splitWiki} from './render';
import {liveProblem,wikiPage} from './aops';
import {randomMathSolutions} from './randommath';
export const problems=bank as RecordProblem[];
export const findProblem=(id:string)=>problems.find(p=>p.id===id);
export async function getProblem(p:RecordProblem):Promise<PublicProblem>{
 let delivery:'live'|'archive'='archive',problemHtml=p.problemFormat==='html'?renderRich(p.problem):renderText(p.problem);
 let sourceName=p.archiveName||(p.problemFormat==='html'?'LIVE by Po-Shen Loh':'AoPS archive'),sourceUrl=p.archiveName?p.archiveUrl||p.sourceUrl:p.problemFormat==='html'?p.archiveUrl!:p.sourceUrl;
 try{const live=isProofContest(p.contest)?splitWiki(await wikiPage(p.title)):await liveProblem(p.title,p.number,p.contest==='AIME');if(live.problemHtml.length<25)throw Error('Incomplete problem');problemHtml=live.problemHtml;delivery='live';sourceName='AoPS Wiki';sourceUrl=p.sourceUrl;}catch{}
 // Explicit allowlist: supplemental solutions and publisher keys must never reach question responses.
 const {id,title,contest,year,variant,number,topics}=p;
 return {id,title,contest,year,variant,number,topics,sourceUrl,sourceName,problemHtml,choicesHtml:delivery==='archive'?p.choices.map(c=>({letter:c.letter,html:math(c.tex)})):[],delivery,sourceNote:delivery==='live'?'Fetched directly from AoPS.':`AoPS is unavailable. Showing saved content from ${sourceName}.`};
}
export async function getSolution(p:RecordProblem):Promise<SolutionResponse>{
 const items:SolutionItem[]=[];
 try{
  const parsed=splitWiki(await wikiPage(p.title));
  items.push(...parsed.solutions.map(s=>({...s,delivery:'live' as const,sourceName:'AoPS Wiki',sourceUrl:p.sourceUrl})));
 }catch{}
 if(!items.length){
  // Retain the complete original archive, then include every available alternative.
  items.push({title:'Solution',html:p.solutionFormat==='html'?renderRich(p.solution):renderText(p.solution),delivery:'archive',sourceName:p.archiveName||(p.solutionFormat==='html'?'LIVE by Po-Shen Loh':'AoPS archive'),sourceUrl:p.archiveName?p.archiveUrl||p.sourceUrl:p.solutionFormat==='html'?p.archiveUrl!:p.sourceUrl});
  const alternate=isProofContest(p.contest)?{items:[],url:''}:await randomMathSolutions(p);
  items.push(...alternate.items.map(s=>({...s,delivery:'live' as const,sourceName:'Random Math',sourceUrl:alternate.url})));
 }else if(isProofContest(p.contest)&&p.archiveName==='Evan Chen'){
  items.push({title:'Published solution notes',html:renderRich(p.solution),delivery:'archive',sourceName:p.archiveName,sourceUrl:p.archiveUrl!});
 }
 for(const s of p.extraSolutions||[])items.push({title:s.title,html:s.format==='html'?renderRich(s.content):renderText(s.content),delivery:'archive',sourceName:s.sourceName,sourceUrl:s.sourceUrl});
 const seen=new Set<string>();
 return {items:items.filter(s=>{const key=s.html.replace(/\s+/g,' ').trim();if(!key||seen.has(key))return false;seen.add(key);return true;})};
}
export function normalizeAnswer(input:string,aime:boolean):string|null{
 const value=input.trim().toUpperCase();if(aime)return /^\d{1,3}$/.test(value)?String(Number(value)):null;return /^[A-E]$/.test(value)?value:null;
}
export function judge(input:string,answer:string,aime:boolean){const normalized=normalizeAnswer(input,aime);return normalized!==null&&normalized===normalizeAnswer(answer,aime);}
export async function checkAnswer(p:RecordProblem,input:string){
 if(isProofContest(p.contest))throw Error('Proof problems require self-review with the published solutions.');
 let expected=p.answer,delivery='archive';try{const live=await liveProblem(p.title,p.number,p.contest==='AIME');expected=live.answer;delivery='live';}catch{}
 return {correct:judge(input,expected,p.contest==='AIME'),answer:expected,delivery};
}

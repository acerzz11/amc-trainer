import bank from '../data/problems.json';
import type {RecordProblem,PublicProblem} from './types';
import {renderText,math} from './render';
import {liveProblem, wikiPage} from './aops';
import {splitWiki} from './render';
export const problems=bank as RecordProblem[];
export const findProblem=(id:string)=>problems.find(p=>p.id===id);
export async function getProblem(p:RecordProblem):Promise<PublicProblem>{
 let delivery:'live'|'archive'='archive',problemHtml=renderText(p.problem);
 try{const live=await liveProblem(p.title,p.number,p.contest==='AIME');problemHtml=live.problemHtml;delivery='live';}catch{}
 const {answer,solution,problem,...safe}=p;
 return {...safe,problemHtml,choicesHtml:delivery==='archive'?p.choices.map(c=>({letter:c.letter,html:math(c.tex)})):[],delivery,sourceNote:delivery==='live'?'Fetched directly from the AoPS Wiki.':'AoPS is unavailable. Showing an archived AoPS problem.'};
}
export async function getSolution(p:RecordProblem){
 try{const parsed=splitWiki(await wikiPage(p.title));if(parsed.solutionHtml.length>30)return {html:parsed.solutionHtml,delivery:'live',sourceUrl:p.sourceUrl};}catch{}
 return {html:renderText(p.solution),delivery:'archive',sourceUrl:p.sourceUrl};
}
export function normalizeAnswer(input:string,aime:boolean):string|null{
 const value=input.trim().toUpperCase();if(aime)return /^\d{1,3}$/.test(value)?String(Number(value)):null;return /^[A-E]$/.test(value)?value:null;
}
export function judge(input:string,answer:string,aime:boolean){const normalized=normalizeAnswer(input,aime);return normalized!==null&&normalized===normalizeAnswer(answer,aime);}
export async function checkAnswer(p:RecordProblem,input:string){
 let expected=p.answer,delivery='archive';try{const live=await liveProblem(p.title,p.number,p.contest==='AIME');expected=live.answer;delivery='live';}catch{}
 return {correct:judge(input,expected,p.contest==='AIME'),answer:expected,delivery};
}

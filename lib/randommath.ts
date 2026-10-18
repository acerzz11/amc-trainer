import {parseHTML} from 'linkedom';
import {renderRich,protectMathHTML,type ParsedSolution} from './render';
import type {RecordProblem} from './types';
const origin='https://wiki.randommath.com';
const cache=new Map<string,{at:number;items:ParsedSolution[]}>();
export function randomMathURL(p:RecordProblem){
 const kind=p.contest.toLowerCase().replace(/ /g,'');
 const year=String(p.year)+(p.year===2021&&p.contest!=='AIME'?(p.variant.startsWith('Fall')?'-fall':'-spring'):'');
 const variant=p.variant.replace('Fall ','').toLowerCase();
 return `${origin}/en/${kind}/${year}${variant?'/part-'+variant:''}/problem-${p.number}`;
}
const identity=(s:string)=>s.replace(/Spring/gi,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
export function parseRandomMath(html:string,p:RecordProblem):ParsedSolution[]{
 const outer=parseHTML(protectMathHTML(html)).document;
 const template=outer.querySelector('template[slot="contents"]');if(!template)throw Error('Random Math content unavailable');
 const{document}=parseHTML('<html><body>'+template.innerHTML+'</body></html>');
 const root=document.body.firstElementChild;if(!root)throw Error('Empty source page');
 const title=root.querySelector('h1')?.textContent||'';
 if(identity(title)!==identity(p.title.replace(' Problems/Problem ',' Problem ')))throw Error('Random Math test/problem mismatch');
 const items:{title:string;raw:string}[]=[];let current:{title:string;raw:string}|null=null;
 for(const el of Array.from(root.children)){
  if(/The problems and solutions on this page are the property/i.test(el.textContent||''))continue;
  const heading=/^H[2-6]$/.test(el.tagName)?el:el.querySelector('strong,b');
  const label=(heading?.textContent||'').replace(/^¶\s*/,'').trim();
  if(/^Solution(?:s|\s|\d|:|$)/i.test(label)){
   current={title:label.replace(/:$/,''),raw:''};items.push(current);
   // A paragraph may include both a label and the first sentence.
   if(heading!==el){heading?.remove();if(el.textContent?.trim()||el.querySelector('img'))current.raw+=el.outerHTML;}
   continue;
  }
  if(/^H[12]$/.test(el.tagName)&&!/Solution/i.test(label)){current=null;continue;}
  if(current)current.raw+=el.outerHTML;
 }
 return items.map(s=>({title:s.title,html:renderRich(s.raw,origin)})).filter(s=>s.html.replace(/<[^>]*>/g,'').trim().length>10&&!s.html.includes('katex-error'));
}
export async function randomMathSolutions(p:RecordProblem){
 const url=randomMathURL(p),old=cache.get(url);if(old&&Date.now()-old.at<3600000)return {items:old.items,url};
 try{
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(3500)});
  if(!response.ok)throw Error('Random Math unavailable');
  const items=parseRandomMath(await response.text(),p);
  if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(url,{at:Date.now(),items});return {items,url};
 }catch{return {items:[],url};}
}

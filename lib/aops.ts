import {splitWiki,extractKey} from './render';
const API='https://artofproblemsolving.com/wiki/api.php';
const cache=new Map<string,{at:number;html:string}>();
export async function wikiPage(title:string):Promise<string>{
 const old=cache.get(title);if(old&&Date.now()-old.at<3600_000)return old.html;
 const params=new URLSearchParams({action:'parse',page:title,redirects:'1',prop:'text',format:'json',origin:'*'});
 const response=await fetch(`${API}?${params}`,{cache:'no-store',signal:AbortSignal.timeout(4500),headers:{'Accept':'application/json'}});
 if(!response.ok)throw new Error(`AoPS responded ${response.status}`);
 const body=await response.json() as {parse?:{text?:{'*'?:string}}};const html=body.parse?.text?.['*'];if(!html)throw new Error('AoPS page unavailable');
 if(cache.size>100)cache.delete(cache.keys().next().value!);cache.set(title,{at:Date.now(),html});return html;
}
export async function liveProblem(title:string,number:number,aime:boolean){
 const keyTitle=title.split(' Problems/')[0]+' Answer Key';
 const [html,key]=await Promise.all([wikiPage(title),wikiPage(keyTitle)]);
 const parsed=splitWiki(html);const answer=extractKey(key,number,aime);
 if(!answer||parsed.problemHtml.length<25)throw new Error('AoPS page could not be verified');
 return {...parsed,answer};
}

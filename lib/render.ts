import katex from 'katex';
import {parseHTML} from 'linkedom';
export const escapeHTML=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function math(tex:string,displayMode=false){
 const normalized=tex.replace(/\\begin\{(?:align\*?|eqnarray\*?)\}/g,'\\begin{aligned}').replace(/\\end\{(?:align\*?|eqnarray\*?)\}/g,'\\end{aligned}').replace(/\\textdollar/g,'\\$').replace(/\\overarc/g,'\\overgroup');
 return katex.renderToString(normalized,{displayMode,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml',maxExpand:1000});
}
export function renderText(source:string){
 const rx=/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$((?:\\\$|[^$])*?)(?<!\\)\$/g;
 let out='',last=0; for(const m of source.matchAll(rx)){out+=escapeHTML(source.slice(last,m.index)).replace(/\n/g,'<br>');out+=math(m[1]??m[2]??m[3]??m[4],m[1]!==undefined||m[2]!==undefined);last=m.index!+m[0].length;}out+=escapeHTML(source.slice(last)).replace(/\n/g,'<br>');return out;
}
const allowed=new Set(['P','DIV','SPAN','B','I','EM','STRONG','UL','OL','LI','BR','HR','H2','H3','H4','H5','DL','DT','DD','BLOCKQUOTE','TABLE','THEAD','TBODY','TR','TH','TD','SUP','SUB','A','IMG']);
export function cleanWikiHTML(html:string){
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 function clean(node:any):string {
  if(node.nodeType===3)return escapeHTML(node.textContent||'');
  if(node.nodeType!==1)return '';
  const tag=node.tagName;
  if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG'].includes(tag))return '';
  if(node.classList.contains('mw-editsection')||node.classList.contains('toc'))return '';
  if(tag==='IMG'){
   const alt=node.getAttribute('alt')||'';
   if(node.classList.contains('latex')&&!alt.includes('[asy]')) return math(alt.replace(/^\$|\$$/g,'').replace(/^\\\[|\\\]$/g,''),alt.startsWith('\\['));
   try { const url=new URL(node.getAttribute('src')||'','https://artofproblemsolving.com');if(url.protocol!=='https:'||!/(^|\.)artofproblemsolving\.com$/.test(url.hostname))return '';return `<img src="${escapeHTML(url.href)}" alt="${escapeHTML(alt.includes('[asy]')?'Contest problem diagram':alt)}" loading="lazy">`; }catch{return '';}
  }
  const content=Array.from(node.childNodes).map(clean).join('');
  if(!allowed.has(tag))return content;
  if(tag==='A'){try{const url=new URL(node.getAttribute('href')||'','https://artofproblemsolving.com');if(url.protocol==='https:')return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${content}</a>`;}catch{}return content;}
  return `<${tag.toLowerCase()}>${content}</${tag.toLowerCase()}>`;
 }
 return Array.from(document.body.childNodes).map(clean).join('');
}
export function splitWiki(html:string){
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 const root=document.querySelector('.mw-parser-output')||document.body;
 let section:'ignore'|'problem'|'solution'='ignore',problem='',solution='';
 for(const el of Array.from(root.children)){
  const header=/^H[1-6]$/.test(el.tagName)||el.classList.contains('mw-heading');const title=el.textContent?.trim()||'';
  if(header){if(/^Problem(?:\s|$)/i.test(title))section='problem';else if(/Solution|Diagram/i.test(title)&&!/Video/i.test(title))section='solution';else if(!/^Solution/i.test(title))section='ignore';}
  if(section==='problem'&&!header)problem+=el.outerHTML;
  if(section==='solution')solution+=el.outerHTML;
 }
 if(!problem){for(const el of Array.from(root.children)){if(/^H[1-6]$/.test(el.tagName)&&/Solution/i.test(el.textContent||''))break;if(!el.classList.contains('toc')&&!/^H[1-6]$/.test(el.tagName))problem+=el.outerHTML;}}
 return {problemHtml:cleanWikiHTML(problem),solutionHtml:cleanWikiHTML(solution)};
}
export function extractKey(html:string,number:number,aime:boolean):string|null{
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 for(const list of Array.from(document.querySelectorAll('ol'))){const items=Array.from(list.children).filter(el=>el.tagName==='LI');const text=items[number-1]?.textContent?.trim();if(!text)continue;
  if(aime&&/^\d{1,3}$/.test(text))return String(Number(text));
  if(!aime&&/^[A-E]$/.test(text))return text;
 }
 return null;
}

import katex from 'katex';
import {parseHTML} from 'linkedom';
export const escapeHTML=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function math(tex:string,displayMode=false){
 const normalized=tex.replace(/\\begin\{(?:align\*?|eqnarray\*?)\}/g,'\\begin{aligned}').replace(/\\end\{(?:align\*?|eqnarray\*?)\}/g,'\\end{aligned}').replace(/\\textdollar/g,'\\$').replace(/\\overarc/g,'\\overgroup').replace(/\\root\{([^{}]+)\}\\of\{([^{}]+)\}/g,'\\sqrt[$1]{$2}').replace(/\\makebox\[[^\]]*\]\{\}/g,'\\phantom{x}').replace(/\\label\{[^{}]*\}/g,'');
 return katex.renderToString(normalized,{displayMode,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml',maxExpand:1000,macros:{'\\NN':'\\mathbb{N}','\\ZZ':'\\mathbb{Z}','\\QQ':'\\mathbb{Q}','\\RR':'\\mathbb{R}','\\CC':'\\mathbb{C}','\\ol':'\\overline{#1}','\\abs':'\\left|#1\\right|','\\eps':'\\varepsilon','\\mbox':'\\text{#1}','\\hdots':'\\cdots','\\ensuremath':'#1','\\hfill':'\\quad','\\break':'\\allowbreak','\\linebreak':'\\allowbreak','\\indent':'\\quad','\\vspace':'\\vphantom{#1}','\\cent':'\\text{¢}','\\dg':'^{\\circ}','\\half':'\\frac{1}{2}','\\vdotswithin':'\\vphantom{#1}\\vdots'}});
}
export function renderText(source:string){
 // Preserve cross-references from labeled source equations without exposing TeX control names.
 const labels=new Map<string,string>();
 for(const m of source.matchAll(/\\begin\{(?:aligned|align\*?|equation\*?)\}([\s\S]*?)\\end\{(?:aligned|align\*?|equation\*?)\}/g)){const label=m[1].match(/\\label\{([^{}]+)\}/),tag=m[1].match(/\\tag\{([^{}]+)\}/);if(label&&tag)labels.set(label[1],tag[1]);}
 source=source.replace(/\\ref\{([^{}]+)\}/g,(_,key)=>labels.get(key)||key);
 const rx=/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$((?:\\\$|[^$])*?)(?<!\\)\$/g;
 let out='',last=0; for(const m of source.matchAll(rx)){out+=escapeHTML(source.slice(last,m.index)).replace(/\n/g,'<br>');out+=math(m[1]??m[2]??m[3]??m[4],m[1]!==undefined||m[2]!==undefined);last=m.index!+m[0].length;}out+=escapeHTML(source.slice(last)).replace(/\n/g,'<br>');return out;
}
const allowed=new Set(['P','DIV','SPAN','B','I','EM','STRONG','UL','OL','LI','BR','HR','H2','H3','H4','H5','DL','DT','DD','BLOCKQUOTE','TABLE','THEAD','TBODY','TR','TH','TD','SUP','SUB','A','IMG','FIGURE','FIGCAPTION']);
const imageHosts=['artofproblemsolving.com','wiki.randommath.com','live.poshenloh.com'];
export function safeImageURL(src:string,baseURL='https://artofproblemsolving.com'){
 if(/^\/(?:diagrams|proof-pages)\//.test(src))return /^\/(?:diagrams|proof-pages)\/[a-f0-9]+\.(?:svg|png|jpg|webp)$/.test(src)?src:null;
 try{const url=new URL(src,baseURL);if(url.protocol==='https:'&&imageHosts.some(h=>url.hostname===h||h==='artofproblemsolving.com'&&url.hostname.endsWith('.'+h)))return url.href;}catch{}
 return null;
}
export function cleanWikiHTML(html:string,baseURL='https://artofproblemsolving.com',renderLatex=false){
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 function clean(node:any):string {
  if(node.nodeType===3)return renderLatex?renderText(node.textContent||''):escapeHTML(node.textContent||'');
  if(node.nodeType!==1)return '';
  const tag=node.tagName;
  if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG'].includes(tag))return '';
  if(node.classList.contains('mw-editsection')||node.classList.contains('toc')||node.classList.contains('toc-anchor'))return '';
  // Re-render publisher KaTeX from its original TeX, never copy arbitrary styles/markup.
  if(node.classList.contains('katex-display')||node.classList.contains('katex')){
   const annotation=node.querySelector('annotation[encoding="application/x-tex"]');
   const mathNode=node.querySelector('math');
   const tex=annotation?.textContent||Array.from(mathNode?.childNodes||[]).filter((n:any)=>n.nodeType===3).map((n:any)=>n.textContent).join('');
   if(tex)return math(tex,node.classList.contains('katex-display'));
   throw new Error('Source math has no recoverable TeX');
  }
  if(tag==='IMG'){
   const alt=node.getAttribute('alt')||'';
   if(node.classList.contains('latex')&&!alt.includes('[asy]')) return math(alt.replace(/^\$|\$$/g,'').replace(/^\\\[|\\\]$/g,''),alt.startsWith('\\['));
   const url=safeImageURL(node.getAttribute('src')||'',baseURL);
   if(!url)throw new Error('Source contains an unsupported diagram');
   return `<img src="${escapeHTML(url)}" alt="${escapeHTML(!alt||alt.includes('[asy]')?'Contest problem diagram':alt)}" loading="lazy" decoding="async">`;
  }
  const content=Array.from(node.childNodes).map(clean).join('');
  if(!allowed.has(tag))return content;
  if(tag==='A'){try{const url=new URL(node.getAttribute('href')||'',baseURL);if(url.protocol==='https:')return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${content}</a>`;}catch{}return content;}
  if(tag==='BR'||tag==='HR')return `<${tag.toLowerCase()}>`;
  return `<${tag.toLowerCase()}>${content}</${tag.toLowerCase()}>`;
 }
 return Array.from(document.body.childNodes).map(clean).join('');
}
export const renderRich=(source:string,baseURL='https://live.poshenloh.com')=>cleanWikiHTML(source,baseURL,true);
export const renderChoice=(choice:{tex:string},format?:'html')=>format==='html'?renderRich(choice.tex):math(choice.tex);
export type ParsedSolution={title:string;html:string};
export function splitWiki(html:string){
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 const root=document.querySelector('.mw-parser-output')||document.body;
 let mode:'ignore'|'problem'|'solution'='ignore',problem='',current:{title:string;raw:string}|null=null;
 const rawSolutions:{title:string;raw:string}[]=[];
 for(const el of Array.from(root.children)){
  const heading=el.classList.contains('mw-heading')?el.querySelector('h1,h2,h3,h4,h5,h6'): /^H[1-6]$/.test(el.tagName)?el:null;
  const title=(heading?.textContent||'').replace(/\[edit\]/gi,'').trim();
  if(heading){
   if(/^Problem(?:\s|:|$)/i.test(title)){mode='problem';continue;}
   if(/^(?:(?:Video|Alternate|Alternative)\s+)?Solution(?:s|\s|:|$)/i.test(title)){
    mode='solution';current={title,raw:''};rawSolutions.push(current);continue;
   }
   // Subheadings such as Case 1 or Proof belong to the current solution.
   if(/^(See Also|References|External Links|Answer Key|Navigation)/i.test(title)||/^H[12]$/.test(heading.tagName)){mode='ignore';continue;}
  }
  if(mode==='problem')problem+=el.outerHTML;
  if(mode==='solution'&&current){
   const frame=el.querySelector('iframe');
   if(frame){const url=frame.getAttribute('src')||'';if(/^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\//.test(url))current.raw+=`<p><a href="${escapeHTML(url)}">Watch video solution</a></p>`;}
   current.raw+=el.outerHTML;
  }
 }
 if(!problem){for(const el of Array.from(root.children)){if(/Solution/i.test(el.textContent||'')&&(/^H[1-6]$/.test(el.tagName)||el.classList.contains('mw-heading')))break;if(!el.classList.contains('toc')&&!/^H[1-6]$/.test(el.tagName))problem+=el.outerHTML;}}
 const solutions=rawSolutions.map(s=>({title:s.title,html:cleanWikiHTML(s.raw)})).filter(s=>s.html.replace(/<[^>]*>/g,'').trim().length>0||s.html.includes('<img'));
 return {problemHtml:cleanWikiHTML(problem),solutions,solutionHtml:solutions.map(s=>`<h3>${escapeHTML(s.title)}</h3>${s.html}`).join('')};
}
export function extractKey(html:string,number:number,aime:boolean):string|null{
 const {document}=parseHTML('<html><body>'+html+'</body></html>');
 for(const list of Array.from(document.querySelectorAll('ol'))){const items=Array.from(list.children).filter(el=>el.tagName==='LI');const text=items[number-1]?.textContent?.trim();if(!text)continue;
  if(aime&&/^\d{1,3}$/.test(text))return String(Number(text));
  if(!aime&&/^[A-E]$/.test(text))return text;
 }
 return null;
}

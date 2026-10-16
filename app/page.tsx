'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {Contest,Topic,PublicProblem} from '../lib/types';
type Entry=Pick<PublicProblem,'id'|'title'|'contest'|'year'|'variant'|'number'|'topics'|'sourceUrl'>;
type Solution={html:string;delivery:string;sourceUrl:string};
const topics:Topic[]=['Algebra','Geometry','Number theory','Combinatorics'];
function randomPick<T>(list:T[]):T{const r=new Uint32Array(1);crypto.getRandomValues(r);return list[Math.floor(r[0]/4294967296*list.length)];}
export default function Home(){
 const [catalog,setCatalog]=useState<Entry[]>([]),[catalogReady,setCatalogReady]=useState(false);
 const [contest,setContest]=useState<Contest>('AMC 10'),[topic,setTopic]=useState<Topic|'All topics'>('All topics');
 const [problem,setProblem]=useState<PublicProblem|null>(null),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[answer,setAnswer]=useState(''),[error,setError]=useState('');
 const [result,setResult]=useState<{correct:boolean;answer:string}|null>(null),[solution,setSolution]=useState<Solution|null>(null),[solutionOpen,setSolutionOpen]=useState(false),[solutionBusy,setSolutionBusy]=useState(false);
 const seen=useRef<Set<string>>(new Set()),request=useRef(0),lock=useRef(false),initial=useRef(false),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{fetch('/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Entry[]>}).then(data=>{setCatalog(data);setCatalogReady(true)}).catch(()=>setError('The problem library could not load. Refresh to try again.'));},[]);
 const eligible=useMemo(()=>catalog.filter(p=>p.contest===contest&&(topic==='All topics'||p.topics.includes(topic))),[catalog,contest,topic]);
 async function load(id:string){
  const seq=++request.current;setBusy(true);setError('');
  try{const response=await fetch('/api/problem?id='+encodeURIComponent(id));const data=await response.json() as PublicProblem & {error?:string};if(!response.ok)throw Error(data.error||'Unable to load this problem.');if(seq!==request.current)return;
   setProblem(data);seen.current.add(id);setAnswer('');setResult(null);setSolution(null);setSolutionOpen(false);
  }catch(e){if(seq===request.current)setError(e instanceof Error?e.message:'Unable to load the problem. Please try again.');}finally{if(seq===request.current)setBusy(false);}
 }
 function generate(){if(busy||checking||solutionBusy||!eligible.length)return;const fresh=eligible.filter(p=>!seen.current.has(p.id));const pool=fresh.length?fresh:eligible.filter(p=>p.id!==problem?.id);load(randomPick(pool.length?pool:eligible).id);}
 useEffect(()=>{if(catalogReady&&!initial.current){initial.current=true;const list=catalog.filter(p=>p.contest==='AMC 10'&&p.topics.length&&p.number<=15);load(randomPick(list.length?list:catalog).id);}},[catalogReady]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!problem||busy||lock.current||result||solution)return;
  const trimmed=answer.trim();if(problem.contest==='AIME'?!/^\d{1,3}$/.test(trimmed):!(/^[A-E]$/i.test(trimmed))){setError(problem.contest==='AIME'?'Enter a whole number from 0 to 999.':'Choose or enter a letter from A to E.');input.current?.focus();return;}
  lock.current=true;setChecking(true);setError('');
  try{const response=await fetch('/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:problem.id,answer:trimmed})});const data=await response.json() as {correct:boolean;answer:string;solution:Solution|null;error?:string};if(!response.ok)throw Error(data.error);setResult(data);if(data.solution){setSolution(data.solution);setSolutionOpen(true);}}
  catch(e){setError(e instanceof Error?e.message:'Unable to check your answer. Try again.');}finally{lock.current=false;setChecking(false);}
 }
 async function reveal(){if(!problem||busy||checking)return;if(solution){setSolutionOpen(v=>!v);return;}setSolutionBusy(true);setError('');try{const response=await fetch('/api/solution?id='+encodeURIComponent(problem.id));const data=await response.json() as Solution & {error?:string};if(!response.ok)throw Error(data.error);setSolution(data);setSolutionOpen(true);}catch{setError('The solution could not load. Please try again or open the AoPS source.');}finally{setSolutionBusy(false);}}
 const sameFilters=problem&&problem.contest===contest&&(topic==='All topics'||problem.topics.includes(topic));
 const loading=busy||checking||solutionBusy;
 return <main className="trainer">
  <header className="site-header"><a href="/" className="site-name">AMCtrainer</a><a href="https://artofproblemsolving.com/wiki/index.php/AMC_Problems_and_Solutions" target="_blank" rel="noopener noreferrer">AoPS Wiki ↗</a></header>
  <p className="intro">Real contest problems, one at a time.</p>
  <section className="filters" aria-label="Problem filters">
   <div className="filter"><label htmlFor="contest">Contest</label><select id="contest" value={contest} onChange={e=>setContest(e.target.value as Contest)}><option>AMC 10</option><option>AMC 12</option><option>AIME</option></select></div>
   <div className="filter"><label htmlFor="topic">Topic</label><select id="topic" value={topic} onChange={e=>setTopic(e.target.value as Topic|'All topics')}><option>All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select></div>
   <button className="button primary generate" onClick={generate} disabled={loading||!eligible.length}>{busy?'Loading…':'New problem'}</button>
  </section>
  <p className="filter-note" aria-live="polite">{catalogReady?`${eligible.length.toLocaleString()} matching problems`:'Loading problem library…'}{problem&&!sameFilters?' · Select New problem to apply these filters.':''}</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <article className={`problem ${busy?'loading':''}`} aria-busy={busy}>
   {problem?<>
    <header className="problem-header"><h1>{problem.title.split(' Problems/')[0]} <span>· Problem {problem.number}</span></h1><a href={problem.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></header>
    <div className="problem-body math-content" dangerouslySetInnerHTML={{__html:problem.problemHtml}}/>
    {problem.contest!=='AIME'&&<div className={`answer-options ${problem.choicesHtml.some(c=>c.html.length>4000)?'long-options':''}`} role="group" aria-label="Answer choices">{['A','B','C','D','E'].map(letter=><button key={letter} aria-pressed={answer.toUpperCase()===letter} disabled={!!result||loading||!!solution} className={`answer-option ${answer.toUpperCase()===letter?'selected':''} ${result?.answer===letter?'right':''}`} onClick={()=>{setAnswer(letter);setError('')}}><span className="option-letter">{letter}</span>{problem.choicesHtml.find(c=>c.letter===letter)&&<span className="math-content" dangerouslySetInnerHTML={{__html:problem.choicesHtml.find(c=>c.letter===letter)!.html}}/>}</button>)}</div>}
    <form className="answer-form" onSubmit={submit}><label htmlFor="answer">Your answer <span>{problem.contest==='AIME'?'(0–999)':'(A–E)'}</span></label><div><input ref={input} id="answer" autoComplete="off" spellCheck={false} inputMode={problem.contest==='AIME'?'numeric':'text'} maxLength={problem.contest==='AIME'?3:1} placeholder={problem.contest==='AIME'?'000':'A–E'} value={answer} onChange={e=>{setAnswer(e.target.value.toUpperCase());setError('')}} disabled={!!result||loading||!!solution}/><button type="submit" className="button primary" disabled={!answer.trim()||loading||!!result||!!solution}>{checking?'Checking…':'Check answer'}</button><button type="button" className="text-button" onClick={reveal} disabled={loading}>{solutionBusy?'Loading…':solutionOpen?'Hide solution':'Show solution'}</button></div></form>
    {result&&<p className={`feedback ${result.correct?'correct':'incorrect'}`} role="status">{result.correct?'Correct.':`Not quite. The correct answer is ${problem.contest==='AIME'?result.answer.padStart(3,'0'):result.answer}.`} {result.correct?<button className="text-button" onClick={generate} disabled={loading||!eligible.length}>Next problem →</button>:<span>The solution is below.</span>}</p>}
    {!result&&solution&&<p className="revealed">Solution revealed. Choose a new problem for another attempt.</p>}
    <p className="source-note">{problem.delivery==='live'?'Fetched directly from AoPS.':'AoPS is currently unavailable. Showing an archived AoPS problem.'}</p>
   </>:<div className="empty"><p>{error?'Choose New problem to try again.':'Loading your first problem…'}</p></div>}
  </article>
  {solutionOpen&&solution&&<section className="solution" aria-label="AoPS solution"><header><h2>Solution</h2><a href={solution.sourceUrl+'#Solution'} target="_blank" rel="noopener noreferrer">View on AoPS ↗</a></header><p className="solution-source">{solution.delivery==='live'?'Fetched directly from the AoPS Wiki.':'Archived solution from AoPS Wiki contributors.'}</p><div className="math-content solution-body" dangerouslySetInnerHTML={{__html:solution.html}}/><button className="button" onClick={generate} disabled={loading||!eligible.length}>Next problem →</button></section>}
  <footer className="site-footer"><details><summary>Sources & coverage</summary><div><p>Problems are from real AMC 10, AMC 12, and AIME tests. We try the AoPS Wiki directly; when it blocks automated requests, we use a labeled archive from <a href="https://huggingface.co/datasets/zypchn/amc2k" target="_blank" rel="noopener noreferrer">amc2k</a> and <a href="https://huggingface.co/datasets/furonghuang-lab/Easy2Hard-Bench" target="_blank" rel="noopener noreferrer">Easy2Hard-Bench</a>.</p><p>The archive contains {catalog.length.toLocaleString()} selected problems from 2000–2024. It does not include every test question. Questions requiring unavailable diagrams are omitted. {catalog.filter(p=>p.topics.length).length} have topic labels verified by exact statement matches against the <a href="https://huggingface.co/datasets/qwedsacf/competition_math" target="_blank" rel="noopener noreferrer">MATH dataset</a>. Topic filters use only these labeled problems. Combinatorics includes probability.</p><p>Contest problems © MAA. Solutions credited to AoPS contributors. Independent practice tool, inspired by <a href="https://amctrivial.com" target="_blank" rel="noopener noreferrer">AMC Trivial</a>.</p></div></details></footer>
 </main>
}

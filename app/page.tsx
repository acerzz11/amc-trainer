'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CONTESTS,isProofContest} from '../lib/contests';
import ProblemSet from './components/ProblemSet';
import SolutionList from './components/SolutionList';
import {matchesFilters,maxProblemNumber} from '../lib/filters';
import type {Contest,Topic,PublicProblem,SolutionResponse} from '../lib/types';
type Entry=Pick<PublicProblem,'id'|'title'|'contest'|'year'|'variant'|'number'|'topics'|'sourceUrl'>;
type Solution=SolutionResponse;
const topics:Topic[]=['Algebra','Geometry','Number theory','Combinatorics'];
function randomPick<T>(list:T[]):T{const r=new Uint32Array(1);crypto.getRandomValues(r);return list[Math.floor(r[0]/4294967296*list.length)];}
export default function Home(){
 const [mode,setMode]=useState<'single'|'set'>('single');
 const [catalog,setCatalog]=useState<Entry[]>([]),[catalogReady,setCatalogReady]=useState(false);
 const [contest,setContest]=useState<Contest>('AMC 10'),[topic,setTopic]=useState<Topic|'All topics'>('All topics');
 const [yearFrom,setYearFrom]=useState<number|null>(null),[yearTo,setYearTo]=useState<number|null>(null);
 const [numberFrom,setNumberFrom]=useState(1),[numberTo,setNumberTo]=useState<number|null>(null);
 const [problem,setProblem]=useState<PublicProblem|null>(null),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[answer,setAnswer]=useState(''),[proof,setProof]=useState(''),[error,setError]=useState('');
 const [result,setResult]=useState<{correct:boolean;answer:string}|null>(null),[solution,setSolution]=useState<Solution|null>(null),[solutionOpen,setSolutionOpen]=useState(false),[solutionBusy,setSolutionBusy]=useState(false);
 const seen=useRef<Set<string>>(new Set()),request=useRef(0),lock=useRef(false),initial=useRef(false),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{fetch('/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Entry[]>}).then(data=>{setCatalog(data);setCatalogReady(true)}).catch(()=>setError('The problem library could not load. Refresh to try again.'));},[]);
 const years=useMemo(()=>[...new Set(catalog.map(p=>p.year))].sort((a,b)=>a-b),[catalog]);
 const maxNumber=maxProblemNumber(contest);
 const numbers=Array.from({length:maxNumber},(_,i)=>i+1);
 const filters=useMemo(()=>({contest,topic,yearFrom,yearTo,numberFrom,numberTo}),[contest,topic,yearFrom,yearTo,numberFrom,numberTo]);
 const eligible=useMemo(()=>catalog.filter(p=>matchesFilters(p,filters)),[catalog,filters]);
 function changeContest(value:Contest){setContest(value);const max=maxProblemNumber(value);setNumberFrom(n=>Math.min(n,max));setNumberTo(n=>n===null||n>=max?null:n);}
 async function load(id:string){
  const seq=++request.current;setBusy(true);setError('');
  try{const response=await fetch('/api/problem?id='+encodeURIComponent(id));const data=await response.json() as PublicProblem & {error?:string};if(!response.ok)throw Error(data.error||'Unable to load this problem.');if(seq!==request.current)return;
   setProblem(data);seen.current.add(id);setAnswer('');setProof('');setResult(null);setSolution(null);setSolutionOpen(false);
  }catch(e){if(seq===request.current)setError(e instanceof Error?e.message:'Unable to load the problem. Please try again.');}finally{if(seq===request.current)setBusy(false);}
 }
 function generate(){if(busy||checking||solutionBusy||!eligible.length)return;const fresh=eligible.filter(p=>!seen.current.has(p.id));const pool=fresh.length?fresh:eligible.filter(p=>p.id!==problem?.id);load(randomPick(pool.length?pool:eligible).id);}
 useEffect(()=>{if(catalogReady&&!initial.current){initial.current=true;const list=catalog.filter(p=>p.contest==='AMC 10'&&p.topics.length&&p.number<=15);load(randomPick(list.length?list:catalog).id);}},[catalogReady]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!problem||isProofContest(problem.contest)||busy||lock.current||result||solution)return;
  const trimmed=answer.trim();if(problem.contest==='AIME'?!/^\d{1,3}$/.test(trimmed):!(/^[A-E]$/i.test(trimmed))){setError(problem.contest==='AIME'?'Enter a whole number from 0 to 999.':'Choose or enter a letter from A to E.');input.current?.focus();return;}
  lock.current=true;setChecking(true);setError('');
  try{const response=await fetch('/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:problem.id,answer:trimmed})});const data=await response.json() as {correct:boolean;answer:string;solution:Solution|null;error?:string};if(!response.ok)throw Error(data.error);setResult(data);if(data.solution){setSolution(data.solution);setSolutionOpen(true);}}
  catch(e){setError(e instanceof Error?e.message:'Unable to check your answer. Try again.');}finally{lock.current=false;setChecking(false);}
 }
 async function reveal(){if(!problem||busy||checking)return;if(solution){setSolutionOpen(v=>!v);return;}setSolutionBusy(true);setError('');try{const response=await fetch('/api/solution?id='+encodeURIComponent(problem.id));const data=await response.json() as Solution & {error?:string};if(!response.ok)throw Error(data.error);setSolution(data);setSolutionOpen(true);}catch{setError('The solution could not load. Please try again or open the AoPS source.');}finally{setSolutionBusy(false);}}
 const sameFilters=problem&&matchesFilters(problem,filters);
 const loading=busy||checking||solutionBusy;
 return <main className="trainer">
  <header className="site-header"><a href="/" className="site-name">AMCtrainer</a><a href="https://artofproblemsolving.com/wiki/index.php/AMC_Problems_and_Solutions" target="_blank" rel="noopener noreferrer">AoPS Wiki ↗</a></header>
  <nav className="mode-switch" aria-label="Practice mode"><button type="button" aria-pressed={mode==='single'} onClick={()=>setMode('single')}>One problem</button><button type="button" aria-pressed={mode==='set'} onClick={()=>setMode('set')}>Problem set</button></nav>
  <div hidden={mode!=='single'}>
  <section className="filters" aria-label="Problem filters">
   <div className="filter"><label htmlFor="contest">Contest</label><select id="contest" value={contest} disabled={!catalogReady} onChange={e=>changeContest(e.target.value as Contest)}>{CONTESTS.map(c=><option key={c}>{c}</option>)}</select></div>
   <div className="filter"><label htmlFor="topic">Topic</label><select id="topic" value={topic} disabled={!catalogReady} onChange={e=>setTopic(e.target.value as Topic|'All topics')}><option>All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select></div>
   <button className="button primary generate" onClick={generate} disabled={loading||!eligible.length}>{busy?'Loading…':'New problem'}</button>
   <div className="range-filters">
    <fieldset className="filter range-filter" disabled={!catalogReady}><legend>Year range</legend><div className="range-inputs">
     <select aria-label="From year" value={yearFrom??''} onChange={e=>{const value=e.target.value?Number(e.target.value):null;setYearFrom(value);if(value!==null&&yearTo!==null&&value>yearTo)setYearTo(value);}}><option value="">Any</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
     <span aria-hidden="true">–</span>
     <select aria-label="To year" value={yearTo??''} onChange={e=>{const value=e.target.value?Number(e.target.value):null;setYearTo(value);if(value!==null&&yearFrom!==null&&value<yearFrom)setYearFrom(value);}}><option value="">Any</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
    </div></fieldset>
    <fieldset className="filter range-filter" disabled={!catalogReady}><legend>Difficulty (problem #)</legend><div className="range-inputs">
     <select aria-label="From problem number" value={numberFrom} onChange={e=>{const value=Number(e.target.value);setNumberFrom(value);if(numberTo!==null&&value>numberTo)setNumberTo(value===maxNumber?null:value);}}>{numbers.map(n=><option key={n} value={n}>{n}</option>)}</select>
     <span aria-hidden="true">–</span>
     <select aria-label="To problem number" value={numberTo??''} onChange={e=>{const value=e.target.value?Number(e.target.value):null;setNumberTo(value);if(value!==null&&value<numberFrom)setNumberFrom(value);}}><option value="">{maxNumber}</option>{numbers.filter(n=>n<maxNumber).map(n=><option key={n} value={n}>{n}</option>)}</select>
    </div></fieldset>
   </div>
  </section>
  <p className="filter-note" aria-live="polite">{catalogReady?(eligible.length?`${eligible.length.toLocaleString()} matching ${eligible.length===1?'problem':'problems'}`:'No matching problems. Widen the ranges or choose another topic.'):'Loading problem library…'}{eligible.length>0&&problem&&!sameFilters?' · Select New problem to apply these filters.':''}</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <article className={`problem ${busy?'loading':''}`} aria-busy={busy}>
   {problem?<>
    <header className="problem-header"><h1>{problem.title.split(' Problems/')[0]} <span>· Problem {problem.number}</span></h1><a href={problem.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></header>
    <div className="problem-body math-content" dangerouslySetInnerHTML={{__html:problem.problemHtml}}/>
    {!isProofContest(problem.contest)&&problem.contest!=='AIME'&&<div className={`answer-options ${problem.choicesHtml.some(c=>c.html.includes('<img')||c.html.replace(/<[^>]*>/g,'').length>160)?'long-options':''}`} role="group" aria-label="Answer choices">{['A','B','C','D','E'].map(letter=><button key={letter} aria-pressed={answer.toUpperCase()===letter} disabled={!!result||loading||!!solution} className={`answer-option ${answer.toUpperCase()===letter?'selected':''} ${result?.answer===letter?'right':''}`} onClick={()=>{setAnswer(letter);setError('')}}><span className="option-letter">{letter}</span>{problem.choicesHtml.find(c=>c.letter===letter)&&<span className="math-content" dangerouslySetInnerHTML={{__html:problem.choicesHtml.find(c=>c.letter===letter)!.html}}/>}</button>)}</div>}
    {isProofContest(problem.contest)?<section className="proof-work"><label htmlFor="proof-draft">Proof draft <span>(optional)</span></label><textarea id="proof-draft" rows={7} maxLength={20000} value={proof} onChange={e=>setProof(e.target.value)} placeholder="Write your reasoning here…" disabled={loading}/><button type="button" className="button" onClick={reveal} disabled={loading}>{solutionBusy?'Loading…':solutionOpen?'Hide solutions':'Show solutions'}</button></section>:<form className="answer-form" onSubmit={submit}><label htmlFor="answer">Your answer <span>{problem.contest==='AIME'?'(0–999)':'(A–E)'}</span></label><div><input ref={input} id="answer" autoComplete="off" spellCheck={false} inputMode={problem.contest==='AIME'?'numeric':'text'} maxLength={problem.contest==='AIME'?3:1} placeholder={problem.contest==='AIME'?'000':'A–E'} value={answer} onChange={e=>{setAnswer(e.target.value.toUpperCase());setError('')}} disabled={!!result||loading||!!solution}/><button type="submit" className="button primary" disabled={!answer.trim()||loading||!!result||!!solution}>{checking?'Checking…':'Check answer'}</button><button type="button" className="text-button" onClick={reveal} disabled={loading}>{solutionBusy?'Loading…':solutionOpen?'Hide solution':'Show solution'}</button></div></form>}
    {result&&<p className={`feedback ${result.correct?'correct':'incorrect'}`} role="status">{result.correct?'Correct.':`Not quite. The correct answer is ${problem.contest==='AIME'?result.answer.padStart(3,'0'):result.answer}.`} {result.correct?<button className="text-button" onClick={generate} disabled={loading||!eligible.length}>Next problem →</button>:null}</p>}
   </>:<div className="empty"><p>{error?'Choose New problem to try again.':'Loading your first problem…'}</p></div>}
  </article>
  {solutionOpen&&solution&&<><SolutionList solution={solution}/><div className="solution-next"><button className="button" onClick={generate} disabled={loading||!eligible.length}>Next problem →</button></div></>}
  </div>
  <div hidden={mode!=='set'}><ProblemSet catalog={catalog} ready={catalogReady}/></div>
  <footer className="site-footer"><details><summary>Sources & coverage</summary><div><p>Real AMC 8, AMC 10, AMC 12, AIME, USAJMO, USAMO, and IMO problems. AoPS is the first source. If it is unavailable, we use attributed content from <a href="https://live.poshenloh.com/past-contests" target="_blank" rel="noopener noreferrer">LIVE by Po-Shen Loh</a>, <a href="https://wiki.randommath.com" target="_blank" rel="noopener noreferrer">Random Math</a>, the existing AoPS archive (including HARP), Evan Chen’s published olympiad notes, and John Scholes’s historical archive.</p><p>The collection contains {catalog.length.toLocaleString()} selected problems from {years[0]}–{years.at(-1)}. Original diagrams are bundled when available. {catalog.filter(p=>p.topics.length).length} problems have topic labels from published concepts, source subject labels, exact statement matches, or editorial review. A problem may belong to several topics. AMC 8 includes the AJHSME predecessor. Arithmetic and averages are included in Algebra; probability is included in Combinatorics.</p><p>We show all solutions returned by the available sources, including saved alternatives. The number of published approaches varies by problem. Conflicting answer keys and unsupported source formatting are excluded.</p><p>USA contest problems © MAA; IMO problems belong to their credited organizers. Solutions and diagrams belong to their credited publishers and contributors. Independent practice tool, inspired by <a href="https://amctrivial.com" target="_blank" rel="noopener noreferrer">AMC Trivial</a>.</p></div></details></footer>
 </main>
}

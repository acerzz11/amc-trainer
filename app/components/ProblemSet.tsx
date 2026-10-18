'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {Contest,Topic,PublicProblem,SolutionResponse} from '../../lib/types';
import {chooseSet,matchesSetFilters,mapLimit,MAX_SET_SIZE,type CatalogEntry,type SetReview,type SetResult} from '../../lib/sets';
import {CONTESTS,isProofContest,maxProblemNumber} from '../../lib/contests';
import SolutionList from './SolutionList';
const contests=CONTESTS;
const topics:Topic[]=['Algebra','Geometry','Number theory','Combinatorics'];
function toggle<T>(list:T[],value:T){return list.includes(value)?list.filter(v=>v!==value):[...list,value];}
function ReviewSolution({id}:{id:string}){
 const [solution,setSolution]=useState<SolutionResponse|null>(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function reveal(){if(busy)return;if(solution){setOpen(v=>!v);return;}setBusy(true);setError('');try{const r=await fetch('/api/solution?id='+encodeURIComponent(id),{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error();setSolution(await r.json());setOpen(true);}catch{setError('Solution could not load. Try again or open the source link.');}finally{setBusy(false);}}
 return <><button type="button" className="text-button" disabled={busy} onClick={reveal}>{busy?'Loading solutions…':open?'Hide solutions':'Show solutions'}</button>{error&&<p role="alert" className="error">{error}</p>}{open&&solution&&<SolutionList solution={solution} embedded/>}</>;
}
function Question({p,index,answer,onAnswer,disabled,result,reviewed}:{p:PublicProblem;index:number;answer:string;onAnswer:(value:string)=>void;disabled:boolean;result?:SetResult;reviewed:boolean}){
 return <article className="problem set-question" aria-label={`Problem ${index+1}`}>
  <header className="problem-header"><h2><span className="set-number">{index+1}.</span> {p.title.split(' Problems/')[0]} <span>· Problem {p.number}</span></h2><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></header>
  <div className="problem-body math-content" dangerouslySetInnerHTML={{__html:p.problemHtml}}/>
  {isProofContest(p.contest)?<div className="proof-work"><label htmlFor={`set-proof-${p.id}`}>Proof draft <span>(optional)</span></label><textarea id={`set-proof-${p.id}`} aria-label={`Problem ${index+1} proof draft`} value={answer} onChange={e=>onAnswer(e.target.value)} rows={6} maxLength={20000} disabled={disabled} placeholder="Write your reasoning here, or work on paper…"/>{reviewed&&<ReviewSolution id={p.id}/>}</div>:p.contest==='AIME'?<div className="answer-form"><label htmlFor={`set-answer-${p.id}`}>Your answer <span>(0–999)</span></label><input id={`set-answer-${p.id}`} aria-label={`Problem ${index+1} answer (0–999)`} inputMode="numeric" autoComplete="off" maxLength={3} placeholder="000" value={answer} onChange={e=>onAnswer(e.target.value)} disabled={disabled}/></div>:
  <fieldset className={`answer-options set-options ${p.choicesHtml.some(c=>c.html.includes('<img')||c.html.replace(/<[^>]*>/g,'').length>160)?'long-options':''}`} disabled={disabled}><legend className="sr-only">Problem {index+1} answer</legend>{['A','B','C','D','E'].map(letter=><label key={letter} className={`answer-option ${answer===letter?'selected':''} ${result?.answer===letter?'right':''}`}><input type="radio" name={'answer-'+p.id} value={letter} aria-label={`Problem ${index+1}, answer ${letter}`} checked={answer===letter} onChange={()=>onAnswer(letter)}/><span className="option-letter">{letter}</span>{p.choicesHtml.find(c=>c.letter===letter)&&<span className="math-content" dangerouslySetInnerHTML={{__html:p.choicesHtml.find(c=>c.letter===letter)!.html}}/>}</label>)}</fieldset>}
  {!disabled&&answer&&<button type="button" className="text-button" onClick={()=>onAnswer('')}>Clear answer</button>}
  {result&&<><p className={`feedback ${result.correct?'correct':'incorrect'}`}>{result.correct?'Correct.':`${result.unanswered?'Unanswered.':`Your answer: ${result.submitted}.`} Correct answer: ${p.contest==='AIME'?result.answer.padStart(3,'0'):result.answer}.`}</p><ReviewSolution id={p.id}/></>}
 </article>;
}
export default function ProblemSet({catalog,ready}:{catalog:CatalogEntry[];ready:boolean}){
 const [selectedContest,setContest]=useState<Contest>('AMC 12'),[selectedTopics,setTopics]=useState<Topic[]>([]);
 const [yearFrom,setYearFrom]=useState<number|null>(null),[yearTo,setYearTo]=useState<number|null>(null),[numberFrom,setNumberFrom]=useState(1),[numberTo,setNumberTo]=useState<number|null>(null),[count,setCount]=useState('10');
 const [questions,setQuestions]=useState<PublicProblem[]>([]),[answers,setAnswers]=useState<Record<string,string>>({}),[review,setReview]=useState<SetReview|null>(null),[description,setDescription]=useState('');
 const [busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[loaded,setLoaded]=useState(0),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null),submitLock=useRef(false);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const years=useMemo(()=>[...new Set(catalog.map(p=>p.year))].sort((a,b)=>a-b),[catalog]);
 const maxNumber=maxProblemNumber(selectedContest);
 const numbers=Array.from({length:maxNumber},(_,i)=>i+1);
 const eligible=useMemo(()=>catalog.filter(p=>matchesSetFilters(p,{contest:selectedContest,topics:selectedTopics,yearFrom,yearTo,numberFrom,numberTo})),[catalog,selectedContest,selectedTopics,yearFrom,yearTo,numberFrom,numberTo]);
 const quantity=Number(count),validCount=Number.isInteger(quantity)&&quantity>=1&&quantity<=MAX_SET_SIZE&&quantity<=eligible.length;
 const gradedQuestions=questions.filter(p=>!isProofContest(p.contest));
 const proofCount=questions.length-gradedQuestions.length;
 const answered=gradedQuestions.filter(p=>answers[p.id]?.trim()).length;
 function changeContest(c:Contest){setContest(c);const max=maxProblemNumber(c);setNumberFrom(n=>Math.min(max,n));setNumberTo(n=>n===null||n>=max?null:n);}
 async function generate(){
  if(controller.current||checking||!validCount)return;
  const abort=new AbortController();controller.current=abort;setBusy(true);setLoaded(0);setError('');
  try{
   const selected=chooseSet(eligible,quantity,()=>{const r=new Uint32Array(1);crypto.getRandomValues(r);return r[0]/4294967296;});
   const data=await mapLimit(selected,6,async p=>{abort.signal.throwIfAborted();const r=await fetch('/api/problem?id='+encodeURIComponent(p.id),{signal:AbortSignal.any([abort.signal,AbortSignal.timeout(30000)])});if(!r.ok)throw Error('A problem could not load. Please retry.');const problem=await r.json() as PublicProblem;abort.signal.throwIfAborted();setLoaded(n=>n+1);return problem;});
   if(abort.signal.aborted)return;
   setQuestions(data);setAnswers({});setReview(null);setDescription([selectedContest,...selectedTopics,yearFrom!==null||yearTo!==null?yearFrom!==null&&yearFrom===yearTo?String(yearFrom):`${yearFrom??years[0]}–${yearTo??years.at(-1)}`:null,numberFrom!==1||numberTo!==null?numberFrom===numberTo?`Problem ${numberFrom}`:`Problems ${numberFrom}–${numberTo??maxNumber}`:null].filter(Boolean).join(' · '));
  }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'The set could not load. Try again.');abort.abort();}finally{if(controller.current===abort){controller.current=null;setBusy(false);}}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();if(submitLock.current||busy||!questions.length||review)return;
  const invalid=questions.findIndex(p=>{if(isProofContest(p.contest))return false;const a=(answers[p.id]||'').trim();return a&&(p.contest==='AIME'?!/^\d{1,3}$/.test(a):!(/^[A-E]$/i.test(a)));});
  if(invalid>=0){setError(`Check problem ${invalid+1}: enter ${questions[invalid].contest==='AIME'?'a whole number from 0 to 999':'a letter from A to E'}, or leave it blank.`);document.getElementById('set-answer-'+questions[invalid].id)?.focus();return;}
  submitLock.current=true;setChecking(true);setError('');
  try{if(!gradedQuestions.length){setReview({results:[],correct:0,total:0,unanswered:0,proofCount});return;}const r=await fetch('/api/check-set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:gradedQuestions.map(p=>({id:p.id,answer:answers[p.id]||''}))}),signal:AbortSignal.timeout(60000)});const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to grade the set. Please retry.');setReview({...data,proofCount});}
  catch(e){setError(e instanceof Error?e.message:'Unable to grade the set. Your answers are still here; please retry.');}finally{submitLock.current=false;setChecking(false);}
 }
 return <section aria-label="Problem set mode">
  <div className="set-builder">
   <div className="set-primary"><div className="filter set-contest"><label htmlFor="set-contest">Contest</label><select id="set-contest" value={selectedContest} disabled={!ready||busy||checking} onChange={e=>changeContest(e.target.value as Contest)}>{contests.map(c=><option key={c}>{c}</option>)}</select></div><div className="filter"><label htmlFor="set-size">Problems</label><input id="set-size" aria-label="Number of problems" type="number" min="1" max={MAX_SET_SIZE} step="1" value={count} onChange={e=>setCount(e.target.value)} disabled={busy||checking}/></div></div>
   <fieldset className="choice-filter" disabled={!ready||busy||checking}><legend>Topics</legend><div><label><input type="checkbox" checked={!selectedTopics.length} onChange={()=>setTopics([])}/>All topics</label>{topics.map(t=><label key={t}><input type="checkbox" checked={selectedTopics.includes(t)} onChange={()=>setTopics(toggle(selectedTopics,t))}/>{t}</label>)}</div></fieldset>
   <div className="set-ranges"><fieldset className="filter range-filter" disabled={!ready||busy||checking}><legend>Year range</legend><div className="range-inputs"><select aria-label="Set from year" value={yearFrom??''} onChange={e=>{const n=e.target.value?+e.target.value:null;setYearFrom(n);if(n!==null&&yearTo!==null&&n>yearTo)setYearTo(n);}}><option value="">Any</option>{years.map(y=><option key={y}>{y}</option>)}</select><span>–</span><select aria-label="Set to year" value={yearTo??''} onChange={e=>{const n=e.target.value?+e.target.value:null;setYearTo(n);if(n!==null&&yearFrom!==null&&n<yearFrom)setYearFrom(n);}}><option value="">Any</option>{years.map(y=><option key={y}>{y}</option>)}</select></div></fieldset>
   <fieldset className="filter range-filter" disabled={!ready||busy||checking}><legend>Difficulty (problem #)</legend><div className="range-inputs"><select aria-label="Set from problem number" value={numberFrom} onChange={e=>{const n=+e.target.value;setNumberFrom(n);if(numberTo!==null&&n>numberTo)setNumberTo(n===maxNumber?null:n);}}>{numbers.map(n=><option key={n}>{n}</option>)}</select><span>–</span><select aria-label="Set to problem number" value={numberTo??''} onChange={e=>{const n=e.target.value?+e.target.value:null;setNumberTo(n);if(n!==null&&n<numberFrom)setNumberFrom(n);}}>{numbers.map(n=><option key={n} value={n===maxNumber?'':n}>{n}</option>)}</select></div></fieldset>
   </div>
   <div className="set-generate"><p className="filter-note" aria-live="polite">{!ready?'Loading problem library…':eligible.length?`${eligible.length.toLocaleString()} matching ${eligible.length===1?'problem':'problems'}`:'No matching problems. Widen the filters.'}{ready&&eligible.length>0&&!validCount?` · Choose 1–${Math.min(MAX_SET_SIZE,eligible.length)} problems or widen your filters.`:''}</p><button type="button" className="button primary" onClick={generate} disabled={!ready||!validCount||busy||checking}>{busy?`Loading ${loaded}/${quantity}…`:questions.length?'Generate new set':'Generate set'}</button>{busy&&<button type="button" className="text-button" onClick={()=>controller.current?.abort()}>Cancel</button>}</div>
  </div>
  {error&&<p className="error" role="alert">{error}</p>}
  {!!questions.length&&<form onSubmit={submit} aria-label="Answer problem set"><div className="set-heading"><h1>{questions.length} {questions.length===1?'problem':'problems'}</h1><p>{description}</p></div>
   {review&&<p className="set-score" role="status">{review.total>0?`${review.correct} / ${review.total} correct${review.unanswered?` · ${review.unanswered} unanswered`:''}`:'Ready to review'}</p>}
   <div className="set-questions">{questions.map((p,i)=><Question key={p.id} p={p} index={i} answer={answers[p.id]||''} onAnswer={value=>setAnswers(old=>({...old,[p.id]:value}))} disabled={busy||checking||!!review} result={review?.results.find(r=>r.id===p.id)} reviewed={!!review}/>)}</div>
   {!review&&<div className="set-submit"><div><strong>{gradedQuestions.length?`${answered} of ${gradedQuestions.length} answered`:`${proofCount} proof ${proofCount===1?'problem':'problems'}`}</strong></div><button className="button primary" type="submit" disabled={busy||checking}>{checking?'Checking set…':proofCount?'Review solutions':'Submit all answers'}</button></div>}
  </form>}
 </section>;
}

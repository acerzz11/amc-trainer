import type {SolutionResponse} from '../../lib/types';
export default function SolutionList({solution,embedded=false}:{solution:SolutionResponse;embedded?:boolean}){
 const multiple=solution.items.length>1;
 return <section className={`solution${embedded?' set-solution':''}`} aria-label="Solutions">
  <h2>{multiple?'Solutions':'Solution'}{multiple&&<span className="solution-count">{solution.items.length}</span>}</h2>
  <div className="solutions-scroll" tabIndex={0} role="region" aria-label="Scrollable solutions">
   {solution.items.map((item,i)=><section className="solution-entry" key={item.sourceUrl+item.title+i}>
    <header>{multiple&&<h3>{/^Solution$/i.test(item.title)?`Solution ${i+1}`:item.title}</h3>}<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceName}{item.html.includes('/proof-pages/')?' · PDF':''} ↗</a></header>
    <div className="math-content solution-body" dangerouslySetInnerHTML={{__html:item.html}}/>
   </section>)}
  </div>
 </section>;
}

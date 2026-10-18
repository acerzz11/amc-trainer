import type {Contest,PublicProblem,Topic} from './types';

export type ProblemFilters = {
 contest:Contest;
 topic:Topic|'All topics';
 yearFrom:number|null;
 yearTo:number|null;
 numberFrom:number;
 numberTo:number|null;
};
import {maxProblemNumber} from './contests';
export {maxProblemNumber} from './contests';

export function matchesFilters(p:Pick<PublicProblem,'contest'|'topics'|'year'|'number'>,f:ProblemFilters){
 return p.contest===f.contest
  &&(f.topic==='All topics'||p.topics.includes(f.topic))
  &&(f.yearFrom===null||p.year>=f.yearFrom)
  &&(f.yearTo===null||p.year<=f.yearTo)
  &&p.number>=f.numberFrom
  &&p.number<=(f.numberTo??maxProblemNumber(f.contest));
}

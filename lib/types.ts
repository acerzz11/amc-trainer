export type Contest = 'AMC 8' | 'AMC 10' | 'AMC 12' | 'AIME' | 'USAJMO' | 'USAMO' | 'IMO';
export type Topic = 'Algebra' | 'Geometry' | 'Number theory' | 'Combinatorics';
export type ArchivedSolution = {title:string; content:string; format:'text'|'html'; sourceName:string; sourceUrl:string};
export type RecordProblem = { id: string; title: string; contest: Contest; year: number; variant: string; number: number; topics: Topic[]; problem: string; solution: string; answer: string; sourceUrl: string; archiveSource: string; choices: {letter:string;tex:string}[]; choiceFormat?:'html'; problemFormat?:'html'; solutionFormat?:'html'; archiveUrl?:string; extraSolutions?:ArchivedSolution[]; randomMathUrl?:string; archiveName?:string; topicSource?:string };
export type PublicProblem = Pick<RecordProblem,'id'|'title'|'contest'|'year'|'variant'|'number'|'topics'> & {sourceUrl:string; sourceName:string; problemHtml:string; choicesHtml:{letter:string;html:string}[]; delivery:'live'|'archive'; sourceNote:string};
export type SolutionItem = {title:string; html:string; sourceName:string; sourceUrl:string; delivery:'live'|'archive'};
export type SolutionResponse = {items:SolutionItem[]};

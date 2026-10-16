export type Contest = 'AMC 10' | 'AMC 12' | 'AIME';
export type Topic = 'Algebra' | 'Geometry' | 'Number theory' | 'Combinatorics';
export type RecordProblem = { id: string; title: string; contest: Contest; year: number; variant: string; number: number; topics: Topic[]; problem: string; solution: string; answer: string; sourceUrl: string; archiveSource: string; choices: {letter:string;tex:string}[] };
export type PublicProblem = Omit<RecordProblem,'problem'|'solution'|'answer'> & { problemHtml:string; choicesHtml:{letter:string;html:string}[]; delivery:'live'|'archive'; sourceNote:string; };

import type {Contest} from './types';
export const CONTESTS:Contest[]=['AMC 8','AMC 10','AMC 12','AIME','USAJMO','USAMO','IMO'];
export const isProofContest=(contest:Contest)=>contest==='USAJMO'||contest==='USAMO'||contest==='IMO';
export const maxProblemNumber=(contest:Contest)=>contest==='IMO'?7:isProofContest(contest)?6:contest==='AIME'?15:25;

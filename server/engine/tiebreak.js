import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const file=path.join(path.dirname(fileURLToPath(import.meta.url)),'../data/tiebreak-questions.json');
export const questions=JSON.parse(readFileSync(file,'utf8'));
export function chooseQuestion(random=Math.random){return questions[Math.floor(random()*questions.length)];}
export function judgeAnswers(participants,answers,correctAnswer=''){const expected=String(correctAnswer).trim().toLocaleLowerCase('vi');const valid=participants.map(p=>({token:p.token,answer:String(answers[p.token]?.answer||'').trim().toLocaleLowerCase('vi'),time:Number(answers[p.token]?.time)})).filter(a=>Number.isFinite(a.time)&&a.time>=0&&a.answer===expected).sort((a,b)=>a.time-b.time);if(valid.length>1&&valid[0].time===valid[1].time)return [];return valid.slice(0,1).map(a=>a.token);}

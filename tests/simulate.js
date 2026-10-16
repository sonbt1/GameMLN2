import { performance } from 'node:perf_hooks';
import { createPortfolio, settleDebt, netWorth } from '../server/engine/portfolio.js';
import { marketForDay } from '../server/engine/market.js';
import { processOrder } from '../server/engine/orders.js';
import { days, config } from '../server/engine/day-config.js';

const players=Array.from({length:40},(_,i)=>({name:`Bot ${i+1}`,portfolio:createPortfolio(10000)}));
const latencies=[];let seed=7102026;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const day of days){const market=marketForDay(day.day);for(const player of players){const p=player.portfolio;const tries=day.day===1?0:4;for(let i=0;i<tries;i++){const goods=['rice','corn','cotton','iron','oil','steel','chip','gold'];const good=goods[Math.floor(random()*goods.length)];let order;if(day.day===7&&random()<.2)order={type:'creditBuy',good,qty:1};else if(random()<.45&&p.goods[good]>0)order={type:'sell',good,qty:1};else order={type:'buy',good,qty:1};const start=performance.now();try{processOrder(p,order,day.day,market);}catch{}latencies.push(performance.now()-start);if(p.cash<0||p.debt>config.creditLimit)throw new Error(`Số dư sai ở ngày ${day.day}, ${player.name}`);}
if(day.day===8&&p.cash>=market.fx){try{processOrder(p,{type:'exchangeUsd',direction:'buy',amount:1},day.day,market);}catch{}}
if(day.day===9&&p.debt)settleDebt(p,market);
if(day.day===12&&p.cash>=5000&&random()<.5)processOrder(p,{type:'produce',amount:5000},day.day,market);
if(p.cash<0||p.debt>config.creditLimit)throw new Error(`Tổng tài sản không hợp lệ: ${player.name}`);
}}
const sorted=[...latencies].sort((a,b)=>a-b);const p95=sorted[Math.ceil(sorted.length*.95)-1]||0;
if(players.some(p=>!Number.isSafeInteger(netWorth(p.portfolio,marketForDay(12)))))throw new Error('Tài sản ròng không phải số nguyên');
if(p95>=100)throw new Error(`p95 xử lý lệnh ${p95.toFixed(2)}ms vượt 100ms`);
console.log(`Mô phỏng hoàn tất: ${players.length} bot × 12 ngày; ${latencies.length} lệnh; p95 ${p95.toFixed(3)}ms; không số dư âm ngoài nợ.`);

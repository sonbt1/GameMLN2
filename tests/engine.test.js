import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolio, netWorth, settleDebt } from '../server/engine/portfolio.js';
import { advanceMarket, marketForDay } from '../server/engine/market.js';
import { processOrder } from '../server/engine/orders.js';
import { leaderboard } from '../server/engine/leaderboard.js';
import { days, goods, config } from '../server/engine/day-config.js';
import { chooseQuestion, judgeAnswers, questions } from '../server/engine/tiebreak.js';
import { GameRoom } from '../server/engine/room.js';

test('catalog and daily rotation follow the eight-good scenario', () => {
  assert.equal(goods.length, 8);
  assert.equal(days.length, 12);
  for (const day of days.slice(1)) assert.equal(day.openGoods.length, 5);
});

test('prices vary independently, special events can exceed bounds, cotton stays stable on day 4', () => {
  const d2 = advanceMarket(2, null, () => 0.5);
  const d3 = advanceMarket(3, d2.prices, () => 0.99);
  const d4 = advanceMarket(4, d3.prices, () => 0.5);
  assert.equal(d4.prices.cotton, d3.prices.cotton);
  const d5 = advanceMarket(5, d4.prices, () => 0.5);
  assert.equal(d5.prices.chip, Math.round(d4.prices.chip * 1.6));
  const d6 = advanceMarket(6, d5.prices, () => 0.5);
  const d7 = advanceMarket(7, d6.prices, () => 0.5);
  assert.equal(d7.prices.gold, Math.round(d6.prices.gold * 0.8));
});

test('net worth values every good including goods outside the open market', () => {
  const p = createPortfolio(100);
  p.goods.cotton = 2; p.usd = 3; p.productionAssets = 20; p.debt = 10;
  assert.equal(netWorth(p, { prices: { cotton: 50 }, fx: 10 }), 240);
});

test('daily prices remain fixed during the session and trading is limited to open goods', () => {
  const market = marketForDay(2);
  const p = createPortfolio(10000);
  processOrder(p, { type: 'buy', good: 'rice', qty: 1 }, 2, market);
  assert.equal(p.cash, 9824);
  assert.throws(() => processOrder(p, { type: 'buy', good: 'corn', qty: 1 }, 2, market));
});

test('credit is capped and automatically settled on day 9', () => {
  const p = createPortfolio(0);
  p.goods.gold = 1; p.goods.rice = 4;
  processOrder(p, { type: 'creditBuy', good: 'chip', qty: 1 }, 7, marketForDay(7));
  assert.ok(p.debt <= config.creditLimit);
  assert.equal(settleDebt(p, marketForDay(9)), 0);
  assert.equal(p.goods.gold, 0);
});

test('USD exchange opens day 8 and the oil contract requires USD on day 11', () => {
  const p = createPortfolio(10000);
  processOrder(p, { type: 'exchangeUsd', direction: 'buy', amount: 10 }, 8, marketForDay(8));
  assert.equal(p.usd, 10);
  assert.throws(() => processOrder(p, { type: 'oilUsd', qty: 1 }, 10, marketForDay(10)));
  processOrder(p, { type: 'oilUsd', qty: 1 }, 11, marketForDay(11));
  assert.equal(p.goods.oil, 1);
});

test('day 10 gold window matches the market price and trades both ways', () => {
  const p = createPortfolio(5000);
  const market = marketForDay(10);
  assert.equal(market.prices.gold, market.goldRate);
  processOrder(p, { type: 'goldExchange', direction: 'buy', qty: 1 }, 10, market);
  processOrder(p, { type: 'goldExchange', direction: 'sell', qty: 1 }, 10, market);
  assert.equal(p.cash, 5000);
  assert.equal(p.goods.gold, 0);
});

test('day 12 offers one H-T-H or T-H-T-prime choice and records separate knowledge points', () => {
  const consumer = createPortfolio(1000); consumer.goods.rice = 1;
  const result = processOrder(consumer, { type: 'consume', sellGood: 'rice', buyGood: 'cotton' }, 12, marketForDay(12));
  assert.equal(result.diagram, 'H–T–H');
  assert.equal(consumer.knowledge, 1);
  assert.equal(consumer.day12Choice, 'consumption');
  assert.throws(() => processOrder(consumer, { type: 'produce', amount: 5000 }, 12, marketForDay(12)));

  const producer = createPortfolio(5000);
  const production = processOrder(producer, { type: 'produce', amount: 5000 }, 12, marketForDay(12));
  assert.deepEqual([production.c, production.v, production.m], [4000, 1000, 1000]);
  assert.equal(producer.cash, 6000);
  assert.throws(() => processOrder(producer, { type: 'produce', amount: 5000 }, 12, marketForDay(12)));
});

test('leaderboard ranks by net worth and tie-break awards the fastest correct answer', () => {
  const a = { name: 'A', token: 'a', portfolio: createPortfolio(100) };
  const b = { name: 'B', token: 'b', portfolio: createPortfolio(100) };
  assert.equal(leaderboard([a, b], marketForDay(2))[0].netWorth, 100);
  assert.ok(questions.length >= 6);
  const q = chooseQuestion(() => 0);
  assert.deepEqual(judgeAnswers([{ token: 'a' }, { token: 'b' }], { a: { answer: 'sai', time: 100 }, b: { answer: q.answer, time: 200 } }, q.answer), ['b']);
});

test('players only receive the current market day and future rotations stay private', () => {
  const room = new GameRoom('AB12');
  const player = room.createPlayer('An');
  room.day = 1; room.phase = 'knowledge'; room.beginDay(2);
  const state = room.publicState(false, player.token);
  assert.equal(state.market.openGoods.length, 5);
  assert.deepEqual(Object.keys(state.market.prices), state.market.openGoods);
  assert.doesNotMatch(JSON.stringify(state), /Dự báo mùa đông|Bước tiến công nghệ|Thỏa thuận ổn định/);
  clearTimeout(room.timer);
});

test('day 1 barter cards stay outside the portfolio and funding starts after the guide', () => {
  const room = new GameRoom('CD34');
  const player = room.createPlayer('Bình');
  room.beginDay(1);
  const state = room.publicState(false, player.token);
  assert.equal(state.me.cards.length, 3);
  assert.equal(state.me.cards.includes(state.me.target), false);
  assert.equal(player.portfolio.cash, 0);
  room.phase = 'barterLocked';
  room.publishCoins();
  assert.equal(player.portfolio.cash, 10000);
  assert.equal(room.phase, 'locked');
  clearTimeout(room.timer);
});

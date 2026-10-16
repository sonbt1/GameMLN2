import { config, goods } from './day-config.js';
export function createPortfolio(cash = 0) { return { cash, goods: Object.fromEntries(goods.map(({ id }) => [id, 0])), usd: 0, debt: 0, credit: 0, productionAssets: 0, knowledge: 0, productionCompleted: false, day12Choice: null }; }
export function netWorth(p, market) { return p.cash + Object.entries(p.goods).reduce((sum, [good, qty]) => sum + qty * (market.prices[good] || 0), 0) + p.usd * (market.fx || 0) + p.productionAssets - p.debt; }
export function fee(amount, rate = config.feeRate) { return rate > 0 && amount > 0 ? Math.max(1, Math.floor(amount * rate)) : 0; }
export function settleDebt(p, market, rate = config.feeRate) {
  if (p.cash >= p.debt) { p.cash -= p.debt; p.debt = 0; p.credit = 0; return 0; }
  let shortage = p.debt - p.cash; p.cash = 0;
  const ranked = Object.keys(p.goods).sort((a, b) => (p.goods[b] * market.prices[b]) - (p.goods[a] * market.prices[a]));
  for (const good of ranked) while (p.goods[good] > 0 && shortage > 0) {
    const price = market.prices[good] || 0; if (!price) break;
    p.goods[good]--; const proceeds = price - fee(price, rate); p.cash += proceeds; shortage -= proceeds;
  }
  const paid = Math.min(p.cash, p.debt); p.cash -= paid; p.debt -= paid; p.credit = p.debt; return p.debt;
}

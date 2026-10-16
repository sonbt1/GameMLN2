import { goods, dayConfig } from './day-config.js';

export const goodIds = goods.map((good) => good.id);
export const initialPrices = Object.fromEntries(goods.map((good) => [good.id, good.initial]));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function advanceMarket(day, previousPrices = null, random = Math.random) {
  const current = dayConfig(day);
  if (!current || day === 1) return null;
  const prices = {};
  const event = current.priceEvent;

  for (const good of goods) {
    const previous = previousPrices?.[good.id] ?? good.initial;
    let price;
    if (event?.good === good.id) {
      price = Math.round(previous * (1 + event.change));
    } else if (current.stableGoods?.includes(good.id)) {
      price = previous;
    } else if (day === 2) {
      price = good.initial;
    } else {
      const move = (random() * 2 - 1) * good.volatility;
      if (previous > good.max) {
        const trend = previous - (previous - good.max) * 0.25;
        price = clamp(Math.round(trend * (1 + move * 0.5)), good.max, previous);
      } else if (previous < good.min) {
        const trend = previous + (good.min - previous) * 0.25;
        price = clamp(Math.round(trend * (1 + move * 0.5)), previous, good.min);
      } else {
        const candidate = Math.round(previous * (1 + move));
        price = clamp(candidate, good.min, good.max);
      }
    }
    prices[good.id] = price;
  }

  if (current.goldWindow) prices.gold = current.goldRate;
  return marketForDay(day, prices);
}

export function marketForDay(day, prices = initialPrices) {
  const current = dayConfig(day);
  if (!current) throw new RangeError('Ngày không hợp lệ');
  return {
    day,
    prices: { ...prices },
    openGoods: [...(current.openGoods || [])],
    fx: current.fx || 0,
    goldRate: current.goldRate || 0,
    news: current.news || null,
    advice: current.advice || null,
    reveal: current.reveal || null,
    knowledge: current.knowledge || null,
    function: current.function || null,
    title: current.title,
    credit: Boolean(current.credit),
    creditDue: Boolean(current.creditDue),
    goldWindow: Boolean(current.goldWindow),
    international: Boolean(current.international),
    oilUsdOnly: Boolean(current.oilUsdOnly),
    production: Boolean(current.production),
    barter: Boolean(current.barter),
    priceEvent: current.priceEvent || null,
  };
}

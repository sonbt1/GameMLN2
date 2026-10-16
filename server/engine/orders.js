import { config, dayConfig } from './day-config.js';
import { fee } from './portfolio.js';
import { goodIds } from './market.js';
function safeProduct(a,b){const value=a*b;if(!Number.isSafeInteger(value))throw new Error('Giá trị lệnh vượt giới hạn');return value;}
function safeSum(a,b){const value=a+b;if(!Number.isSafeInteger(value))throw new Error('Giá trị lệnh vượt giới hạn');return value;}
export function processOrder(p, order, day, market) {
  const d = day;
  if (order.type === 'buy' || order.type === 'sell' || order.type === 'creditBuy') {
    const { good, qty } = order; if (!goodIds.includes(good) || (order.type !== 'sell' && !market.openGoods?.includes(good)) || !Number.isSafeInteger(qty) || qty < 1) throw new Error('Lệnh không hợp lệ');
    if (order.type === 'sell' && p.goods[good] < qty) throw new Error('Không đủ hàng');
    if (order.type === 'creditBuy' && d !== 7) throw new Error('Mua chịu chỉ mở ngày 7');
    const unitPrice = market.openGoods?.includes(good) ? market.prices[good] : 0;
    const gross = safeProduct(qty,unitPrice);
    if(dayConfig(d)?.oilUsdOnly&&good==='oil'&&order.type==='buy')throw new Error('Dầu trong ngày này chỉ mua bằng USD giả lập');
    const tradingFee=d>=2?fee(gross):0;const cost=safeSum(gross,tradingFee);
    if (order.type === 'sell') { p.goods[good] -= qty; p.cash = safeSum(p.cash,gross-tradingFee); return { ok: true, total: gross }; }
    if (order.type === 'creditBuy') { if (safeSum(p.credit,cost) > config.creditLimit) throw new Error('Vượt hạn mức mua chịu'); p.credit = safeSum(p.credit,cost); p.debt = safeSum(p.debt,cost); p.goods[good] = safeSum(p.goods[good],qty); }
    else { if (p.cash < cost) throw new Error('Không đủ xu'); p.cash -= cost; p.goods[good] = safeSum(p.goods[good],qty); }
    return { ok: true, total: cost };
  }
  if (order.type === 'exchangeUsd') { if (!dayConfig(day)?.international || !market.fx || !Number.isSafeInteger(order.amount) || order.amount <= 0) throw new Error('Lệnh đổi USD không hợp lệ');
    const total=safeProduct(order.amount,market.fx);if(!['buy','sell'].includes(order.direction))throw new Error('Chiều đổi USD không hợp lệ');if (order.direction === 'buy') { if (p.cash < total) throw new Error('Không đủ xu'); p.cash -= total; p.usd = safeSum(p.usd,order.amount); }
    else { if (p.usd < order.amount) throw new Error('Không đủ USD'); p.usd -= order.amount; p.cash = safeSum(p.cash,total); } return { ok: true }; }
  if (order.type === 'goldExchange') { if (day !== 10 || !Number.isSafeInteger(order.qty) || order.qty < 1) throw new Error('Cửa sổ vàng chỉ mở ngày 10'); const total = safeProduct(order.qty,dayConfig(10).goldRate);
    if(!['buy','sell'].includes(order.direction))throw new Error('Chiều đổi vàng không hợp lệ');if (order.direction === 'buy') { if (p.cash < total) throw new Error('Không đủ xu'); p.cash -= total; p.goods.gold = safeSum(p.goods.gold,order.qty); } else { if (p.goods.gold < order.qty) throw new Error('Không đủ vàng'); p.goods.gold -= order.qty; p.cash = safeSum(p.cash,total); } return { ok: true, total }; }
  if (order.type === 'oilUsd') { if (day !== 11 || !market.oilUsdOnly || !market.openGoods?.includes('oil') || !Number.isSafeInteger(order.qty) || order.qty < 1) throw new Error('Dầu ngày 11 chỉ mua bằng USD');const unit=Math.ceil(market.prices.oil/market.fx);const total=safeProduct(order.qty,unit);if(p.usd<total)throw new Error('Dầu ngày 11 chỉ mua bằng USD');p.usd -= total; p.goods.oil = safeSum(p.goods.oil,order.qty); return { ok: true }; }
  if (order.type === 'repay') { const amount = Math.min(order.amount || p.cash, p.cash, p.debt); if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền trả nợ không hợp lệ'); p.cash -= amount; p.debt -= amount; p.credit = p.debt; return { ok: true, total: amount }; }
  if (order.type === 'produce') { if (day !== 12 || p.day12Choice || p.productionCompleted || !Number.isSafeInteger(order.amount) || order.amount < 1 || order.amount !== config.productionCap || p.cash < order.amount) throw new Error('Ứng vốn sản xuất không hợp lệ hoặc lô đã hoàn tất'); p.cash -= order.amount; const output = Math.floor(order.amount * config.productionReturnRate); p.cash = safeSum(p.cash,output); p.productionCompleted=true;p.day12Choice='production';p.knowledge += 1;const c=4000;const v=1000;return { ok: true, invested: order.amount, output, c, v, m: output - order.amount }; }
  if (order.type === 'consume') {
    if (day !== 12 || p.day12Choice) throw new Error('Lựa chọn H–T–H chỉ dùng một lần trong ngày 12');
    const { sellGood, buyGood } = order;
    if (!market.openGoods?.includes(sellGood) || !market.openGoods?.includes(buyGood) || !goodIds.includes(sellGood) || !goodIds.includes(buyGood) || p.goods[sellGood] < 1) throw new Error('Chọn một hàng đang sở hữu để bán và một hàng đang mở chợ để tiêu dùng');
    const sale = market.prices[sellGood], purchase = market.prices[buyGood], proceeds = sale - fee(sale), cost = purchase + fee(purchase);
    if (p.cash + proceeds < cost) throw new Error('Không đủ xu sau khi bán hàng để mua hàng tiêu dùng');
    p.goods[sellGood]--; p.cash = p.cash + proceeds - cost; p.day12Choice = 'consumption'; p.knowledge += 1;
    return { ok: true, diagram: 'H–T–H', sold: sellGood, bought: buyGood, sale: proceeds, spent: cost };
  }
  throw new Error('Loại lệnh không hỗ trợ');
}

import { dayConfig } from './day-config.js';
export function marketForDay(day) { const d = dayConfig(day); if (!d) throw new RangeError('Ngày không hợp lệ'); return { day, prices: { ...d.prices }, fx: d.fx || 0 }; }
export function importPrice(day, good) { const d = dayConfig(day); if (day < 8 || !d?.international) throw new Error('Chưa mở nhập khẩu'); return Math.ceil(d.prices[good] / 100 * d.importDiscount); }

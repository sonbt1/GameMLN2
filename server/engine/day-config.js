import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
export const days = JSON.parse(readFileSync(path.join(here, '../data/days.json'), 'utf8'));
export const goods = JSON.parse(readFileSync(path.join(here, '../data/goods.json'), 'utf8'));
export const config = { feeRate: 0.01, maxPlayers: 50, exchangeFeeRate: 0, dayOneBarterSeconds: 45, ...JSON.parse(readFileSync(path.join(here, '../data/config.json'), 'utf8')) };
export const dayConfig = (day) => days.find((item) => item.day === day);

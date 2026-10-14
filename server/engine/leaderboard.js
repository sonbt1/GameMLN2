import { netWorth } from './portfolio.js';
export function leaderboard(players, market, limit = 5) { return [...players].map((p) => ({ name: p.name, token: p.token, netWorth: netWorth(p.portfolio, market) })).sort((a, b) => b.netWorth - a.netWorth).slice(0, limit); }
export function tieGroup(players, market) { const rows = leaderboard(players, market, players.length); if (!rows.length) return []; return rows.filter((r) => r.netWorth === rows[0].netWorth); }

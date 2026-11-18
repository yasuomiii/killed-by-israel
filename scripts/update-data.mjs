// Fetches the latest summary from Tech for Palestine and writes a slim copy to data/summary.json.
// Runs in a GitHub Action (Node 20+, global fetch). On any error the existing file stays untouched.
import { readFile, writeFile } from 'node:fs/promises';

const API_URL = 'https://data.techforpalestine.org/api/v3/summary.json';
const OUT = new URL('../data/summary.json', import.meta.url);

const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
if (!res.ok) throw new Error(`HTTP ${res.status} from ${API_URL}`);
const json = await res.json();

const num = x => { const n = Number(x); return Number.isFinite(n) && n >= 0 ? n : null; };

const g = json.gaza ?? {};
const total = num(g.killed?.total);
const children = num(g.killed?.children);
if (total === null || children === null || total <= 0 || children > total) {
  throw new Error('Unexpected data format – file will not be overwritten.');
}

const region = r => {
  const killed = num(r?.killed?.total), injured = num(r?.injured?.total);
  if (killed === null || injured === null) return null;
  return { last_update: r.last_update ?? null, killed: { total: killed }, injured: { total: injured } };
};

const next = {
  gaza: { last_update: g.last_update ?? null, killed: { total, children }, injured: { total: num(g.injured?.total) } },
  west_bank: region(json.west_bank),
  lebanon: region(json.lebanon),
};
for (const k of Object.keys(next)) if (next[k] === null) delete next[k];

let prev = null;
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
const strip = o => JSON.stringify({ gaza: o?.gaza, west_bank: o?.west_bank, lebanon: o?.lebanon });
if (prev && strip(prev) === strip(next)) {
  console.log('No change in the figures.');
} else {
  next._meta = { source: API_URL, fetched_at: new Date().toISOString() };
  await writeFile(OUT, JSON.stringify(next, null, 2) + '\n');
  console.log(`Updated: Gaza ${total} killed (${children} children, as of ${next.gaza.last_update}).`);
}

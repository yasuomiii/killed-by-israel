// Holt die aktuelle Summary von Tech for Palestine und schreibt eine schlanke Kopie nach data/summary.json.
// Läuft per GitHub Action (Node 20+, globales fetch). Bei Fehlern bleibt die vorhandene Datei unverändert.
import { readFile, writeFile } from 'node:fs/promises';

const API_URL = 'https://data.techforpalestine.org/api/v3/summary.json';
const OUT = new URL('../data/summary.json', import.meta.url);

const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
if (!res.ok) throw new Error(`HTTP ${res.status} von ${API_URL}`);
const json = await res.json();

const g = json.gaza ?? {};
const total = Number(g.killed?.total);
const children = Number(g.killed?.children);
if (!Number.isFinite(total) || !Number.isFinite(children) || total <= 0 || children < 0 || children > total) {
  throw new Error('Unerwartetes Datenformat – Datei wird nicht überschrieben.');
}

const next = {
  gaza: {
    last_update: g.last_update ?? null,
    killed: { total, children, women: Number(g.killed?.women) || null },
  },
  _meta: { source: API_URL, fetched_at: new Date().toISOString() },
};

let prev = null;
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
if (prev && JSON.stringify(prev.gaza) === JSON.stringify(next.gaza)) {
  console.log('Keine Änderung der Zahlen.');
} else {
  await writeFile(OUT, JSON.stringify(next, null, 2) + '\n');
  console.log(`Aktualisiert: ${total} Getötete, davon ${children} Kinder (Stand ${next.gaza.last_update}).`);
}

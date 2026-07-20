// chinext-data.mjs
// Récupère EN DIRECT le cours du ChiNext 50 (399673.SZ) et le taux CNY→EUR,
// puis calcule les variations JOUR et SEMAINE (7 jours glissants), en CNY et EUR.
// Sortie : une seule ligne JSON, destinée au widget Übersicht.
// Zéro dépendance (fetch natif de Node).

const INDICE = '399673.SZ';
const TAUX = 'CNYEUR=X';

// Récupère le dernier prix + la série de clôtures journalières du dernier mois
async function serie(symbole) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbole)}?range=1mo&interval=1d`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`${symbole} → HTTP ${r.status}`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res?.meta) throw new Error(`${symbole} → réponse vide`);
  const ts = res.timestamp || [];
  const cl = res.indicators?.quote?.[0]?.close || [];
  const pts = ts.map((t, i) => ({ t, c: cl[i] })).filter(p => Number.isFinite(p.c));
  return {
    price: res.meta.regularMarketPrice,
    prevClose: res.meta.chartPreviousClose ?? res.meta.previousClose ?? null,
    pts,
  };
}

// Dernier point daté d'au moins `jours` avant le point le plus récent (semaine glissante)
function refIlYa(pts, jours) {
  if (pts.length === 0) return null;
  const cible = pts[pts.length - 1].t - jours * 86400;
  let ref = null;
  for (const p of pts) if (p.t <= cible) ref = p;
  return ref || pts[0];
}
// Point de la série dont la date est la plus proche de t (pour aligner le taux de change)
function plusProche(pts, t) {
  return pts.length ? pts.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)) : null;
}
const pct = (a, b) => (b && Number.isFinite(a) && Number.isFinite(b)) ? ((a - b) / b) * 100 : null;

try {
  const [idx, fx] = await Promise.all([serie(INDICE), serie(TAUX)]);

  const priceCny = idx.price;
  const rate = fx.price;
  const priceEur = priceCny * rate;

  // --- Variation JOUR (vs clôture précédente) ---
  const dayCny = pct(priceCny, idx.prevClose);
  const prevEur = (idx.prevClose != null && fx.prevClose != null) ? idx.prevClose * fx.prevClose : null;
  const dayEur = pct(priceEur, prevEur);

  // --- Variation SEMAINE (7 jours glissants) ---
  const idxRef = refIlYa(idx.pts, 7);
  let weekCny = null, weekEur = null;
  if (idxRef) {
    weekCny = pct(priceCny, idxRef.c);
    const fxRef = plusProche(fx.pts, idxRef.t);
    if (fxRef) weekEur = pct(priceEur, idxRef.c * fxRef.c);
  }

  // --- Série 1 mois (valeurs journalières en EUR) pour le mini-graphique ---
  const series = idx.pts.map((p) => {
    const f = plusProche(fx.pts, p.t);
    return Math.round(p.c * (f ? f.c : rate) * 100) / 100;
  });
  // dernier point = prix live, pour coller à la valeur affichée en gros
  if (series.length) series[series.length - 1] = Math.round(priceEur * 100) / 100;
  const monthEur = series.length ? pct(priceEur, series[0]) : null;

  process.stdout.write(JSON.stringify({
    ok: true, priceCny, priceEur, rate,
    dayCny, dayEur, weekCny, weekEur,
    monthEur, series,
  }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: String(e.message || e) }));
}

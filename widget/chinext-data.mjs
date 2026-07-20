// chinext-data.mjs
// Fournit au widget Übersicht : prix (CNY+EUR), variations JOUR et SEMAINE
// (7 jours glissants), et la série 1 mois en EUR pour le mini-graphique.
//
// Sources :
//   • Prix live de l'indice + taux CNY→EUR : Yahoo Finance
//   • Historique quotidien de l'indice ChiNext 50 : Sina (Yahoo ne le fournit pas)
//   • Historique du taux CNY→EUR : Yahoo (CNYEUR=X)
// Zéro dépendance (fetch natif de Node).

const INDICE = '399673.SZ';
const TAUX = 'CNYEUR=X';
const SINA = 'https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sz399673&scale=240&ma=no&datalen=30';

// Yahoo : prix live (+ historique si demandé), renvoie {price, prevClose, pts:[{t,c}]}
async function yahoo(symbole, avecHistorique) {
  const q = avecHistorique ? '?range=2mo&interval=1d' : '';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbole)}${q}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`${symbole} → HTTP ${r.status}`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res?.meta) throw new Error(`${symbole} → réponse vide`);
  const ts = res.timestamp || [];
  const cl = res.indicators?.quote?.[0]?.close || [];
  const pts = ts.map((t, i) => ({ t, c: cl[i] })).filter(p => Number.isFinite(p.c));
  return { price: res.meta.regularMarketPrice, prevClose: res.meta.chartPreviousClose ?? null, pts };
}

// Sina : historique quotidien du ChiNext 50, renvoie [{t,c}] trié par date
async function sinaHistorique() {
  const r = await fetch(SINA, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Sina → HTTP ${r.status}`);
  const arr = JSON.parse(await r.text());
  return arr
    .map(d => ({ t: Math.floor(new Date(d.day + 'T00:00:00Z').getTime() / 1000), c: parseFloat(d.close) }))
    .filter(p => Number.isFinite(p.c) && Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
}

// Dernier point daté d'au moins `jours` avant le point le plus récent (semaine glissante)
function refIlYa(pts, jours) {
  if (pts.length === 0) return null;
  const cible = pts[pts.length - 1].t - jours * 86400;
  let ref = null;
  for (const p of pts) if (p.t <= cible) ref = p;
  return ref || pts[0];
}
const pct = (a, b) => (b && Number.isFinite(a) && Number.isFinite(b)) ? ((a - b) / b) * 100 : null;

try {
  const [idx, fx, hist] = await Promise.all([
    yahoo(INDICE, false),           // prix live de l'indice
    yahoo(TAUX, true),              // taux live + historique du taux
    sinaHistorique().catch(() => []), // historique de l'indice (vide si Sina indisponible)
  ]);

  const priceCny = idx.price;
  const rate = fx.price;
  const priceEur = priceCny * rate;

  // taux le plus proche d'une date donnée (pour convertir chaque jour en EUR)
  const tauxA = (t) => fx.pts.length ? fx.pts.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a).c : rate;

  const H = hist.length >= 2 ? hist : null;   // historique de l'indice exploitable ?

  // --- Variation JOUR (vs clôture précédente) ---
  const prevCny = H ? H[H.length - 2].c : idx.prevClose;
  const dayCny = pct(priceCny, prevCny);
  const prevT = H ? H[H.length - 2].t : null;
  const dayEur = (prevCny != null) ? pct(priceEur, prevCny * (prevT ? tauxA(prevT) : rate)) : null;

  // --- Variation SEMAINE (7 jours glissants) ---
  let weekCny = null, weekEur = null;
  const ref7 = H ? refIlYa(H, 7) : null;
  if (ref7) {
    weekCny = pct(priceCny, ref7.c);
    weekEur = pct(priceEur, ref7.c * tauxA(ref7.t));
  }

  // --- Série 1 mois en EUR (indice CNY × taux du jour correspondant) ---
  let series = [];
  if (H) {
    series = H.map(p => Math.round(p.c * tauxA(p.t) * 100) / 100);
    series[series.length - 1] = Math.round(priceEur * 100) / 100; // dernier = prix live
  }
  const monthEur = series.length > 1 ? pct(priceEur, series[0]) : null;

  process.stdout.write(JSON.stringify({
    ok: true, priceCny, priceEur, rate,
    dayCny, dayEur, weekCny, weekEur,
    monthEur, series,
  }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: String(e.message || e) }));
}

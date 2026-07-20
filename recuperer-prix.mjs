// recuperer-prix.mjs
// Relève le cours de l'indice ChiNext 50 (创业板50, Bourse de Shenzhen, code 399673)
// en CNY (yuan) ET en EUR, en appliquant le taux de change du jour.
// Calcule aussi la variation sur 7 jours glissants et signale une alerte
// si le cours (en CNY) a bougé de plus de 5 %.
//
// Source : API de Yahoo Finance — une requête pour l'indice, une pour le taux CNY→EUR.
// Aucune dépendance à installer.

import fs from 'fs';

const TICKER = '399673.SZ';   // ChiNext 50 sur Yahoo Finance (.SZ = Bourse de Shenzhen)
const TAUX = 'CNYEUR=X';      // taux de change : 1 CNY = ? EUR
const SEUIL_ALERTE = 5;       // % de variation sur 7 jours qui déclenche une alerte

// Interroge Yahoo Finance et renvoie le dernier prix connu (meta.regularMarketPrice)
async function prixYahoo(symbole) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbole)}`;
  const reponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!reponse.ok) {
    throw new Error(`Échec de la requête (${symbole}) : ${reponse.status} ${reponse.statusText}`);
  }
  const donnees = await reponse.json();
  const valeur = donnees?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (valeur == null) {
    throw new Error(`Valeur introuvable pour ${symbole} dans la réponse de Yahoo Finance.`);
  }
  return valeur;
}

const prixCny = await prixYahoo(TICKER);    // ex. 3668.77
const tauxCnyEur = await prixYahoo(TAUX);   // ex. 0.1293  (1 CNY = 0,1293 EUR)
const prixEur = prixCny * tauxCnyEur;       // conversion avec le taux du jour

const date = new Date().toISOString();      // date + heure en UTC
const cny = prixCny.toFixed(2);
const taux = tauxCnyEur.toFixed(5);
const eur = prixEur.toFixed(2);

// Crée la ligne d'en-tête si le fichier n'existe pas encore
if (!fs.existsSync('prix.csv')) {
  fs.writeFileSync('prix.csv', 'date_utc,indice,prix_cny,taux_cny_eur,prix_eur\n');
}

// Ajoute la nouvelle ligne à la fin du fichier
fs.appendFileSync('prix.csv', `${date},ChiNext50,${cny},${taux},${eur}\n`);
console.log(`✅ ${date} — ChiNext 50 : ${cny} CNY  →  ${eur} EUR  (taux ${taux})`);

// --- Alerte : variation sur 7 jours glissants (calculée sur le cours en CNY) ---
// On relit tout l'historique, on trie par date, et on compare le dernier relevé
// à la mesure la plus récente vieille d'au moins 7 jours.
const historique = fs.readFileSync('prix.csv', 'utf8')
  .trim().split('\n').slice(1)
  .map(l => l.split(','))
  .filter(c => c.length >= 5)
  .map(c => ({ t: new Date(c[0]).getTime(), cny: parseFloat(c[2]), eur: parseFloat(c[4]) }))
  .filter(p => Number.isFinite(p.t) && Number.isFinite(p.cny))
  .sort((a, b) => a.t - b.t);

const actuel = historique[historique.length - 1];
const il_y_a_7j = actuel.t - 7 * 24 * 60 * 60 * 1000;
const reference = [...historique].reverse().find(p => p.t <= il_y_a_7j);

let alerte = false;
let variation = 0;
let message = '';

if (reference) {
  variation = ((actuel.cny - reference.cny) / reference.cny) * 100;
  if (Math.abs(variation) >= SEUIL_ALERTE) {
    alerte = true;
    const sens = variation >= 0 ? 'hausse 📈' : 'baisse 📉';
    message = `ChiNext 50 : ${sens} de ${variation.toFixed(2)} % sur 7 jours glissants — `
            + `${reference.cny} → ${actuel.cny} CNY (soit ${reference.eur} → ${actuel.eur} EUR).`;
  }
}

// Transmet le résultat au workflow GitHub (via le fichier $GITHUB_OUTPUT)
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, [
    `alert=${alerte}`,
    `variation=${variation.toFixed(2)}`,
    `prix_cny=${cny}`,
    `prix_eur=${eur}`,
    `message=${message}`,
  ].join('\n') + '\n');
}

if (alerte) {
  console.log(`🚨 ${message}`);
} else if (reference) {
  console.log(`ℹ️  Variation 7j : ${variation.toFixed(2)} % (sous le seuil de ${SEUIL_ALERTE} %, pas d'alerte).`);
} else {
  console.log(`ℹ️  Pas encore 7 jours d'historique : alerte impossible à calculer pour l'instant.`);
}

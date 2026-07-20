// recuperer-prix.mjs
// Relève le cours de l'indice ChiNext 50 (创业板50, Bourse de Shenzhen, code 399673)
// en CNY (yuan) ET en EUR, en appliquant le taux de change du jour.
//
// Source : API de Yahoo Finance — une requête pour l'indice, une pour le taux CNY→EUR.
// Plus simple et fiable qu'un navigateur Puppeteer pour un cours de bourse :
// aucune dépendance à installer.

import fs from 'fs';

const TICKER = '399673.SZ';   // ChiNext 50 sur Yahoo Finance (.SZ = Bourse de Shenzhen)
const TAUX = 'CNYEUR=X';      // taux de change : 1 CNY = ? EUR

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

// Arrondis lisibles
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

// generer-graphique.mjs
// Génère un graphique SVG de l'évolution du cours (en EUR) à partir de prix.csv.
// Zéro dépendance : on écrit le SVG « à la main ». Le fichier graphique.svg est
// affiché directement par GitHub et intégré au README.

import fs from 'fs';

if (!fs.existsSync('prix.csv')) {
  console.log('Pas de fichier prix.csv, rien à tracer.');
  process.exit(0);
}

const points = fs.readFileSync('prix.csv', 'utf8')
  .trim().split('\n').slice(1)               // on saute l'en-tête
  .map(l => l.split(','))
  .filter(c => c.length >= 5)
  .map(c => ({ date: c[0].slice(0, 10), eur: parseFloat(c[4]) }))
  .filter(p => Number.isFinite(p.eur));

if (points.length === 0) {
  console.log('Aucune donnée exploitable dans prix.csv.');
  process.exit(0);
}

// --- Dimensions ---
const W = 900, H = 420;
const M = { top: 60, right: 40, bottom: 60, left: 80 };
const iw = W - M.left - M.right;
const ih = H - M.top - M.bottom;

// --- Échelle verticale (EUR) avec une petite marge ---
const vals = points.map(p => p.eur);
let min = Math.min(...vals), max = Math.max(...vals);
if (min === max) { min -= 1; max += 1; }       // évite une division par zéro
const marge = (max - min) * 0.15;
min -= marge; max += marge;

const n = points.length;
const X = i => M.left + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
const Y = v => M.top + ih - ((v - min) / (max - min)) * ih;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Courbe + aire sous la courbe
const ligne = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.eur).toFixed(1)}`).join(' ');
const aire = `${ligne} L${X(n - 1).toFixed(1)},${(M.top + ih).toFixed(1)} L${X(0).toFixed(1)},${(M.top + ih).toFixed(1)} Z`;

// Graduations horizontales + valeurs en EUR
let grille = '';
const NIVEAUX = 4;
for (let i = 0; i <= NIVEAUX; i++) {
  const v = min + (i / NIVEAUX) * (max - min);
  const y = Y(v);
  grille += `<line x1="${M.left}" y1="${y.toFixed(1)}" x2="${M.left + iw}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1"/>`;
  grille += `<text x="${M.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#6b7280">${v.toFixed(0)} €</text>`;
}

// Étiquettes de dates (début, milieu, fin)
let dates = '';
for (const i of [...new Set(n === 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1])]) {
  dates += `<text x="${X(i).toFixed(1)}" y="${M.top + ih + 24}" text-anchor="middle" font-size="12" fill="#6b7280">${esc(points[i].date)}</text>`;
}

// Points + valeur finale mise en avant
const cercles = points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.eur).toFixed(1)}" r="3" fill="#2563eb"/>`).join('');
const dernier = points[n - 1];
const labelFinal = `<text x="${X(n - 1).toFixed(1)}" y="${(Y(dernier.eur) - 12).toFixed(1)}" text-anchor="end" font-size="14" font-weight="bold" fill="#1d4ed8">${dernier.eur.toFixed(2)} €</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="-apple-system, Segoe UI, Roboto, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${M.left}" y="34" font-size="18" font-weight="bold" fill="#111827">ChiNext 50 — évolution du cours (EUR)</text>
  <text x="${M.left}" y="52" font-size="12" fill="#6b7280">${n} relevé(s) · du ${esc(points[0].date)} au ${esc(dernier.date)}</text>
  ${grille}
  ${dates}
  <path d="${aire}" fill="#2563eb" fill-opacity="0.08"/>
  <path d="${ligne}" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  ${cercles}
  ${labelFinal}
</svg>`;

fs.writeFileSync('graphique.svg', svg);
console.log(`✅ graphique.svg généré (${n} point(s), de ${points[0].eur.toFixed(2)} € à ${dernier.eur.toFixed(2)} €).`);

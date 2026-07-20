# Suivi du cours de l'indice ChiNext 50

Ce dépôt relève automatiquement, une fois par jour, le cours de l'indice
**ChiNext 50** (创业板50, Bourse de Shenzhen, code `399673`) et l'enregistre dans
`prix.csv`, **en CNY (yuan) et en EUR** (conversion au taux du jour).

## Comment ça marche

- `recuperer-prix.mjs` : interroge l'API de Yahoo Finance (indice + taux CNY→EUR),
  calcule le prix en euros et ajoute une ligne au CSV.
- `.github/workflows/suivi-prix.yml` : dit à GitHub de lancer le script chaque jour
  à 08:00 UTC (et permet un lancement manuel depuis l'onglet **Actions**).
- `prix.csv` : le fichier de résultats, mis à jour automatiquement.

## Colonnes du CSV

| Colonne         | Signification                              |
|-----------------|--------------------------------------------|
| `date_utc`      | Date et heure du relevé (en UTC)           |
| `indice`        | Nom de l'indice (ChiNext50)                |
| `prix_cny`      | Cours en yuan chinois (CNY)                |
| `taux_cny_eur`  | Taux de change utilisé (1 CNY = ? EUR)     |
| `prix_eur`      | Cours converti en euros (CNY × taux)       |

## Tester à la main

```bash
node recuperer-prix.mjs
```

# Widget bureau ChiNext 50 (Übersicht)

Un widget affiché **directement sur le bureau** du Mac, qui montre en temps réel
le cours du ChiNext 50, ses variations **jour** et **semaine glissante** en
**CNY et EUR**, et un **mini-graphique 1 mois**. Indépendant du suivi GitHub.

Sources : **Yahoo Finance** (prix live de l'indice + taux CNY→EUR et son historique)
et **Sina** (historique quotidien de l'indice — Yahoo ne le fournit pas pour ce
symbole).

## Fichiers

- `chinext-data.mjs` : récupère le prix + le taux CNY→EUR et calcule les variations
  (sortie JSON). Aucune dépendance (Node ≥ 18 pour `fetch`).
- `chinext.jsx` : le widget Übersicht (copie de référence). Le fichier **actif** est :
  `~/Library/Application Support/Übersicht/widgets/chinext.jsx`

## Installation (déjà faite)

1. `brew install --cask ubersicht`
2. Copier `chinext.jsx` dans `~/Library/Application Support/Übersicht/widgets/`
3. Ouvrir Übersicht et lui accorder la permission **Enregistrement de l'écran**
   (Réglages Système → Confidentialité et sécurité → Enregistrement de l'écran).

## Régler / personnaliser

- **Fréquence** : `refreshFrequency` (en millisecondes) dans `chinext.jsx`.
- **Position** : `top` / `right` dans le bloc `className`.
- Après modif du fichier de référence, recopier dans le dossier Übersicht.

## Tester le moteur de données

```bash
node chinext-data.mjs
```

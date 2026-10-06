# Banc OCR — lot 0

Installer les dépendances avec `npm ci` et Chromium avec `npx playwright install chromium`. Un Chromium déjà installé peut être choisi avec `OCR_CHROMIUM_PATH`.

Déposer 20–30 tickets réels anonymisés dans `fixtures/`, puis créer `expected.json` sur le format de `expected.example.json`. L'exemple est fictif et ne constitue pas un ticket de test. Chaque clé est un fichier relatif au dossier ; chaque objet contient les six champs du contrat OCR, avec `null` si le champ est réellement absent. Utiliser les catégories API (`repas`, `logement`, `taxi`, `bus`, `metro`, `train`, `autre`), pas les catégories de repas calculées par le formulaire.

Définir `OCR_URL` (URL complète de `/api/ocr`) et `OCR_TOKEN` dans l'environnement, jamais dans Git ni dans un rapport. Lancer `npm run eval:ocr`. `OCR_FIXTURES_DIR` permet un dossier privé externe. Les tickets, `expected.json` et les résultats sont ignorés par Git.

Le banc charge le vrai HTML et appelle `handlePhoto`, en remplaçant uniquement `runOCR` pour capturer l'image. Le prétraitement reste celui du front, y compris ses limitations actuelles : JPEG 0,80 / 1024 px pour les photos ; PDF première page à l'échelle 2 / JPEG 0,90. PDF.js et son worker sont chargés depuis le même CDN que le front : un accès au CDN est nécessaire pour les PDF.

Le script appelle l'API séquentiellement avec la même image, affiche la précision par champ, la latence API moyenne, la taille des requêtes et les écarts. Il conserve le rapport dans `tests/ocr/results.json` (données extraites potentiellement personnelles). Montant : tolérance 0,01 ; fournisseur : inclusion après suppression casse, accents et espaces ; autres champs : égalité exacte. Les erreurs HTTP et de prétraitement comptent comme échecs et produisent un code de sortie non nul. La latence exclut le prétraitement. Les octets ne permettent pas de déduire le coût Workers AI : relever les métriques de consommation Cloudflare séparément.

## Référence

Commit de départ : `e3a74e6`. Score réel non mesuré : aucun ticket ni token API disponible. Ne pas optimiser les lots suivants avant ce score. Reporter dans la PR les taux par champ, nombre de tickets, latence et écarts ; comparer chaque lot sur les mêmes fixtures.

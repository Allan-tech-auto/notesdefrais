# Banc OCR — lot 0

Installer les dépendances avec `npm ci` et Chromium avec `npx playwright install chromium`. Un Chromium déjà installé peut être choisi avec `OCR_CHROMIUM_PATH`.

Déposer 20–30 tickets réels anonymisés dans `fixtures/`, puis créer `expected.json` sur le format de `expected.example.json`. L'exemple est fictif et ne constitue pas un ticket de test. Chaque clé est un fichier relatif au dossier ; chaque objet contient les six champs du contrat OCR, avec `null` si le champ est réellement absent. Utiliser les catégories API (`repas`, `logement`, `taxi`, `bus`, `metro`, `train`, `autre`), pas les catégories de repas calculées par le formulaire.

Définir `OCR_URL` (URL complète de `/api/ocr`) et `OCR_TOKEN` dans l'environnement, jamais dans Git ni dans un rapport. Lancer `npm run eval:ocr`. `OCR_FIXTURES_DIR` permet un dossier privé externe. Les tickets, `expected.json` et les résultats sont ignorés par Git.

Le banc charge le vrai HTML et appelle `handlePhoto`, en remplaçant uniquement `runOCR` pour capturer l'image. Le prétraitement reste celui du front, y compris ses limitations actuelles : JPEG 0,80 / 1024 px pour les photos ; PDF première page à l'échelle 2 / JPEG 0,90. PDF.js et son worker sont chargés depuis le même CDN que le front : un accès au CDN est nécessaire pour les PDF.

Le script appelle l'API séquentiellement avec la même image, affiche la précision par champ, la latence API moyenne, la taille des requêtes et les écarts. Il conserve le rapport dans `tests/ocr/results.json` (données extraites potentiellement personnelles). Montant : tolérance 0,01 ; fournisseur : inclusion après suppression casse, accents et espaces ; autres champs : égalité exacte. Les erreurs HTTP et de prétraitement comptent comme échecs et produisent un code de sortie non nul. La latence exclut le prétraitement. Les octets ne permettent pas de déduire le coût Workers AI : relever les métriques de consommation Cloudflare séparément.

## Référence

Commit de départ : `e3a74e6`. Score réel non mesuré : aucun ticket ni token API disponible. Ne pas optimiser les lots suivants avant ce score. Reporter dans la PR les taux par champ, nombre de tickets, latence et écarts ; comparer chaque lot sur les mêmes fixtures.

## Justificatifs déjà enregistrés

Avec `OCR_INPUT_PREPROCESSED=1`, le banc rejoue l'image stockée telle quelle au lieu d'appliquer une seconde compression. Utiliser ce mode uniquement pour les images déjà envoyées par le front. Le rapport indique ce mode. Les références tirées des dépenses sauvegardées mesurent l'accord avec la saisie : elles ne sont pas nécessairement la vérité imprimée (part remboursable, date de mission, heure ajoutée, description libre).

Référence du 06/10/2026, version production `e2cd71ae-7db8-49ff-8a41-00f2d6b28dfc`, 30 justificatifs existants rejoués sans recompression : accord montant 28/30 (93,3 %), date 23/30 (76,7 %), fournisseur/description 22/30 (73,3 %), catégorie API 20/30 (66,7 %), devise 30/30 (100 %, EUR supposé pour les références), heure brute exacte 10/30 (33,3 % ; le front tronque les secondes ; après cette normalisation, 26/30 soit 86,7 %). Latence moyenne API 3 301 ms, requête moyenne 290 299 octets. Aucun appel en erreur. Les écarts de somme peuvent être légitimes : une facture de 14,93 € a une dépense enregistrée de 11,94 €. Ces taux sont des accords avec la saisie, pas une précision OCR validée champ par champ. Les images et rapports détaillés restent privés hors Git ; aucun compte technique conservé après la mesure.

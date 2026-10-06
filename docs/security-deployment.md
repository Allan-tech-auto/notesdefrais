# Correctifs de sécurité

La récupération publique par question secrète est désactivée : elle ne prouve pas la possession du compte. Une récupération par lien à usage unique envoyé à une adresse vérifiée reste à construire. La connexion des comptes existants reste disponible. Le profil permet de changer le mot de passe en confirmant le mot de passe actuel (nouveau mot de passe : 12 caractères minimum).

Les anciennes sessions sont invalidées au premier déploiement. Les nouvelles sessions sont liées au hash du mot de passe et sont invalidées à sa modification. La limitation D1 autorise 5 requêtes par compte et 30 par IP par fenêtre de 15 minutes ; elle compte les succès comme les échecs. Une panne D1 bloque les routes d'authentification concernées.

## Déploiement

1. Vérifier le compte Cloudflare, le Worker `notedefrais-api`, les bindings et la configuration actuelle du dashboard.
2. Appliquer `npx wrangler d1 migrations apply notedefrais-db --remote` avant de déployer (migration additive). Sur une base existante, ne pas exécuter le schema complet.
3. Exécuter `npm run test:security` (Node 24), `npx tsc --noEmit` et `npx wrangler deploy --dry-run`.
4. Déployer avec `npm run deploy`, puis vérifier une connexion, un changement de mot de passe et l'accès OCR authentifié.
5. Changer immédiatement tout mot de passe exposé depuis le profil. Révoquer l'ancienne clé Mindee dans Mindee. Supprimer le script ne révoque aucun secret et ne l'efface pas de l'historique Git.

CORS autorise uniquement l'origine du Worker qui sert également les assets. Tout front sur un domaine distinct devra faire l'objet d'une configuration explicite.

Les images et autres valeurs de dépenses interpolées dans le HTML sont échappées pour empêcher une injection d'attributs.

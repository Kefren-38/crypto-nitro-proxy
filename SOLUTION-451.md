# 🚨 Solution erreur 451 - Render bloque Binance

## Problème

Render retourne une erreur **451 (Unavailable For Legal Reasons)** car ils bloquent les connexions sortantes vers Binance depuis leur infrastructure.

## ✅ Solution temporaire (déjà en place)

Un **fallback automatique** vers un proxy CORS public (`corsproxy.io`) a été ajouté dans le code. Si Render bloque, le système utilise automatiquement le proxy CORS public.

## 🚀 Solution permanente recommandée

**Déployer sur Railway** qui ne bloque pas Binance :

1. Aller sur https://railway.app
2. Créer un compte (gratuit avec GitHub)
3. Déployer le repo `crypto-nitro-proxy`
4. Récupérer l'URL Railway
5. Mettre à jour `PROXY_URL` dans le code

Voir `DEPLOIEMENT-RAILWAY.md` pour les instructions détaillées.

## 📝 Notes

- Le proxy CORS public fonctionne mais peut avoir des limitations de rate limiting
- Railway est gratuit pour 500h/mois (suffisant pour un proxy)
- Le code actuel fonctionne avec le fallback automatique


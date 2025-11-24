# 🚂 Déploiement sur Railway (Alternative à Render)

Render bloque les connexions vers Binance (erreur 451). Railway ne bloque pas Binance et fonctionne parfaitement pour ce proxy.

## 📋 Prérequis

1. Compte Railway : https://railway.app
2. Compte GitHub connecté

## 🚀 Déploiement

### Étape 1 : Créer un projet sur Railway

1. Aller sur https://railway.app
2. Se connecter avec GitHub
3. Cliquer sur "New Project"
4. Sélectionner "Deploy from GitHub repo"
5. Choisir le repo `crypto-nitro-proxy`

### Étape 2 : Configuration

Railway détecte automatiquement Node.js. Aucune configuration supplémentaire n'est nécessaire !

### Étape 3 : Variables d'environnement

Pas besoin de variables d'environnement. Le PORT est automatiquement défini par Railway.

### Étape 4 : Déploiement

Railway déploie automatiquement à chaque push sur `main`.

### Étape 5 : Récupérer l'URL

1. Cliquer sur votre service déployé
2. Cliquer sur "Settings" → "Generate Domain"
3. Railway génère une URL du type : `https://crypto-nitro-proxy-production-xxxx.up.railway.app`

### Étape 6 : Mettre à jour l'URL dans le code

Mettre à jour `PROXY_URL` dans :
- `dashboard/trading/js/crypto-loader.js`
- `dashboard/portfolio/js/portfolio.js`

```javascript
window.PROXY_URL = 'https://votre-url-railway.up.railway.app';
```

## ✅ Avantages Railway

- ✅ **Pas de blocage Binance** : Les connexions vers Binance fonctionnent
- ✅ **Gratuit** : 500 heures/mois gratuites
- ✅ **Auto-deploy** : Déploiement automatique à chaque push
- ✅ **HTTPS automatique** : SSL/HTTPS inclus
- ✅ **Pas de sommeil** : Les services restent actifs

## 🔧 Alternative : Fly.io

Si Railway ne convient pas, Fly.io est aussi une excellente alternative :

1. Installer Fly CLI : `npm install -g @fly/cli`
2. Se connecter : `fly auth login`
3. Créer l'app : `fly launch`
4. Déployer : `fly deploy`


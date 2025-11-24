# Crypto Nitro Proxy

Proxy CORS pour contourner les erreurs CORS lors des appels à Binance, CoinGecko et CoinMarketCap APIs depuis le navigateur.

## 🚀 Fonctionnalités

- **Proxy Binance** : Contourne les erreurs CORS pour l'API Binance
- **Proxy CoinGecko** : Contourne les erreurs CORS pour l'API CoinGecko
- **Proxy CoinMarketCap** : Proxy avec cache 10 minutes pour l'API CoinMarketCap (économise les appels API)
- **Gestion du rate limiting** : Détecte et gère les erreurs 429 (rate limit)
- **Cache CoinMarketCap** : Cache automatique de 10 minutes pour réduire les appels API
- **Headers CORS** : Configuration complète des headers CORS

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration locale

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000` (ou le port défini par `PORT`).

## 🌐 Déploiement sur Railway (Recommandé - Contourne le blocage Binance)

**⚠️ IMPORTANT :** Render bloque Binance (erreur 451). Utilisez Railway à la place.

### 1. Créer un compte Railway

1. Aller sur [Railway.app](https://railway.app)
2. S'inscrire/Se connecter avec GitHub

### 2. Déployer depuis GitHub

1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Choisir le repository `crypto-nitro-proxy`
4. Railway détecte automatiquement Node.js et déploie

### 3. Configuration automatique

Railway détecte automatiquement :
- ✅ `package.json` avec script `start`
- ✅ `node` dans `engines`
- ✅ Port via `process.env.PORT`

### 4. Obtenir l'URL du proxy

1. Une fois déployé, Railway génère une URL : `https://votre-proxy.railway.app`
2. Copier cette URL pour l'utiliser dans `crypto-nitro`

### 5. Variables d'environnement

Dans Railway → Variables :
- `PORT` : Laisser Railway le gérer automatiquement
- `COINMARKETCAP_API_KEY` : **Obligatoire** pour CoinMarketCap (obtenir sur https://coinmarketcap.com/api/)

### Avantages Railway vs Render

- ✅ **Pas de blocage Binance** (erreur 451)
- ✅ Déploiement automatique depuis GitHub
- ✅ Plan gratuit généreux
- ✅ Pas de configuration complexe

---

## 🌐 Déploiement sur Render (⚠️ NON RECOMMANDÉ - Bloque Binance)

**⚠️ ATTENTION :** Render retourne une erreur 451 pour Binance. Ne pas utiliser.

### 1. Créer un nouveau service Web sur Render

1. Aller sur [Render Dashboard](https://dashboard.render.com)
2. Cliquer sur "New +" → "Web Service"
3. Connecter votre repository GitHub `crypto-nitro-proxy`
4. Configurer le service :
   - **Name** : `crypto-nitro-proxy`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Port** : Laisser vide (Render détecte automatiquement le PORT)

### 2. Variables d'environnement

- `PORT` : Port d'écoute (par défaut: 3000, Render définit automatiquement)
- `COINMARKETCAP_API_KEY` : **Obligatoire** pour CoinMarketCap (obtenir sur https://coinmarketcap.com/api/)

### 3. Déployer

Render déploiera automatiquement à chaque push sur la branche principale.

## 📡 Utilisation

### Endpoint Health Check

```
GET /health
```

Retourne le statut du service.

### Proxy Binance

```
GET /api/binance/{endpoint}?{query}
```

**Exemples :**
- `/api/binance/ticker/price?symbol=BTCUSDT`
- `/api/binance/klines?symbol=BTCUSDT&interval=1h&limit=24`

### Proxy CoinGecko

```
GET /api/coingecko/{endpoint}?{query}
```

**Exemples :**
- `/api/coingecko/simple/price?ids=bitcoin&vs_currencies=usd`
- `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`

### Proxy CoinMarketCap (avec cache 10 minutes)

```
GET /api/coinmarketcap/{endpoint}?{query}
```

**⚠️ Requiert** : Variable d'environnement `COINMARKETCAP_API_KEY` configurée

**Exemples :**
- `/api/coinmarketcap/cryptocurrency/listings/latest?limit=100&sort=percent_change_24h`
- `/api/coinmarketcap/cryptocurrency/info?id=1`

**Cache :**
- Les résultats sont mis en cache pendant 10 minutes
- Tous les clients partagent le même cache
- Réduit drastiquement les appels API CoinMarketCap
- Réponse inclut `cached: true/false` et `cacheAge` (en secondes)

## 🔗 Intégration dans crypto-nitro

Remplacez les URLs directes par les URLs du proxy :

**Avant :**
```javascript
const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
```

**Après (Railway) :**
```javascript
const PROXY_URL = 'https://votre-proxy.railway.app';
const response = await fetch(`${PROXY_URL}/api/binance/ticker/price?symbol=BTCUSDT`);
const data = await response.json();
const binanceData = data.success ? data.data : data; // Les données sont dans data.data si success:true
```

## ⚠️ Limitations

- **Rate Limiting** : 
  - CoinGecko limite à 25-30 appels/minute (plan gratuit)
  - CoinMarketCap limite à 10 000 appels/mois (plan gratuit Basic)
  - Le cache CoinMarketCap réduit drastiquement les appels (1 appel toutes les 10 minutes max)
- **Timeout** : Les requêtes peuvent timeout si les APIs externes sont lentes
- **Coûts** : Railway propose un plan gratuit avec limitations (plus généreux que Render)

## 📝 Notes

- Ce proxy est destiné uniquement à contourner les erreurs CORS
- Il ne fait que rediriger les requêtes vers les APIs externes
- Tous les headers et paramètres sont transmis tels quels


# Crypto Nitro Proxy

Proxy CORS pour contourner les erreurs CORS lors des appels à Binance et CoinGecko APIs depuis le navigateur.

## 🚀 Fonctionnalités

- **Proxy Binance** : Contourne les erreurs CORS pour l'API Binance
- **Proxy CoinGecko** : Contourne les erreurs CORS pour l'API CoinGecko
- **Gestion du rate limiting** : Détecte et gère les erreurs 429 (rate limit)
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

## 🌐 Déploiement sur Render

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

### 2. Variables d'environnement (optionnelles)

- `PORT` : Port d'écoute (par défaut: 3000, Render définit automatiquement)

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

## 🔗 Intégration dans crypto-nitro

Remplacez les URLs directes par les URLs du proxy :

**Avant :**
```javascript
const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
```

**Après :**
```javascript
const PROXY_URL = 'https://votre-proxy-render.onrender.com';
const response = await fetch(`${PROXY_URL}/api/binance/ticker/price?symbol=BTCUSDT`);
const data = await response.json();
const binanceData = data.data; // Les données sont dans data.data
```

## ⚠️ Limitations

- **Rate Limiting** : CoinGecko limite à 25-30 appels/minute (plan gratuit)
- **Timeout** : Les requêtes peuvent timeout si les APIs externes sont lentes
- **Coûts** : Render propose un plan gratuit avec limitations

## 📝 Notes

- Ce proxy est destiné uniquement à contourner les erreurs CORS
- Il ne fait que rediriger les requêtes vers les APIs externes
- Tous les headers et paramètres sont transmis tels quels


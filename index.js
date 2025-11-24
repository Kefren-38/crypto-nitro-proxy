const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CACHE COINMARKETCAP (10 minutes) - Cache par endpoint =====
const coinmarketcapCache = new Map(); // Format: {endpoint: {data, timestamp}}
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes en millisecondes

function getCoinMarketCapCache(endpoint) {
    const cached = coinmarketcapCache.get(endpoint);
    if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_DURATION) {
            return cached.data;
        }
        // Cache expiré, le supprimer
        coinmarketcapCache.delete(endpoint);
    }
    return null;
}

function setCoinMarketCapCache(endpoint, data) {
    coinmarketcapCache.set(endpoint, {
        data: data,
        timestamp: Date.now()
    });
}

// Middleware CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// ===== ROUTE HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'crypto-nitro-proxy',
        timestamp: new Date().toISOString()
    });
});

// ===== PROXY COINMARKETCAP (avec cache 10 minutes) - UNIQUEMENT =====
app.get('/api/coinmarketcap/*', async (req, res) => {
    try {
        // Vérifier si la clé API est configurée
        const apiKey = process.env.COINMARKETCAP_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'COINMARKETCAP_API_KEY non configurée dans les variables d\'environnement'
            });
        }

        // Récupérer le chemin après /api/coinmarketcap/
        // Express capture le chemin avec req.params[0] pour les routes avec *
        let fullPath = req.params[0] || req.url.replace('/api/coinmarketcap/', '').split('?')[0] || '';
        
        // ✅ CORRECTION : Retirer le préfixe "v1/" du chemin s'il est présent
        // Car la base URL contient déjà /v1/
        if (fullPath.startsWith('v1/')) {
            fullPath = fullPath.replace('v1/', '');
        }
        
        const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
        const cacheKey = `${fullPath}${queryString ? '?' + queryString : ''}`;
        
        // Debug
        console.log(`🔍 Debug route - req.url: ${req.url}`);
        console.log(`🔍 Debug route - fullPath après nettoyage: ${fullPath}`);
        
        // Vérifier le cache avant d'appeler l'API
        const cachedData = getCoinMarketCapCache(cacheKey);
        if (cachedData) {
            const cachedEntry = coinmarketcapCache.get(cacheKey);
            const age = Math.round((Date.now() - cachedEntry.timestamp) / 1000);
            console.log(`📦 Cache CoinMarketCap utilisé (âge: ${age}s) pour endpoint: ${cacheKey}`);
            return res.json({
                success: true,
                source: 'coinmarketcap',
                cached: true,
                cacheAge: age,
                data: cachedData,
                timestamp: new Date(cachedEntry.timestamp).toISOString()
            });
        }

        // Construire l'URL CoinMarketCap (fullPath et queryString déjà récupérés pour le cache)
        const baseUrl = 'https://pro-api.coinmarketcap.com/v1/';
        const cmcUrl = `${baseUrl}${fullPath}${queryString ? '?' + queryString : ''}`;
        
        console.log(`📡 Proxy CoinMarketCap - Chemin complet: ${fullPath}`);
        console.log(`📡 Proxy CoinMarketCap - Query: ${queryString}`);
        console.log(`📡 Proxy CoinMarketCap - URL finale: ${cmcUrl}`);
        
        const response = await fetch(cmcUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-CMC_PRO_API_KEY': apiKey,
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        // Gérer le rate limiting CoinMarketCap (429)
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            return res.status(429).json({
                success: false,
                error: 'Rate limit CoinMarketCap atteint',
                retryAfter: parseInt(retryAfter),
                message: `Veuillez réessayer dans ${retryAfter} secondes`
            });
        }
        
        if (response.ok) {
            const data = await response.json();
            
            // Mettre en cache les données avec la clé endpoint
            setCoinMarketCapCache(cacheKey, data);
            console.log(`✅ Données CoinMarketCap mises en cache pour endpoint: ${cacheKey}`);
            
            res.json({
                success: true,
                source: 'coinmarketcap',
                cached: false,
                data: data,
                timestamp: new Date().toISOString()
            });
        } else {
            const errorText = await response.text();
            console.error(`❌ CoinMarketCap API error ${response.status}:`, errorText);
            
            res.status(response.status).json({
                success: false,
                error: `CoinMarketCap API returned ${response.status}`,
                status: response.status,
                details: errorText
            });
        }
    } catch (error) {
        console.error('❌ Erreur proxy CoinMarketCap:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ROUTE RACINE =====
app.get('/', (req, res) => {
    res.json({
        service: 'Crypto Nitro Proxy - CoinMarketCap uniquement',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            coinmarketcap: '/api/coinmarketcap/* (avec cache 10min)'
        },
        documentation: 'https://github.com/Kefren-38/crypto-nitro-proxy'
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Crypto Nitro Proxy démarré sur le port ${PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - CoinMarketCap: http://localhost:${PORT}/api/coinmarketcap/* (cache 10min)`);
    
    // Vérifier la configuration CoinMarketCap
    if (process.env.COINMARKETCAP_API_KEY) {
        console.log(`✅ CoinMarketCap API Key configurée`);
    } else {
        console.log(`⚠️  CoinMarketCap API Key non configurée (variable d'environnement COINMARKETCAP_API_KEY)`);
    }
});


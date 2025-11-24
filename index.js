const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CACHE COINMARKETCAP (10 minutes) =====
const coinmarketcapCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 10 * 60 * 1000 // 10 minutes en millisecondes
};

function getCoinMarketCapCache() {
    if (coinmarketcapCache.data && coinmarketcapCache.timestamp) {
        const age = Date.now() - coinmarketcapCache.timestamp;
        if (age < coinmarketcapCache.CACHE_DURATION) {
            return coinmarketcapCache.data;
        }
    }
    return null;
}

function setCoinMarketCapCache(data) {
    coinmarketcapCache.data = data;
    coinmarketcapCache.timestamp = Date.now();
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

// ===== PROXY BINANCE =====
app.get('/api/binance/*', async (req, res) => {
    try {
        // Récupérer le chemin après /api/binance/
        const binancePath = req.params[0] || '';
        const queryString = req.url.split('?')[1] || '';
        
        // Construire l'URL Binance
        const binanceUrl = `https://api.binance.com/api/v3/${binancePath}${queryString ? '?' + queryString : ''}`;
        
        console.log(`📡 Proxy Binance: ${binanceUrl}`);
        
        const response = await fetch(binanceUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            res.json({
                success: true,
                source: 'binance',
                data: data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(response.status).json({
                success: false,
                error: `Binance API returned ${response.status}`,
                status: response.status
            });
        }
    } catch (error) {
        console.error('❌ Erreur proxy Binance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== PROXY COINGECKO =====
app.get('/api/coingecko/*', async (req, res) => {
    try {
        // Récupérer le chemin après /api/coingecko/
        const coingeckoPath = req.params[0] || '';
        const queryString = req.url.split('?')[1] || '';
        
        // Construire l'URL CoinGecko
        const coingeckoUrl = `https://api.coingecko.com/api/v3/${coingeckoPath}${queryString ? '?' + queryString : ''}`;
        
        console.log(`📡 Proxy CoinGecko: ${coingeckoUrl}`);
        
        const response = await fetch(coingeckoUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        // Gérer le rate limiting CoinGecko (429)
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            return res.status(429).json({
                success: false,
                error: 'Rate limit CoinGecko atteint',
                retryAfter: parseInt(retryAfter),
                message: `Veuillez réessayer dans ${retryAfter} secondes`
            });
        }
        
        if (response.ok) {
            const data = await response.json();
            res.json({
                success: true,
                source: 'coingecko',
                data: data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(response.status).json({
                success: false,
                error: `CoinGecko API returned ${response.status}`,
                status: response.status
            });
        }
    } catch (error) {
        console.error('❌ Erreur proxy CoinGecko:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== PROXY COINMARKETCAP (avec cache 10 minutes) =====
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

        // Vérifier le cache avant d'appeler l'API
        const cachedData = getCoinMarketCapCache();
        if (cachedData) {
            const age = Math.round((Date.now() - coinmarketcapCache.timestamp) / 1000);
            console.log(`📦 Cache CoinMarketCap utilisé (âge: ${age}s)`);
            return res.json({
                success: true,
                source: 'coinmarketcap',
                cached: true,
                cacheAge: age,
                data: cachedData,
                timestamp: new Date(coinmarketcapCache.timestamp).toISOString()
            });
        }

        // Récupérer le chemin après /api/coinmarketcap/
        const cmcPath = req.params[0] || '';
        const queryString = req.url.split('?')[1] || '';
        
        // Construire l'URL CoinMarketCap
        const cmcUrl = `https://pro-api.coinmarketcap.com/v1/${cmcPath}${queryString ? '?' + queryString : ''}`;
        
        console.log(`📡 Proxy CoinMarketCap: ${cmcUrl}`);
        
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
            
            // Mettre en cache les données
            setCoinMarketCapCache(data);
            console.log(`✅ Données CoinMarketCap mises en cache`);
            
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
        service: 'Crypto Nitro Proxy',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            binance: '/api/binance/*',
            coingecko: '/api/coingecko/*',
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
    console.log(`   - Binance: http://localhost:${PORT}/api/binance/*`);
    console.log(`   - CoinGecko: http://localhost:${PORT}/api/coingecko/*`);
    console.log(`   - CoinMarketCap: http://localhost:${PORT}/api/coinmarketcap/* (cache 10min)`);
    
    // Vérifier la configuration CoinMarketCap
    if (process.env.COINMARKETCAP_API_KEY) {
        console.log(`✅ CoinMarketCap API Key configurée`);
    } else {
        console.log(`⚠️  CoinMarketCap API Key non configurée (variable d'environnement COINMARKETCAP_API_KEY)`);
    }
});


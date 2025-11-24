const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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

// ===== ROUTE RACINE =====
app.get('/', (req, res) => {
    res.json({
        service: 'Crypto Nitro Proxy',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            binance: '/api/binance/*',
            coingecko: '/api/coingecko/*'
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
});



import { NewsArticle } from '../types';

// We use rss2json to turn RSS feeds into a usable "Live API" for the frontend.
const RSS_TO_JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json?rss_url=';
const STORAGE_KEY = 'vhembe_news_archive_v2';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Bloomberg-style feed configuration
const FEED_SOURCES = [
  { 
    url: 'https://www.forexlive.com/feed', 
    category: 'Sentiment', 
    sourceName: 'ForexLive', 
    priority: 1
  },
  { 
    url: 'https://www.fxstreet.com/rss/news', 
    category: 'Squawk', 
    sourceName: 'FXStreet',
    priority: 2
  },
  { 
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X,GBPUSD=X,JPY=X,BTC-USD,GC=F', 
    category: 'Markets', 
    sourceName: 'Yahoo Finance',
    priority: 3
  },
  {
    url: 'https://cointelegraph.com/rss',
    category: 'Crypto',
    sourceName: 'CoinTelegraph',
    priority: 4
  }
];

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1621504450168-38f647319680?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1565514020176-dbf22384914e?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&q=80&w=1000'
];

const getFallbackImage = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
};

const analyzeSentiment = (text: string): 'Bullish' | 'Bearish' | 'Neutral' => {
  const t = text.toLowerCase();
  const bullish = ['soars', 'jumps', 'rallies', 'gains', 'bull', 'buy', 'support hold', 'breakout', 'higher', 'hawkish', 'beats', 'positive', 'upgrade', 'surges', 'records', 'recovers', 'record high'];
  const bearish = ['plunges', 'dives', 'drops', 'falls', 'bear', 'sell', 'resistance', 'breakdown', 'lower', 'dovish', 'misses', 'negative', 'downgrade', 'retreats', 'crash', 'sinks', 'lows'];

  if (bullish.some(w => t.includes(w))) return 'Bullish';
  if (bearish.some(w => t.includes(w))) return 'Bearish';
  return 'Neutral';
};

const checkForBreakingContext = (text: string): boolean => {
    const t = text.toLowerCase();
    const highImpactKeywords = [
        'fed ', 'federal reserve', 'fomc', 'powell',
        'ecb', 'lagarde', 'boj', 'ueda',
        'cpi', 'nfp', 'rate decision', 'hike', 'cut', 'rates', 
        'breaking', 'urgent', 'alert', 'war', 'invasion'
    ];
    return highImpactKeywords.some(k => t.includes(k));
};

const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// --- CORE FETCH & PERSISTENCE ---

export const fetchMarketNews = async (): Promise<NewsArticle[]> => {
  try {
    // 1. Fetch Fresh Data
    const feedPromises = FEED_SOURCES.map(src => 
      fetch(`${RSS_TO_JSON_ENDPOINT}${encodeURIComponent(src.url)}`)
        .then(res => res.json())
        .then(data => ({ status: data.status, items: data.items || [], config: src }))
        .catch(err => ({ status: 'error', items: [], config: src }))
    );

    const results = await Promise.all(feedPromises);
    let freshArticles: NewsArticle[] = [];

    results.forEach(({ status, items, config }) => {
      if (status === 'ok') {
        items.forEach((item: any) => {
            // Enhanced Image Extraction
            let imageUrl = item.thumbnail;
            if (!imageUrl && item.enclosure?.link) imageUrl = item.enclosure.link;
            if (!imageUrl) {
                const imgMatch = item.content?.match(/src=["']([^"']*)["']/) || item.description?.match(/src=["']([^"']*)["']/);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            const summaryClean = item.description
                ? item.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').slice(0, 250) + '...'
                : '';

            const uniqueId = item.guid || item.link || `${config.sourceName}-${item.title}`;
            const pubDate = new Date(item.pubDate);
            
            // Use fallback if no image found or is generic feedburner image
            if (!imageUrl || imageUrl.includes('feedburner') || imageUrl.includes('ads')) {
                imageUrl = getFallbackImage(item.title || uniqueId);
            }

            const textContent = (item.title + ' ' + summaryClean);
            
            freshArticles.push({
                id: uniqueId,
                headline: item.title,
                summary: summaryClean,
                category: config.category,
                publishedAt: pubDate.getTime(),
                timestamp: formatTime(pubDate),
                author: item.author || config.sourceName,
                imageUrl: imageUrl,
                url: item.link,
                fullContent: item.content || item.description,
                isBreaking: checkForBreakingContext(textContent),
                sentiment: analyzeSentiment(textContent)
            });
        });
      }
    });

    // 2. Load Archived Data
    let archivedArticles: NewsArticle[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) archivedArticles = JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load news archive", e);
    }

    // 3. Merge & Deduplicate (Favoring Fresh Data)
    const articleMap = new Map<string, NewsArticle>();
    
    // Load archive first
    archivedArticles.forEach(a => articleMap.set(a.id, a));
    // Overwrite with fresh data (updates timestamps/content if changed)
    freshArticles.forEach(a => articleMap.set(a.id, a));

    // 4. Filter & Prune (7 Day Retention)
    const cutoff = Date.now() - ONE_WEEK_MS;
    const mergedArticles = Array.from(articleMap.values())
        .filter(a => a.publishedAt > cutoff)
        .sort((a, b) => b.publishedAt - a.publishedAt);

    // 5. Save Back to Storage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedArticles));
    } catch (e) {
        // Handle quota exceeded by slicing keeping only top 200
        if (mergedArticles.length > 200) {
             const trimmed = mergedArticles.slice(0, 200);
             localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        }
    }

    return mergedArticles;

  } catch (error) {
    console.error('Failed to update news feed:', error);
    // Return cached if fetch fails
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

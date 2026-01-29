import { NewsArticle, UserProfile } from '../types';
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";

// --- LOCAL UTILS ---

const determineSentiment = (text: string): 'Bullish' | 'Bearish' | 'Neutral' => {
  const t = text.toLowerCase();
  const bullishTerms = ['soars', 'jumps', 'rallies', 'gains', 'bull', 'buy', 'support hold', 'breakout', 'higher', 'hawkish', 'beats', 'positive', 'upgrade', 'surges', 'records'];
  const bearishTerms = ['plunges', 'dives', 'drops', 'falls', 'bear', 'sell', 'resistance', 'breakdown', 'lower', 'dovish', 'misses', 'negative', 'downgrade', 'retreats', 'crash'];

  if (bullishTerms.some(term => t.includes(term))) return 'Bullish';
  if (bearishTerms.some(term => t.includes(term))) return 'Bearish';
  return 'Neutral';
};

// --- NEWS SERVICE (RSS BASED) ---
// This remains unchanged as it fetches from external RSS
export const fetchRealForexNews = async (): Promise<NewsArticle[]> => {
  try {
    const PROXY_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const SOURCES = [
      { url: 'https://www.forexlive.com/feed', tag: 'Sentiment', author: 'ForexLive' },
      { url: 'https://www.fxstreet.com/rss/news', tag: 'Squawk', author: 'Terminal' }
    ];

    const promises = SOURCES.map(src => fetch(`${PROXY_BASE}${encodeURIComponent(src.url)}`));
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));

    let allNews: NewsArticle[] = [];

    results.forEach((data: any, index: number) => {
      if (data.status === 'ok') {
        const sourceConfig = SOURCES[index];
        const items = data.items.map((item: any, i: number) => {
          const cleanSummary = item.description
            .replace(/<[^>]*>?/gm, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
            .slice(0, 300) + (item.description.length > 300 ? '...' : '');

          const imgMatch = item.content?.match(/src="([^"]*)"/) || item.description?.match(/src="([^"]*)"/);
          const imageUrl = item.thumbnail || (imgMatch ? imgMatch[1] : `https://picsum.photos/800/600?random=${index * 100 + i}`);
          const rawContent = item.content || item.description || "";

          return {
            id: `${sourceConfig.tag}-${i}-${Date.now()}`,
            headline: item.title,
            summary: cleanSummary,
            category: sourceConfig.tag,
            author: item.author || sourceConfig.author,
            timestamp: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            publishedAt: new Date(item.pubDate).getTime(),
            isBreaking: i === 0 && index === 1,
            imageUrl: imageUrl,
            url: item.link,
            fullContent: rawContent, 
            sentiment: determineSentiment(item.title + ' ' + cleanSummary)
          };
        });
        allNews = [...allNews, ...items];
      }
    });

    if (allNews.length === 0) return MOCK_NEWS_FALLBACK;
    return allNews;

  } catch (error) {
    console.warn("RSS fetch failed, using fallback data:", error);
    return MOCK_NEWS_FALLBACK;
  }
};

export const generateFullArticle = async (headline: string, summary: string, category: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 400));
  if (summary.includes('<p>') && summary.length > 200) return summary;
  return `
    <div class="article-body">
      <p class="lead font-serif text-lg text-slate-700 leading-relaxed drop-cap">${summary}</p>
      <br/>
      <div class="bg-slate-50 p-4 border-l-4 border-brand-primary my-6">
        <h4 class="text-xs font-bold uppercase text-brand-secondary mb-2">Market Context</h4>
        <p class="text-sm text-slate-600">This update follows recent volatility in the ${category} sector.</p>
      </div>
      <h3>Technical Perspective</h3>
      <p>Institutional order flow data indicates increased volume consistent with the sentiment described above.</p>
    </div>
  `;
};

// --- FIRESTORE INTEGRATION ---

export const saveSmartMoneyPost = async (article: NewsArticle, isPremium: boolean = true) => {
  try {
    // Add to Firestore 'articles' collection
    await addDoc(collection(db, "articles"), {
        ...article,
        createdAt: Date.now(),
        isPremium: isPremium // Use the flag passed from the editor
    });
    return true;
  } catch (e) {
    console.error("Failed to save post to Firestore", e);
    return false;
  }
};

export const generateSmartMoneyInsights = async (user: UserProfile | null): Promise<NewsArticle[]> => {
  try {
    let q;

    if (user) {
        // Authenticated users (Pro/Admin) can see everything
        q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(20));
    } else {
        // Guests can only see Free posts
        // CRITICAL FIX: Removed orderBy("createdAt") to avoid needing a Composite Index
        // Firestore allows 'where' without index, but 'where' + 'orderBy' needs one.
        // We will sort client-side instead.
        q = query(collection(db, "articles"), where("isPremium", "==", false), limit(20));
    }

    const querySnapshot = await getDocs(q);
    
    const dbPosts: NewsArticle[] = [];
    querySnapshot.forEach((doc) => {
        const d = doc.data() as any;
        dbPosts.push({
            id: doc.id,
            headline: d.headline,
            summary: d.summary,
            category: d.category,
            timestamp: d.timestamp,
            publishedAt: d.publishedAt || d.createdAt, // Fallback
            author: d.author,
            imageUrl: d.imageUrl,
            sentiment: d.sentiment,
            liquidityLevels: d.liquidityLevels
        });
    });

    // Client-side Sort (descending)
    dbPosts.sort((a, b) => b.publishedAt - a.publishedAt);

    if (dbPosts.length > 0) return dbPosts;
    return user ? MOCK_OPINIONS : MOCK_FREE_OPINIONS; // Fallback based on auth state

  } catch (e) {
    console.error("Error reading Firestore (Returning Mock Data):", e);
    // Return fallback if permissions fail or DB empty
    return user ? MOCK_OPINIONS : MOCK_FREE_OPINIONS;
  }
};

export const analyzeMarketSentiment = async (ticker: string): Promise<string> => {
  return "Consolidating near key pivot. Retail sentiment is 65% long, suggesting potential for institutional stop-hunt.";
};

// --- BACKUP DATA ---

const MOCK_NEWS_FALLBACK: NewsArticle[] = [
  {
    id: '1',
    headline: "EUR/USD Rejects 1.0900 Resistance as ECB Hawks Retreat",
    summary: "The pair failed to sustain momentum above the 1.0900 psychological handle. Bears are targeting the 200-day moving average at 1.0820 as yields diverge significantly between the EU and US.",
    category: "FX Majors",
    timestamp: "10:42 AM",
    publishedAt: Date.now() - 3600000,
    author: "FX Desk",
    isBreaking: true,
    imageUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000",
    url: "https://www.forexlive.com",
    sentiment: 'Bearish'
  }
];

const MOCK_OPINIONS: NewsArticle[] = [
  {
    id: 'op1',
    headline: "GBP/JPY: Ascending Triangle Breakout Targeting 192.00",
    summary: "Price has been compressing against the 190.50 resistance for three days. The higher lows on the H4 timeframe suggest buying pressure is building. A clean break above 190.50 targets liquidity above 192.00.",
    category: "Technical Setup",
    timestamp: "Mar 12, 2024",
    publishedAt: 1710230400000,
    author: "A. Sterling, CMT",
    imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&q=80&w=1000",
    url: "https://discord.com",
    sentiment: 'Bullish',
    liquidityLevels: {
      support: "189.20",
      resistance: "190.50",
      stopHunt: "192.15"
    }
  }
];

const MOCK_FREE_OPINIONS: NewsArticle[] = [
  {
    id: 'free1',
    headline: "Weekly Market Outlook: Central Banks in Focus",
    summary: "This week brings rate decisions from the Fed and ECB. Volatility is expected to remain high across major pairs. Read our free primer on how to trade high-impact news events.",
    category: "Market Update",
    timestamp: "Mar 11, 2024",
    publishedAt: 1710144000000,
    author: "Vhembe Staff",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1000",
    url: "#",
    sentiment: 'Neutral'
  }
];
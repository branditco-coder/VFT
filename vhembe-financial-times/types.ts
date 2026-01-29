
export enum Impact {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  HOLIDAY = 'Holiday'
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  currency: string;
  impact: Impact;
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  category: string;
  timestamp: string; // Display string
  publishedAt: number; // Epoch for sorting/filtering
  author: string;
  imageUrl?: string;
  url?: string; // Link to the full article
  fullContent?: string; // Full HTML content of the article
  isBreaking?: boolean;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  liquidityLevels?: {
    support: string;
    resistance: string;
    stopHunt: string; // The "Institutional" level to watch
  };
}

export interface MarketTickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MacroEconomy {
  country: string;
  iso: string; // 'US', 'ZA', etc.
  currency: string;
  centralBankRate: number;
  inflationRate: number;
  realYield: number; // Rate - Inflation
  gdpGrowth: number; // Real GDP Growth % (Year over Year)
  nominalGDP: number; // Nominal GDP in Billions USD
  lastUpdated: string;
  trend: 'hiking' | 'cutting' | 'neutral';
}

export interface MacroHistoryPoint {
  date: string;       // YYYY-MM
  policyRate: number;
  inflation: number;
  realYield: number;
}

export interface BillionaireProfile {
  rank: number;
  name: string;
  netWorth: number;
  change: number;
  changePercent: number;
  ytd: number;
  country: string;
  state: string | null;
  city: string | null;
  industry: string;
  ticker: string;
  sourceDescription: string;
  age: number;
  image: string;
  bio: string[];
  maritalStatus: string | null;
  children: number | null;
  education: string[];
  selfMadeScore: number | null;
  philanthropyScore: number | null;
  dropOff: boolean;
}

// --- AUTH TYPES ---
export type UserRole = 'guest' | 'pro' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  joinedAt: number;
}

export type ViewState = 'news' | 'calendar' | 'markets' | 'macro' | 'wealth' | 'opinion' | 'analytics' | 'admin';

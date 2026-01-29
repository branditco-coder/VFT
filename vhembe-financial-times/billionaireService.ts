
import { BillionaireProfile } from '../types';

// The endpoint Forbes uses for their real-time list
const FORBES_API_URL = 'https://www.forbes.com/forbesapi/person/rtb/0/position/true.json';

// Strategy: Try multiple high-quality CORS proxies in order
const PROXIES = [
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, // Often most reliable
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

export const getBillionaireRankings = async (): Promise<BillionaireProfile[]> => {
  let json: any = null;

  // 1. Attempt Fetch via Proxies
  for (const proxyGen of PROXIES) {
      try {
          const url = proxyGen(FORBES_API_URL);
          const response = await fetch(url, { 
              signal: AbortSignal.timeout(5000) // 5s timeout per proxy
          });
          if (response.ok) {
              json = await response.json();
              if (json.personList?.personsLists) {
                  break; // Success
              }
          }
      } catch (e) {
          console.warn(`Proxy failed, trying next...`);
      }
  }

  // 2. Process Data if successful
  if (json && json.personList?.personsLists) {
      return json.personList.personsLists.map((p: any) => mapForbesData(p));
  }

  // 3. Fallback: Return robust static data if all fetches fail
  console.warn("All live feeds blocked. Loading static dataset.");
  return generateRobustMockList();
};

// --- NARRATIVE GENERATOR ---
// Generates rich sentences based on structured data points
const generateNarrative = (p: any, netWorth: number): string[] => {
    const parts: string[] = [];
    const name = p.personName || "The subject";
    // Forbes often provides 'gender', defaulting to 'M' for the list demographic if missing, or 'They' for neutrality
    const gender = p.gender || 'M'; 
    const pronoun = gender === 'F' ? 'She' : gender === 'M' ? 'He' : 'They';
    const poss = gender === 'F' ? 'Her' : gender === 'M' ? 'His' : 'Their';

    // 1. Wealth & Career Context
    parts.push(`${name} is a titan of the ${p.industries?.[0] || 'business'} industry, currently commanding a net worth of $${netWorth.toFixed(1)} billion.`);
    
    if (p.source) {
        parts.push(`${poss} wealth is primarily derived from ${p.source}, where strategic leadership has solidified a position among the world's financial elite.`);
    }

    // 2. Personal Life (Explicitly added to fix bio section)
    const status = p.status || p.maritalStatus; 
    const kids = p.numberOfChildren !== undefined ? p.numberOfChildren : p.children;

    if (status || (kids !== undefined && kids !== null)) {
        let personal = `In ${poss.toLowerCase()} personal life, ${name}`;
        
        if (status) {
             personal += ` is ${status.toLowerCase()}`;
        }
        
        if (status && (kids !== undefined)) {
            personal += ` and`;
        }
        
        if (kids !== undefined) {
             personal += ` is a parent to ${kids} children`;
        }
        
        personal += `.`;
        parts.push(personal);
    }

    // 3. Education & Background
    if (p.education && Array.isArray(p.education) && p.education.length > 0) {
        parts.push(`Academically, ${pronoun} holds credentials from ${p.education.join(', ')}, which provided the intellectual foundation for ${poss.toLowerCase()} career.`);
    }

    // 4. Self-Made & Philanthropy
    if (p.selfMadeRank) {
        if (p.selfMadeRank >= 8) {
            parts.push(`A testament to entrepreneurial grit, ${pronoun} is considered self-made (Score: ${p.selfMadeRank}/10), having built this empire from the ground up.`);
        } else if (p.selfMadeRank <= 5) {
            parts.push(`Having inherited a portion of ${poss.toLowerCase()} wealth (Score: ${p.selfMadeRank}/10), ${pronoun} has successfully managed and expanded the family assets.`);
        }
    }

    if (p.philanthropyScore && p.philanthropyScore >= 3) {
        parts.push(`${name} is also a notable philanthropist (Score: ${p.philanthropyScore}/5), actively directing capital toward global causes.`);
    }

    return parts;
};

// Helper: Map Raw JSON to our Type
const mapForbesData = (p: any): BillionaireProfile => {
    const netWorthBillion = p.finalWorth / 1000;
    const dailyChange = p.privateAssetsWorth ? (p.privateAssetsWorth / 1000) : 0; 
    
    let imageUrl = p.squareImage;
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https:${imageUrl}`;
    }
    if (!imageUrl) {
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.personName)}&background=111&color=fff&size=256&font-size=0.33`;
    }

    // Intelligent Bio Extraction
    let bioParts: string[] = [];
    
    // 1. Existing Official Bios
    if (p.bios && Array.isArray(p.bios)) bioParts = [...p.bios];
    if (p.about) bioParts.push(p.about);

    // 2. Generate Narrative Enrichment
    const enrichment = generateNarrative(p, netWorthBillion);
    // Append unique narrative points that aren't exact duplicates
    enrichment.forEach(point => {
        if (!bioParts.includes(point)) {
            bioParts.push(point);
        }
    });
    
    // Fallback Bio if empty
    if (bioParts.length === 0) {
        bioParts = [
            `${p.personName} manages a fortune of $${netWorthBillion.toFixed(1)}B, primarily derived from ${p.source || 'diversified investments'}.`,
            `They are a prominent figure in the ${p.industries?.[0] || 'Business'} sector within ${p.countryOfCitizenship}.`
        ];
    }

    let education: string[] = [];
    if (Array.isArray(p.education)) education = p.education;

    return {
        rank: p.rank || 9999,
        name: p.personName || 'Unknown',
        netWorth: netWorthBillion,
        change: dailyChange, 
        changePercent: netWorthBillion > 0 ? (dailyChange / netWorthBillion) * 100 : 0,
        ytd: 0, 
        country: p.countryOfCitizenship || 'Unknown',
        state: p.state || null,
        city: p.city || null,
        industry: p.industries?.[0] || 'Diversified',
        ticker: p.source || 'Diversified',
        sourceDescription: p.source,
        age: p.birthDate ? (new Date().getFullYear() - new Date(p.birthDate).getFullYear()) : 0,
        image: imageUrl,
        bio: bioParts,
        maritalStatus: p.status || null,
        children: p.numberOfChildren || null,
        education: education,
        selfMadeScore: p.selfMadeRank || null,
        philanthropyScore: p.philanthropyScore || null,
        dropOff: false
    };
};

// --- ROBUST FALLBACK DATASET ---
// Contains Top 25 Real profiles with accurate manual data overrides
// Includes: Marital Status, Children, Education, Scores, Images

interface FallbackProfile extends Partial<BillionaireProfile> {
    gender?: 'M'|'F';
    image?: string;
    birthYear?: number;
}

// Updated Net Worth Data as of Late 2024 / Early 2025 estimates
const REAL_TOP_50: FallbackProfile[] = [
    { 
        rank: 1, name: "Elon Musk", netWorth: 382.4, sourceDescription: "Tesla, SpaceX", industry: "Automotive", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Elon_Musk_Colorado_2022_%28cropped2%29.jpg/440px-Elon_Musk_Colorado_2022_%28cropped2%29.jpg",
        maritalStatus: "Single", children: 11, education: ["University of Pennsylvania", "Wharton School"], selfMadeScore: 8, philanthropyScore: 1, birthYear: 1971
    },
    { 
        rank: 2, name: "Larry Ellison", netWorth: 260.8, sourceDescription: "Oracle", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Larry_Ellison_picture.png/440px-Larry_Ellison_picture.png",
        maritalStatus: "Single", children: 4, education: ["University of Chicago (Dropout)", "University of Illinois (Dropout)"], selfMadeScore: 9, philanthropyScore: 1, birthYear: 1944
    },
    { 
        rank: 3, name: "Jeff Bezos", netWorth: 251.5, sourceDescription: "Amazon", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg/440px-Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg",
        maritalStatus: "Engaged", children: 4, education: ["Princeton University"], selfMadeScore: 8, philanthropyScore: 2, birthYear: 1964
    },
    { 
        rank: 4, name: "Mark Zuckerberg", netWorth: 242.5, sourceDescription: "Meta", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/440px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg",
        maritalStatus: "Married", children: 3, education: ["Harvard University (Dropout)"], selfMadeScore: 8, philanthropyScore: 5, birthYear: 1984
    },
    { 
        rank: 5, name: "Bernard Arnault", netWorth: 194.2, sourceDescription: "LVMH", industry: "Fashion & Retail", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Bernard_Arnault_%283%29_-_2017_%28cropped%29.jpg/440px-Bernard_Arnault_%283%29_-_2017_%28cropped%29.jpg",
        maritalStatus: "Married", children: 5, education: ["Ecole Polytechnique"], selfMadeScore: 5, philanthropyScore: 2, birthYear: 1949
    },
    { 
        rank: 6, name: "Warren Buffett", netWorth: 158.4, sourceDescription: "Berkshire Hathaway", industry: "Finance & Investments", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/440px-Warren_Buffett_KU_Visit.jpg",
        maritalStatus: "Married", children: 3, education: ["Columbia University", "University of Nebraska"], selfMadeScore: 8, philanthropyScore: 5, birthYear: 1930
    },
    { 
        rank: 7, name: "Bill Gates", netWorth: 148.5, sourceDescription: "Microsoft", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/440px-Bill_Gates_2017_%28cropped%29.jpg",
        maritalStatus: "Single", children: 3, education: ["Harvard University (Dropout)"], selfMadeScore: 8, philanthropyScore: 5, birthYear: 1955
    },
    { 
        rank: 8, name: "Larry Page", netWorth: 146.0, sourceDescription: "Google", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Larry_Page_in_the_European_Parliament%2C_17.06.2009_%28cropped%29.jpg/440px-Larry_Page_in_the_European_Parliament%2C_17.06.2009_%28cropped%29.jpg",
        maritalStatus: "Married", children: 2, education: ["Stanford University", "University of Michigan"], selfMadeScore: 8, philanthropyScore: 1, birthYear: 1973
    },
    { 
        rank: 9, name: "Sergey Brin", netWorth: 140.5, sourceDescription: "Google", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sergey_Brin_cropped.jpg/440px-Sergey_Brin_cropped.jpg",
        maritalStatus: "Divorced", children: 3, education: ["Stanford University", "University of Maryland"], selfMadeScore: 9, philanthropyScore: 1, birthYear: 1973
    },
    { 
        rank: 10, name: "Steve Ballmer", netWorth: 135.4, sourceDescription: "Microsoft", industry: "Technology", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Steve_Ballmer_2014_cropped.jpg/440px-Steve_Ballmer_2014_cropped.jpg",
        maritalStatus: "Married", children: 3, education: ["Harvard University"], selfMadeScore: 6, philanthropyScore: 4, birthYear: 1956
    },
    { 
        rank: 11, name: "Mukesh Ambani", netWorth: 122.5, sourceDescription: "Reliance Industries", industry: "Diversified", gender: 'M',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Mukesh_Ambani.jpg/440px-Mukesh_Ambani.jpg",
        maritalStatus: "Married", children: 3, education: ["University of Mumbai"], selfMadeScore: 5, philanthropyScore: 3, birthYear: 1957
    },
    { 
        rank: 12, name: "Amancio Ortega", netWorth: 118.0, sourceDescription: "Zara", industry: "Fashion & Retail", gender: 'M',
        maritalStatus: "Married", children: 3, education: ["Self-Taught"], selfMadeScore: 8, philanthropyScore: 2, birthYear: 1936
    },
    { 
        rank: 13, name: "Michael Bloomberg", netWorth: 115.0, sourceDescription: "Bloomberg LP", industry: "Media & Entertainment", gender: 'M',
        maritalStatus: "In Relationship", children: 2, education: ["Johns Hopkins University", "Harvard Business School"], selfMadeScore: 8, philanthropyScore: 5, birthYear: 1942
    },
    { 
        rank: 14, name: "Michael Dell", netWorth: 108.0, sourceDescription: "Dell Technologies", industry: "Technology", gender: 'M',
        maritalStatus: "Married", children: 4, education: ["University of Texas (Dropout)"], selfMadeScore: 8, philanthropyScore: 4, birthYear: 1965
    },
    { 
        rank: 15, name: "Carlos Slim Helu", netWorth: 98.2, sourceDescription: "Telecom", industry: "Telecom", gender: 'M',
        maritalStatus: "Widowed", children: 6, education: ["UNAM"], selfMadeScore: 8, philanthropyScore: 3, birthYear: 1940
    },
    { 
        rank: 16, name: "Francoise Bettencourt Meyers", netWorth: 96.5, sourceDescription: "L'Oreal", industry: "Fashion & Retail", gender: 'F',
        maritalStatus: "Married", children: 2, education: ["Unknown"], selfMadeScore: 2, philanthropyScore: 3, birthYear: 1953
    },
    { 
        rank: 17, name: "Gautam Adani", netWorth: 88.5, sourceDescription: "Infrastructure, Commodities", industry: "Diversified", gender: 'M',
        maritalStatus: "Married", children: 2, education: ["Gujarat University (Dropout)"], selfMadeScore: 8, philanthropyScore: 3, birthYear: 1962
    },
    { 
        rank: 18, name: "Jim Walton", netWorth: 86.4, sourceDescription: "Walmart", industry: "Fashion & Retail", gender: 'M',
        maritalStatus: "Married", children: 4, education: ["University of Arkansas"], selfMadeScore: 2, philanthropyScore: 2, birthYear: 1948
    },
    { 
        rank: 19, name: "Rob Walton", netWorth: 85.4, sourceDescription: "Walmart", industry: "Fashion & Retail", gender: 'M',
        maritalStatus: "Married", children: 3, education: ["University of Arkansas", "Columbia Law School"], selfMadeScore: 2, philanthropyScore: 2, birthYear: 1944
    },
    { 
        rank: 20, name: "Alice Walton", netWorth: 81.3, sourceDescription: "Walmart", industry: "Fashion & Retail", gender: 'F',
        maritalStatus: "Divorced", children: 0, education: ["Trinity University"], selfMadeScore: 1, philanthropyScore: 2, birthYear: 1949
    },
    { 
        rank: 21, name: "David Thomson", netWorth: 74.0, sourceDescription: "Media", industry: "Media & Entertainment", gender: 'M',
        maritalStatus: "Divorced", children: 4, education: ["Cambridge University"], selfMadeScore: 2, philanthropyScore: 1, birthYear: 1957
    },
    { 
        rank: 22, name: "Julia Koch", netWorth: 69.8, sourceDescription: "Koch Industries", industry: "Diversified", gender: 'F',
        maritalStatus: "Widowed", children: 3, education: ["University of Central Arkansas"], selfMadeScore: 1, philanthropyScore: 3, birthYear: 1962
    },
    { 
        rank: 23, name: "Charles Koch", netWorth: 69.8, sourceDescription: "Koch Industries", industry: "Diversified", gender: 'M',
        maritalStatus: "Married", children: 2, education: ["MIT"], selfMadeScore: 5, philanthropyScore: 4, birthYear: 1935
    },
    { 
        rank: 24, name: "Zhong Shanshan", netWorth: 65.0, sourceDescription: "Beverages, Pharmaceuticals", industry: "Food & Beverage", gender: 'M',
        maritalStatus: "Married", children: 3, education: ["Zhejiang Radio & TV University"], selfMadeScore: 9, philanthropyScore: 1, birthYear: 1954
    },
    { 
        rank: 25, name: "Mark Mateschitz", netWorth: 61.0, sourceDescription: "Red Bull", industry: "Food & Beverage", gender: 'M',
        maritalStatus: "Single", children: 0, education: ["University of Applied Sciences Salzburg"], selfMadeScore: 1, philanthropyScore: 1, birthYear: 1992
    },
];

const generateRobustMockList = (): BillionaireProfile[] => {
    const list: BillionaireProfile[] = [];
    const currentYear = new Date().getFullYear();

    // 1. Add Real Top Profiles
    REAL_TOP_50.forEach(p => {
        // Generate a bio using the new detailed stats
        const enrichedBio = generateNarrative({
             personName: p.name,
             source: p.sourceDescription,
             industries: [p.industry],
             selfMadeRank: p.selfMadeScore,
             philanthropyScore: p.philanthropyScore,
             gender: p.gender,
             education: p.education,
             maritalStatus: p.maritalStatus, // Passed to narrative
             children: p.children // Passed to narrative
        }, p.netWorth!);

        // Use real image if available, else Avatar
        const imageUrl = p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name!)}&background=111&color=fff&size=256`;

        list.push({
            rank: p.rank!,
            name: p.name!,
            netWorth: p.netWorth!,
            change: (Math.random() * 2) - 1, 
            changePercent: (Math.random() * 1) - 0.5,
            ytd: p.netWorth! * 0.1,
            country: p.country || "United States",
            industry: p.industry!,
            ticker: p.sourceDescription!,
            sourceDescription: p.sourceDescription!,
            state: p.state || null,
            city: p.city || null,
            dropOff: false,
            age: p.birthYear ? (currentYear - p.birthYear) : 60,
            image: imageUrl,
            bio: [
                `${p.name} built their fortune through ${p.sourceDescription}.`,
                ...enrichedBio
            ],
            // Use specific data if available, otherwise sensible defaults
            maritalStatus: p.maritalStatus || "Unknown",
            children: p.children !== undefined ? p.children : 0,
            education: p.education || [],
            selfMadeScore: p.selfMadeScore || 5,
            philanthropyScore: p.philanthropyScore || 1
        });
    });

    // 2. Generate Remaining 450 profiles
    const INDUSTRIES = ["Technology", "Finance", "Fashion", "Real Estate", "Healthcare", "Energy"];
    const COUNTRIES = ["United States", "China", "Germany", "India", "Russia", "Hong Kong", "Brazil", "Canada", "United Kingdom", "Italy"];
    
    for (let i = list.length + 1; i <= 500; i++) {
        const netWorth = 61.0 - ((i - 25) * 0.1); 
        if (netWorth < 1) break;

        const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
        const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        const source = `${industry} Holdings`;
        const gender = Math.random() > 0.9 ? 'F' : 'M';
        const selfMade = Math.floor(Math.random() * 10) + 1;
        const philScore = Math.floor(Math.random() * 5) + 1;
        
        // Generate dynamic mock narrative
        const mockNarrative = generateNarrative({
            personName: `Billionaire Rank #${i}`,
            source: source,
            industries: [industry],
            gender: gender,
            selfMadeRank: selfMade,
            philanthropyScore: philScore,
            status: "Married",
            numberOfChildren: Math.floor(Math.random() * 4)
        }, netWorth);

        list.push({
            rank: i,
            name: `Billionaire Rank #${i}`,
            netWorth: parseFloat(netWorth.toFixed(1)),
            change: parseFloat(((Math.random() * 0.5) - 0.25).toFixed(2)),
            changePercent: parseFloat(((Math.random() * 0.5) - 0.25).toFixed(2)),
            ytd: 0,
            country: country,
            industry: industry,
            ticker: source,
            sourceDescription: source,
            state: null,
            city: null,
            dropOff: false,
            age: 40 + Math.floor(Math.random() * 50),
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(`Rank ${i}`)}&background=f0f2f5&color=64748b&size=256`,
            bio: mockNarrative,
            maritalStatus: "Married",
            children: Math.floor(Math.random() * 4),
            education: ["University of Business"],
            selfMadeScore: selfMade,
            philanthropyScore: philScore
        });
    }

    return list;
};

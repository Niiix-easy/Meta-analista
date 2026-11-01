import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 30; // 30 requests
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string) {
  const now = Date.now();
  const userData = rateLimitStore.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > WINDOW_MS) {
    userData.count = 1;
    userData.lastReset = now;
  } else {
    userData.count++;
  }

  rateLimitStore.set(ip, userData);
  return userData.count <= RATE_LIMIT;
}

// In-memory data store for this session
let campaigns = [
  { 
    id: '1', name: 'Vendas | Produto Principal', spend: 4320, revenue: 29890, roas: 6.92, status: 'Ativa', dailyBudget: 4000,
    last7DaysSpend: Array.from({ length: 7 }).map((_, i) => ({ date: `D-${7-i}`, spend: 3000 + Math.random() * 1500 })),
    campaignGroupId: 'group-1'
  },
  { 
    id: '2', name: 'Remarketing | Carrinho', spend: 2180, revenue: 12450, roas: 5.71, status: 'Pausada', dailyBudget: 2000,
    last7DaysSpend: Array.from({ length: 7 }).map((_, i) => ({ date: `D-${7-i}`, spend: 1500 + Math.random() * 1000 })),
    campaignGroupId: 'group-1'
  },
  { 
    id: '3', name: 'Prospecção | Público Frio', spend: 3500, revenue: 15000, roas: 4.28, status: 'Ativa', dailyBudget: 5000,
    last7DaysSpend: Array.from({ length: 7 }).map((_, i) => ({ date: `D-${7-i}`, spend: 2500 + Math.random() * 2000 })),
    campaignGroupId: 'group-2'
  },
  { 
    id: '4', name: 'Escala | Lookalike 1%', spend: 5200, revenue: 32000, roas: 6.15, status: 'Ativa', dailyBudget: 6000,
    last7DaysSpend: Array.from({ length: 7 }).map((_, i) => ({ date: `D-${7-i}`, spend: 4000 + Math.random() * 2000 })),
    campaignGroupId: 'group-2'
  },
];

async function validateSessionAndRateLimit(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return { error: "Too many requests. Rate limit exceeded for Meta Marketing API Proxy.", status: 429 };
  }

  return null;
}

export async function GET(req: NextRequest) {
  const validationError = await validateSessionAndRateLimit(req);
  if (validationError) return NextResponse.json({ error: validationError.error }, { status: validationError.status });

  // Simulate real-time updates from "Meta API" during fetch
  campaigns = campaigns.map(c => {
    if (c.status === 'Ativa') {
      const change = 1 + (Math.random() * 0.01 - 0.005);
      const newSpend = Number((c.spend * change).toFixed(2));
      const newRevenue = Number((c.revenue * (change + (Math.random() * 0.005))).toFixed(2));
      return {
        ...c,
        spend: newSpend,
        revenue: newRevenue,
        roas: newSpend > 0 ? Number((newRevenue / newSpend).toFixed(2)) : 0
      };
    }
    return c;
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const validationError = await validateSessionAndRateLimit(req);
  if (validationError) return NextResponse.json({ error: validationError.error }, { status: validationError.status });

  const newCampaign = await req.json();
  const campaign = {
    ...newCampaign,
    id: Math.random().toString(36).substr(2, 9),
    last7DaysSpend: Array.from({ length: 7 }).map((_, i) => ({ date: `D-${7-i}`, spend: 0 }))
  };
  campaigns.push(campaign);
  return NextResponse.json(campaign, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const validationError = await validateSessionAndRateLimit(req);
  if (validationError) return NextResponse.json({ error: validationError.error }, { status: validationError.status });

  const { id, updates } = await req.json();
  campaigns = campaigns.map(c => c.id === id ? { ...c, ...updates } : c);
  const updated = campaigns.find(c => c.id === id);
  return NextResponse.json(updated);
}

export async function PUT(req: NextRequest) {
  const validationError = await validateSessionAndRateLimit(req);
  if (validationError) return NextResponse.json({ error: validationError.error }, { status: validationError.status });

  // Batch update for status
  const { ids, updates } = await req.json();
  campaigns = campaigns.map(c => ids.includes(c.id) ? { ...c, ...updates } : c);
  return NextResponse.json({ success: true });
}

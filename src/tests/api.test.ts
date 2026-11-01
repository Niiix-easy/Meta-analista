import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/campaigns/route';

// Mock next-auth/next
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth/next';

describe('Campaigns API', () => {
  const mockSession = {
    user: { name: 'Test User', email: 'test@example.com' },
    expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 if unauthorized', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/campaigns');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns campaigns if authorized', async () => {
    (getServerSession as any).mockResolvedValue(mockSession);
    const req = new NextRequest('http://localhost/api/campaigns');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('POST creates a new campaign', async () => {
    (getServerSession as any).mockResolvedValue(mockSession);
    const newCampaign = {
      name: 'New Test Campaign',
      spend: 0,
      revenue: 0,
      roas: 0,
      status: 'Ativa',
      dailyBudget: 1000,
    };
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(newCampaign),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe(newCampaign.name);
    expect(data.id).toBeDefined();
  });

  it('PATCH updates an existing campaign', async () => {
    (getServerSession as any).mockResolvedValue(mockSession);
    
    // First get a campaign ID
    const getReq = new NextRequest('http://localhost/api/campaigns');
    const getRes = await GET(getReq);
    const campaigns = await getRes.json();
    const targetId = campaigns[0].id;

    const updates = { status: 'Pausada', dailyBudget: 2500 };
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'PATCH',
      body: JSON.stringify({ id: targetId, updates }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('Pausada');
    expect(data.dailyBudget).toBe(2500);
  });
});

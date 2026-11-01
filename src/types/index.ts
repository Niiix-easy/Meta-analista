export interface Campaign { 
  id: string; 
  name: string; 
  spend: number; 
  revenue: number; 
  roas: number; 
  status: 'Ativa' | 'Pausada'; 
  dailyBudget: number; 
  last7DaysSpend: { date: string, spend: number }[];
  campaignGroupId?: string;
  currency?: 'BRL' | 'USD' | 'EUR';
}

export interface CampaignGroup {
  id: string;
  name: string;
  campaigns: Campaign[];
  totalSpend: number;
  totalRevenue: number;
  avgRoas: number;
  totalBudget: number;
}

export interface AuditEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  oldBudget: number;
  newBudget: number;
  timestamp: Date;
  source: 'Usuário' | 'IA';
}

export interface Creative {
  id: string;
  name: string;
  imageUrl: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  type: 'Video' | 'Imagem' | 'Carrossel';
}

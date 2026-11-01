'use client';

import React, { useState, useMemo, useEffect, useCallback, memo, Fragment } from 'react';
import { 
  AlertTriangle, 
  Download, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ArrowRight,
  Pause,
  Play,
  MessageSquare,
  Send,
  FileText,
  Loader2,
  Moon,
  Sun,
  History as HistoryIcon,
  Layers,
  TrendingDown,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Timer,
  Trophy,
  Monitor,
  Layout,
  FlaskConical,
  Check,
  X,
  ShieldCheck,
  Plus,
  ChevronRight,
  Filter
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Brush, Legend,
  BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

// UI Components
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { DatePickerWithRange } from '@/src/components/ui/date-range-picker';
import { NotificationBell, Notification } from '@/src/components/ui/notifications';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { AudienceHeatmap } from '@/src/components/AudienceHeatmap';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import useSWR, { mutate, preload } from 'swr';
import 'intro.js/introjs.css';

import { CampaignTable } from '@/src/components/CampaignTable';
import { MetricsDashboard } from '@/src/components/MetricsDashboard';
import { Campaign, CampaignGroup, AuditEntry, Creative } from '@/src/types';

const mockCreatives: Creative[] = [
  { id: 'c1', name: 'Video | Depoimento Cliente', imageUrl: 'https://picsum.photos/seed/creative1/800/450', spend: 1200, revenue: 8400, roas: 7.0, ctr: 2.8, type: 'Video' },
  { id: 'c2', name: 'Imagem | Produto Close-up', imageUrl: 'https://picsum.photos/seed/creative2/800/450', spend: 850, revenue: 5100, roas: 6.0, ctr: 2.1, type: 'Imagem' },
  { id: 'c3', name: 'Video | Tutorial de Uso', imageUrl: 'https://picsum.photos/seed/creative3/800/450', spend: 1500, revenue: 4500, roas: 3.0, ctr: 1.4, type: 'Video' },
  { id: 'c4', name: 'Imagem | Estilo de Vida', imageUrl: 'https://picsum.photos/seed/creative4/800/450', spend: 2000, revenue: 3000, roas: 1.5, ctr: 0.8, type: 'Imagem' },
  { id: 'c5', name: 'Carrossel | Variantes', imageUrl: 'https://picsum.photos/seed/creative5/800/450', spend: 900, revenue: 5400, roas: 6.0, ctr: 2.4, type: 'Carrossel' },
];

const demographicData = [
  { group: '18-24', Homens: 1200, Mulheres: 1500 },
  { group: '25-34', Homens: 4500, Mulheres: 4800 },
  { group: '35-44', Homens: 3200, Mulheres: 3500 },
  { group: '45-54', Homens: 1800, Mulheres: 2100 },
  { group: '55+', Homens: 900, Mulheres: 1100 },
];

const historicalData = Array.from({ length: 90 }).map((_, i) => {
  const date = subDays(new Date(), 89 - i);
  const dayOfWeek = date.getDay();
  const spendBase = dayOfWeek === 0 || dayOfWeek === 6 ? 2500 : 1500;
  const spend = spendBase + Math.random() * 2000;
  const revenue = spend * (2.5 + Math.random() * 5);
  return {
    date: startOfDay(date),
    spend: Math.round(spend),
    revenue: Math.round(revenue),
    roas: Number((revenue / spend).toFixed(2))
  };
});

// Linear Regression helper
function projectNext7Days(data: { spend: number, revenue: number }[]) {
  const n = data.length;
  if (n < 2) return [];

  const getProjection = (yValues: number[]) => {
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += yValues[i];
      sumXY += i * yValues[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return Array.from({ length: 7 }).map((_, i) => {
      const nextX = n + i;
      return Math.max(0, Math.round(slope * nextX + intercept));
    });
  };

  const spendProjections = getProjection(data.map(d => d.spend));
  const revenueProjections = getProjection(data.map(d => d.revenue));

  return Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(new Date(), i + 1);
    const spend = spendProjections[i];
    const revenue = revenueProjections[i];
    return {
      name: format(date, 'dd MMM', { locale: ptBR }),
      spend,
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : 0,
      date,
      isProjection: true
    };
  });
}

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isProjection = payload[0].payload.isProjection;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md outline-none">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {isProjection && <Badge variant="secondary" className="h-4 text-[8px] px-1 px-y-0 uppercase">Projeção AI</Badge>}
        </div>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                <span className="text-xs font-semibold text-foreground">{entry.name}:</span>
              </div>
              <span className="text-xs font-bold text-foreground">
                R$ {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
          {payload.length >= 2 && (
            <div className="mt-1 border-t pt-1.5 flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">ROAS:</span>
              <span className="text-xs font-bold text-blue-500">
                {(payload[0].value / payload[1].value).toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Global API Error Wrapper
const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    toast.error(`Erro na API: ${err.message || 'Falha na comunicação'}`);
    console.error("API Error:", err);
    throw err;
  }
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<'campaigns' | 'creatives'>('campaigns');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [creativeTypeFilter, setCreativeTypeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showProjection, setShowProjection] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');

  // Sandbox State
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxCampaigns, setSandboxCampaigns] = useState<Campaign[]>([]);

  const { data: swrData, isValidating, mutate: swrMutate } = useSWR<Campaign[]>(
    status === "authenticated" ? '/api/campaigns' : null,
    safeFetch,
    {
      refreshInterval: 60000, // 60s polling
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      onSuccess: () => {
        setLastUpdated(new Date());
      }
    }
  );

  // Derived state: Use sandbox data if in sandbox mode, otherwise SWR data
  const campaigns = useMemo(() => {
    if (isSandboxMode) return sandboxCampaigns;
    return swrData || [];
  }, [isSandboxMode, sandboxCampaigns, swrData]);

  // Visual sync indicator
  useEffect(() => {
    if (isValidating) {
      setIsSyncing(true);
      const timer = setTimeout(() => setIsSyncing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isValidating]);

  // Preload campaigns when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      preload('/api/campaigns', safeFetch);
    }
  }, [status]);

  // Currency Converter Utility
  const currencyRates = { BRL: 1, USD: 0.18, EUR: 0.16 };
  const formatCurrency = useCallback((value: number) => {
    const converted = value * currencyRates[selectedCurrency];
    const symbols = { BRL: 'R$', USD: '$', EUR: '€' };
    return `${symbols[selectedCurrency]} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [selectedCurrency]);
  
  // Create Campaign State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState(1000);
  const [isCreating, setIsCreating] = useState(false);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(['name', 'spend', 'revenue', 'roas', 'status', 'dailyBudget']);
  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'init-1', title: 'Sistema Pronto', description: 'Monitoramento em tempo real ativado.', time: 'Agora', type: 'info', read: false }
  ]);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [isGrouping, setIsGrouping] = useState(false);

  // Persistence: Load audit logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('meta_ads_audit_logs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        setAuditLogs(parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      } catch (e) {
        console.error("Failed to parse logs from localStorage", e);
      }
    }
  }, []);

  // Persistence: Save audit logs to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('meta_ads_audit_logs', JSON.stringify(auditLogs));
    }
  }, [auditLogs, isMounted]);

  // AI Summary State
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  
  // Bulk Edit State
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'percentage' | 'flat'>('percentage');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<number>(0);
  
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { theme, setTheme } = useTheme();
  

  const enterSandbox = () => {
    setSandboxCampaigns([...campaigns]);
    setIsSandboxMode(true);
  };

  const commitSandbox = async () => {
    setIsSandboxMode(false);
    // In a real app, we'd sync sandboxCampaigns to the backend here.
    // For now, we just exit sandbox and let SWR refresh production data.
    swrMutate(); 
  };

  const discardSandbox = () => {
    setIsSandboxMode(false);
    setSandboxCampaigns([]);
  };

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && status === 'authenticated' && !localStorage.getItem('meta_ads_tour_seen')) {
      const timer = setTimeout(() => {
        startTour();
        localStorage.setItem('meta_ads_tour_seen', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isMounted, status]);

  const startTour = async () => {
    const introJs = (await import('intro.js')).default;
    introJs().setOptions({
      nextLabel: 'Próximo',
      prevLabel: 'Anterior',
      doneLabel: 'Concluir',
      skipLabel: 'Pular',
      showProgress: true,
      exitOnOverlayClick: false,
      steps: [
        {
          title: 'Bem-vindo ao Meta Ads AI!',
          intro: 'Vamos fazer um rápido tour pelas principais funcionalidades do seu novo dashboard de performance.'
        },
        {
          element: '[data-tour="ai-insights"]',
          intro: 'O painel de AI Insights analisa suas campanhas em tempo real e sugere ajustes de orçamento baseados em performance histórica e tendências.',
          position: 'left'
        },
        {
          element: '[data-tour="sandbox-mode"]',
          intro: 'No Modo Sandbox, você pode simular alterações sem aplicar no Meta Ads real. Teste estratégias antes de investir!',
          position: 'bottom'
        },
        {
          element: '[data-tour="filters"]',
          intro: 'Use a busca e os filtros para encontrar campanhas específicas ou alternar entre visualizações normais e agrupadas por IA.',
          position: 'bottom'
        },
        {
          element: '[data-tour="ai-summary"]',
          intro: 'Gere relatórios executivos completos em PDF com apenas um clique usando nosso modelo de linguagem avançado.',
          position: 'bottom'
        }
      ]
    }).start();
  };

  useEffect(() => {
    if (!isMounted) return;
    
    const monitor = setInterval(() => {
      const now = new Date();
      const newAlerts: Notification[] = [];

      campaigns.forEach(c => {
        if (c.status !== 'Ativa') return;

        // 1. Reactive Alert: Near limit
        if (c.spend >= c.dailyBudget * 0.95) {
          const id = `alert-limit-${c.id}`;
          if (!notifications.some(n => n.id.startsWith(`alert-limit-${c.id}`) && !n.read)) {
            newAlerts.push({
              id: `${id}-${Date.now()}`,
              title: `Limite Atingido: ${c.name}`,
              description: `A campanha consumiu ${Math.round((c.spend/c.dailyBudget)*100)}% do orçamento.`,
              time: 'Agora',
              type: 'alert',
              read: false
            });
          }
        }

        // 2. Proactive Alert: Budget Exhaustion Prediction
        // If last 3 days avg spend is > 85% of budget, predict exhaustion soon
        const recentSpend = c.last7DaysSpend.slice(-3).map(d => d.spend);
        const avgRecent = recentSpend.reduce((a, b) => a + b, 0) / recentSpend.length;
        if (avgRecent > c.dailyBudget * 0.85 && c.spend < c.dailyBudget * 0.9) {
          const id = `predict-exhaust-${c.id}`;
          if (!notifications.some(n => n.id.startsWith(`predict-exhaust-${c.id}`) && !n.read)) {
            newAlerts.push({
              id: `${id}-${Date.now()}`,
              title: `Previsão de Esgotamento: ${c.name}`,
              description: `Tendência indica que o orçamento acabará antes do esperado hoje.`,
              time: 'Previsão',
              type: 'alert',
              read: false
            });
          }
        }

        // 3. Proactive Alert: ROAS Drop Prediction
        // Check if ROAS is trending down significantly (mocking ROAS trend logic here)
        const isRoasDeclining = c.roas < 3.5 && c.spend > 1000; // Simplified trigger for mock
        if (isRoasDeclining) {
          const id = `predict-roas-${c.id}`;
          if (!notifications.some(n => n.id.startsWith(`predict-roas-${c.id}`) && !n.read)) {
            newAlerts.push({
              id: `${id}-${Date.now()}`,
              title: `Queda de Performance: ${c.name}`,
              description: `Detectamos declínio no ROAS. Recomendamos revisão de criativos.`,
              time: 'Alerta IA',
              type: 'alert',
              read: false
            });
          }
        }

        // 4. Proactive Alert: Daily Exhaustion Prediction (Velocity-based)
        const hoursElapsed = now.getHours() + now.getMinutes() / 60;
        const velocity = c.spend / (hoursElapsed || 1); // Avoid div by zero
        const projectedEndDaySpend = velocity * 24;
        
        if (projectedEndDaySpend > c.dailyBudget * 1.05 && c.spend > 100) {
           const id = `exhaust-prediction-${c.id}`;
           if (!notifications.some(n => n.id.startsWith(`exhaust-prediction-${c.id}`) && !n.read)) {
             newAlerts.push({
               id: `${id}-${Date.now()}`,
               title: `Risco de Esgotamento: ${c.name}`,
               description: `A velocidade de gasto atual excederá o orçamento diário antes do final do dia.`,
               time: 'Urgente',
               type: 'alert',
               read: false
             });
           }
        }

        // 5. Anomaly Detection: 3 Standard Deviations from 7d Average
        const historyValues = c.last7DaysSpend.map(d => d.spend);
        if (historyValues.length >= 3) {
          const mean = historyValues.reduce((a, b) => a + b, 0) / historyValues.length;
          const variance = historyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historyValues.length;
          const stdDev = Math.sqrt(variance);
          
          if (c.spend > mean + (3 * stdDev) && c.spend > 500) {
            const id = `anomaly-${c.id}`;
            if (!notifications.some(n => n.id.startsWith(`anomaly-${c.id}`) && !n.read)) {
              newAlerts.push({
                id: `${id}-${Date.now()}`,
                title: `Anomalia de Gasto: ${c.name}`,
                description: `O gasto atual está 3 desvios padrão acima da média histórica.`,
                time: 'Anomalia',
                type: 'alert',
                read: false
              });
            }
          }
        }
      });

      if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts, ...prev]);
      }
    }, 20000);

    return () => clearInterval(monitor);
  }, [isMounted, campaigns, notifications]);

  const autoGroupCampaigns = async () => {
    if (isGrouping) return;
    setIsGrouping(true);
    const toastId = toast.loading("IA analisando semântica das campanhas...");

    try {
      const data = await safeFetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analise os seguintes nomes de campanhas e agrupe-as por categoria lógica (ex: Remarketing, Fundo de Funil, Branding, Escala). 
          Retorne APENAS um JSON plano onde a chave é o ID da campanha e o valor é o nome do grupo sugerido.
          Campanhas: ${campaigns.map(c => `[ID: ${c.id}] ${c.name}`).join(', ')}`,
          type: 'grouping'
        })
      });

      const cleanJson = data.text.replace(/```json|```/g, '').trim();
      const groupsMapping = JSON.parse(cleanJson);

      if (isSandboxMode) {
        setSandboxCampaigns(prev => prev.map(c => ({
          ...c,
          campaignGroupId: groupsMapping[c.id] || 'Outros'
        })));
      } else {
        // Optimistic update
        const updatedCampaigns = campaigns.map(c => ({
          ...c,
          campaignGroupId: groupsMapping[c.id] || 'Outros'
        }));
        
        // Since we don't have a bulk group update endpoint, we just show locally 
        // In a real app, this would be a PATCH to the database
        swrMutate(updatedCampaigns, false);
      }
      
      setIsGroupedView(true);
      toast.success("Agrupamento inteligente aplicado!", { id: toastId });
    } catch (err) {
      toast.error("Falha ao processar agrupamento via IA.", { id: toastId });
    } finally {
      setIsGrouping(false);
    }
  };
  
  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter(c => {
      const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'pacing') {
          aVal = a.spend / a.dailyBudget;
          bVal = b.spend / b.dailyBudget;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [campaigns, statusFilter, searchTerm, sortConfig]);

  const groupedCampaigns = useMemo(() => {
    const groupsMap = new Map<string, CampaignGroup>();
    
    filteredCampaigns.forEach(c => {
      const groupId = c.campaignGroupId || 'ungrouped';
      const groupName = groupId === 'group-1' ? 'Performance | Vendas Diretas' : 
                        groupId === 'group-2' ? 'Branding | Awareness' : 'Outros';
      
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: groupId,
          name: groupName,
          campaigns: [],
          totalSpend: 0,
          totalRevenue: 0,
          avgRoas: 0,
          totalBudget: 0
        });
      }
      
      const group = groupsMap.get(groupId)!;
      group.campaigns.push(c);
      group.totalSpend += c.spend;
      group.totalRevenue += c.revenue;
      group.totalBudget += c.dailyBudget;
    });

    return Array.from(groupsMap.values()).map(g => ({
      ...g,
      avgRoas: g.totalSpend > 0 ? g.totalRevenue / g.totalSpend : 0
    }));
  }, [filteredCampaigns]);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const periodData = useMemo(() => {
    if (!date?.from || !date?.to) return historicalData.slice(-30);
    return historicalData.filter(d => 
      isWithinInterval(d.date, { start: startOfDay(date.from!), end: startOfDay(date.to!) })
    );
  }, [date]);

  const projectionData = useMemo(() => {
    return projectNext7Days(periodData);
  }, [periodData]);

  const combinedChartData = useMemo(() => {
    const historical = periodData.map(d => ({ 
      ...d, 
      name: format(d.date, 'dd MMM', { locale: ptBR }),
      isHistorical: true 
    }));
    
    if (!showProjection) return historical;
    return [...historical, ...projectionData];
  }, [periodData, projectionData, showProjection]);

  const heatmapData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const segments = ['18-24', '25-34', '35-44', '45-54', '55+'];
    
    const result: { group: string; day: string; engagement: number }[] = [];
    
    segments.forEach(segment => {
      days.forEach(day => {
        // Generate mock engagement density based on segment and day
        // Some segments are more active on weekends, etc.
        const base = 40 + Math.random() * 30;
        const dayBoost = (day === 'Sáb' || day === 'Dom') ? 15 : 0;
        const segmentBoost = (segment === '25-34' || segment === '35-44') ? 10 : 0;
        
        result.push({
          group: segment,
          day,
          engagement: Math.min(100, Math.round(base + dayBoost + segmentBoost))
        });
      });
    });
    
    return result;
  }, []);

  const metrics = useMemo(() => {
    const spend = periodData.reduce((acc, d) => acc + d.spend, 0);
    const revenue = periodData.reduce((acc, d) => acc + d.revenue, 0);
    const roas = spend > 0 ? (revenue / spend).toFixed(2) : "0.00";
    const conversions = Math.round(revenue / 150);
    return { spend, revenue, roas, conversions };
  }, [periodData]);

  const compareCampaigns = useMemo(() => {
    return campaigns.filter(c => selectedCampaignIds.includes(c.id));
  }, [campaigns, selectedCampaignIds]);

  if (!isMounted || status === "loading") return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!session) return null;

  const batchUpdateStatus = useCallback(async (status: 'Ativa' | 'Pausada') => {
    if (selectedCampaignIds.length === 0) return;
    
    if (isSandboxMode) {
      setSandboxCampaigns(prev => prev.map(c => 
        selectedCampaignIds.includes(c.id) ? { ...c, status } : c
      ));
      setSelectedCampaignIds([]);
      toast.success(`Status atualizado para ${status} (Sandbox)`);
      return;
    }

    try {
      await safeFetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCampaignIds, updates: { status } })
      });
      swrMutate();
      setSelectedCampaignIds([]);
      toast.success(`Status atualizado para ${status}`);
    } catch (err) {
      // toast shown by safeFetch
    }
  }, [selectedCampaignIds, isSandboxMode, swrMutate]);

  const applyAIRecommendation = useCallback(async (campaignId: string, adjustment: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const oldBudget = campaign.dailyBudget;
    const newBudget = Math.round(oldBudget * (1 + adjustment));

    if (isSandboxMode) {
      setSandboxCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, dailyBudget: newBudget } : c));
    } else {
      try {
        await safeFetch('/api/campaigns', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: campaignId, updates: { dailyBudget: newBudget } })
        });
        swrMutate();
        toast.success("Recomendação aplicada com sucesso!");
      } catch (err) {
        return; // error handled
      }
    }
        
    setAuditLogs(logs => [{
      id: `audit-${Date.now()}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      oldBudget,
      newBudget,
      timestamp: new Date(),
      source: 'IA'
    }, ...logs]);
  }, [campaigns, isSandboxMode, swrMutate]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const updateBudget = useCallback(async (id: string, newBudget: number) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    if (isSandboxMode) {
      setSandboxCampaigns(prev => prev.map(c => c.id === id ? { ...c, dailyBudget: newBudget } : c));
    } else {
      try {
        await safeFetch('/api/campaigns', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, updates: { dailyBudget: newBudget } })
        });
        swrMutate();
      } catch (err) {
        return; // error handled
      }
    }

    setAuditLogs(logs => [{
      id: `audit-${Date.now()}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      oldBudget: campaign.dailyBudget,
      newBudget,
      timestamp: new Date(),
      source: 'Usuário'
    }, ...logs]);
  }, [campaigns, isSandboxMode, swrMutate]);

  const createCampaign = async () => {
    if (!newCampaignName.trim() || isCreating) return;
    setIsCreating(true);
    
    try {
      const response = await safeFetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName,
          dailyBudget: newCampaignBudget,
          spend: 0,
          revenue: 0,
          roas: 0,
          status: 'Ativa'
        })
      });
      
      if (isSandboxMode) {
        setSandboxCampaigns(prev => [response, ...prev]);
      } else {
        swrMutate();
      }
      setIsCreateModalOpen(false);
      setNewCampaignName('');
      setNewCampaignBudget(1000);
      toast.success("Campanha criada com sucesso!");
    } catch (err) {
      // toast shown by safeFetch
    } finally {
      setIsCreating(false);
    }
  };

  const applyBulkEdit = useCallback(async () => {
    const updates = selectedCampaignIds.map(id => {
      const c = campaigns.find(item => item.id === id);
      if (!c) return null;
      const oldBudget = c.dailyBudget;
      const newBudget = bulkAdjustmentType === 'percentage' 
        ? Math.round(oldBudget * (1 + bulkAdjustmentValue / 100))
        : bulkAdjustmentValue;
      return { id, oldBudget, newBudget, name: c.name };
    }).filter(Boolean);

    if (isSandboxMode) {
      setSandboxCampaigns(prev => prev.map(c => {
        const up = updates.find(u => u!.id === c.id);
        return up ? { ...c, dailyBudget: up.newBudget } : c;
      }));
    } else {
      try {
        await Promise.all(updates.map(u => 
          fetch('/api/campaigns', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: u!.id, updates: { dailyBudget: u!.newBudget } })
          })
        ));
        swrMutate();
      } catch (err) {
        console.error("Bulk edit failed", err);
      }
    }

    setAuditLogs(logs => {
      const newLogs: AuditEntry[] = updates.map(u => ({
        id: `audit-bulk-${u!.id}-${Date.now()}`,
        campaignId: u!.id,
        campaignName: u!.name,
        oldBudget: u!.oldBudget,
        newBudget: u!.newBudget,
        timestamp: new Date(),
        source: 'Usuário'
      }));
      return [...newLogs, ...logs];
    });

    setIsBulkEditOpen(false);
    setSelectedCampaignIds([]);
    setBulkAdjustmentValue(0);
  }, [selectedCampaignIds, campaigns, bulkAdjustmentType, bulkAdjustmentValue, isSandboxMode, swrMutate]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const velocityData = useMemo(() => {
    return filteredCampaigns.map(c => ({
      name: c.name,
      spend: c.spend,
      revenue: c.revenue,
      roas: c.roas,
      z: c.roas > 5 ? 100 : 50 // Size based on performance
    }));
  }, [filteredCampaigns]);

  const exportCSV = () => {
    const columnLabels: Record<string, string> = {
      name: 'Name',
      spend: 'Spend',
      revenue: 'Revenue',
      roas: 'ROAS',
      status: 'Status',
      dailyBudget: 'DailyBudget'
    };

    const headers = selectedExportColumns.map(col => columnLabels[col]);
    const rows = filteredCampaigns.map(c => 
      selectedExportColumns.map(col => (c as any)[col])
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `campaigns-${format(new Date(), 'yyyy-MM-dd')}.csv`; 
    a.click();
    setIsExportModalOpen(false);
    toast.success("CSV exportado com sucesso!");
  };

  const generateExecutiveSummary = async () => {
    setIsGeneratingSummary(true);
    setIsSummaryOpen(true);
    setSummaryText('Gerando relatório executivo inteligente...');

    try {
      const data = await safeFetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Gere um resumo executivo baseado nos dados atuais.',
          type: 'summary',
          context: { metrics, campaigns: campaigns.map(c => ({ name: c.name, roas: c.roas, spend: c.spend })) }
        })
      });
      setSummaryText(data.text || 'Erro ao gerar resumo.');
    } catch (err) {
      setSummaryText('Erro na conexão com o servidor.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const downloadPDF = useCallback(() => {
    if (!summaryText) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("Meta Ads AI - Relatório Estratégico", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado por: ${session?.user?.name || 'Sistema'} | ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);
    
    // Metrics Section
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Métricas Consolidadas do Período", 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Investimento Total', `R$ ${metrics.spend.toLocaleString()}`],
        ['Receita Total', `R$ ${metrics.revenue.toLocaleString()}`],
        ['ROAS Médio', metrics.roas],
        ['Conversões', metrics.conversions.toLocaleString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // AI Summary Section
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("Análise de Inteligência Artificial", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(summaryText, 180);
    doc.text(splitText, 14, currentY + 7);

    // Top Campaigns Table
    const topCampaigns = [...campaigns]
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);

    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Ranking de Campanhas (Top 5 ROAS)", 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Campanha', 'Gasto', 'Receita', 'ROAS', 'Status']],
      body: topCampaigns.map(c => [
        c.name,
        `R$ ${c.spend.toLocaleString()}`,
        `R$ ${c.revenue.toLocaleString()}`,
        c.roas.toFixed(2),
        c.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] } // Success Green
    });
    
    doc.save(`relatorio-meta-ads-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }, [summaryText, metrics, campaigns, session]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isSendingQuery) return;

    const currentQuery = userQuery;
    setUserQuery('');
    setChatMessages(prev => [...prev, { role: 'user', content: currentQuery }]);
    setIsSendingQuery(true);

    try {
      const data = await safeFetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentQuery,
          type: 'chat',
          context: { metrics, campaigns: campaigns.map(c => ({ name: c.name, roas: c.roas, spend: c.spend })) }
        })
      });
      setChatMessages(prev => [...prev, { role: 'ai', content: data.text || 'Desculpe, tive um problema ao processar sua pergunta.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Erro de conexão.' }]);
    } finally {
      setIsSendingQuery(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Zap className="mr-2 h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Meta Ads AI</span>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
              {[
                { id: 'campaigns', label: 'Campanhas', icon: Zap },
                { id: 'creatives', label: 'Criativos', icon: Layout },
                { id: 'insights', label: 'Insights', icon: TrendingUp },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={cn(
                    "w-full flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeView === item.id 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-border/50">
                <button
                  onClick={startTour}
                  className="w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  Tour de Onboarding
                </button>
              </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-10">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-8 backdrop-blur">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">
              {activeView === 'campaigns' ? 'Gerenciador de Campanhas' : 'Performance de Criativos'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeView === 'campaigns' ? 'Controle de orçamento e escala' : 'Otimização visual e CTR'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Tabs 
              value={statusFilter} 
              onValueChange={setStatusFilter} 
              className="hidden lg:block"
            >
              <TabsList className="h-9 px-1 bg-muted/50 border">
                <TabsTrigger value="Todos" className="text-[10px] uppercase font-bold px-4">Todos</TabsTrigger>
                <TabsTrigger value="Ativa" className="text-[10px] uppercase font-bold px-4">Ativas</TabsTrigger>
                <TabsTrigger value="Pausada" className="text-[10px] uppercase font-bold px-4">Pausadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border">
              <span className="text-[9px] font-black text-muted-foreground uppercase">Moeda</span>
              <Select value={selectedCurrency} onValueChange={(v: any) => setSelectedCurrency(v)}>
                <SelectTrigger className="h-7 w-20 text-[10px] font-bold border-none bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DatePickerWithRange date={date} setDate={setDate} />
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsCreateModalOpen(true)} 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nova Campanha
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={generateExecutiveSummary} 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              data-tour="ai-summary"
            >
              <Zap className="h-4 w-4 fill-current" /> Resumo IA
            </Button>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              {!isSandboxMode ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={enterSandbox} 
                  className="gap-2 border-primary/50 hover:bg-primary/10 text-primary"
                  data-tour="sandbox-mode"
                >
                  <FlaskConical className="h-4 w-4" /> Sandbox
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-md border border-primary/30 animate-pulse">
                  <span className="text-[10px] font-bold text-primary uppercase mr-2 flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" /> Modo Simulação
                  </span>
                  <Button variant="success" size="icon" className="h-7 w-7" onClick={commitSandbox} title="Aplicar em Produção">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-7 w-7" onClick={discardSandbox} title="Descartar Alterações">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(true)} className="gap-2">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <NotificationBell notifications={notifications} setNotifications={setNotifications} />
            <div className="h-8 w-px bg-border mx-2" />
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive">
              Sair
            </Button>
          </div>
        </header>

        <div className="p-8">
          {activeView === 'campaigns' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Summary Grid */}
              <MetricsDashboard metrics={metrics} formatCurrency={formatCurrency} />

              {/* Budget Efficiency Widget */}
              <Card className="border-none shadow-sm bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Timer className="h-5 w-5 text-primary" />
                        Eficiência de Orçamento & Velocidade
                      </CardTitle>
                      <CardDescription>Análise em tempo real do ritmo de gastos vs. tempo restante do dia.</CardDescription>
                    </div>
                    <Badge variant="outline" className="h-6">
                      {new Date().getHours()}:00 - {24 - new Date().getHours()}h restantes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {campaigns.filter(c => c.status === 'Ativa').slice(0, 4).map(c => {
                      const hoursElapsed = new Date().getHours() + new Date().getMinutes() / 60;
                      const velocity = c.spend / (hoursElapsed || 1);
                      const projected = velocity * 24;
                      const isOver = projected > c.dailyBudget;
                      const efficiency = Math.min(100, (c.dailyBudget / projected) * 100);

                      return (
                        <div key={c.id} className="rounded-xl border p-4 bg-accent/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{c.name}</span>
                            <Badge variant={isOver ? "destructive" : "success"} className="text-[8px] h-4">
                              {isOver ? 'Risco' : 'Estável'}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-end justify-between">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Projeção 24h</p>
                                <p className={cn("text-lg font-bold", isOver ? "text-destructive" : "text-foreground")}>
                                  R$ {Math.round(projected).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Eficiência</p>
                                <p className="text-sm font-bold text-primary">{Math.round(efficiency)}%</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-500", isOver ? "bg-destructive" : "bg-primary")}
                                style={{ width: `${Math.min(100, efficiency)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Main Charts & Table Grid */}
              <div className="grid gap-8 grid-cols-1 xl:grid-cols-4 lg:grid-cols-1">
                <Card className="xl:col-span-3 lg:col-span-1 border-none shadow-sm h-fit">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          Campanhas Ativas
                          <AnimatePresence>
                            {isSyncing && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="flex items-center gap-1.5"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Sincronizando Meta API...</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          Gestão e monitoramento em tempo real.
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold">
                            Última atualização: {format(lastUpdated, 'HH:mm:ss')}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                        <Switch id="group-mode" checked={isGroupedView} onCheckedChange={setIsGroupedView} />
                        <Label htmlFor="group-mode" className="text-[10px] font-bold uppercase cursor-pointer flex items-center gap-2">
                          <Layers className="h-3 w-3" /> Agrupar
                        </Label>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={autoGroupCampaigns} 
                        disabled={isGrouping}
                        className="h-9 gap-2 border-primary/20 hover:bg-primary/5"
                      >
                        {isGrouping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 fill-primary text-primary" />}
                        <span className="text-[10px] font-black uppercase">Agrupar via IA</span>
                      </Button>
                      <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                        <Switch id="projection-mode" checked={showProjection} onCheckedChange={setShowProjection} />
                        <Label htmlFor="projection-mode" className="text-[10px] font-bold uppercase cursor-pointer">Ver Projeção AI</Label>
                      </div>
                      <div className="flex items-center gap-2" data-tour="filters">
                        {selectedCampaignIds.length > 0 && (
                          <div className="flex items-center gap-2 mr-2 pr-4 border-r animate-in fade-in slide-in-from-right-4">
                            <Button size="sm" variant="secondary" className="h-8 gap-2" onClick={() => setIsBulkEditOpen(true)}>
                              <Layers className="h-3.5 w-3.5" /> Edição em Massa
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={() => batchUpdateStatus('Pausada')}>Pausar</Button>
                            <Button size="sm" variant="success" className="h-8 text-white" onClick={() => batchUpdateStatus('Ativa')}>Retomar</Button>
                          </div>
                        )}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="search" placeholder="Buscar..." className="w-40 pl-8 h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CampaignTable 
                      campaigns={filteredCampaigns}
                      groupedCampaigns={groupedCampaigns}
                      isGroupedView={isGroupedView}
                      expandedGroups={expandedGroups}
                      onToggleGroup={toggleGroupExpansion}
                      selectedCampaignIds={selectedCampaignIds}
                      onToggleSelection={toggleSelection}
                      onUpdateBudget={updateBudget}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                      formatCurrency={formatCurrency}
                    />
                  </CardContent>
                  <CardFooter className="border-t p-6">
                    <div className="w-full h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={combinedChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="top" align="right" iconType="circle" />
                          <Bar 
                            dataKey="spend" 
                            name="Investimento" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]} 
                            fillOpacity={0.8}
                          />
                          <Bar 
                            dataKey="revenue" 
                            name="Receita" 
                            fill="hsl(var(--success))" 
                            radius={[4, 4, 0, 0]} 
                            fillOpacity={0.8}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardFooter>
                </Card>

                <div className="xl:col-span-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-8 h-fit">
                  <Card className="border-none shadow-sm h-fit" data-tour="ai-insights">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary fill-primary" />
                        AI Insights
                      </CardTitle>
                      <CardDescription>Otimizações sugeridas pelo modelo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 text-foreground">
                      {[
                        { id: '1', title: 'Aumentar Vendas', desc: 'ROI de 6.92 detectado. Oportunidade de escala imediata.', campaign: 'Vendas | Produto Principal', adj: 0.2 },
                        { id: '4', title: 'Escalar Lookalike', desc: 'Sinais de estabilidade e baixo CPA. Sugerimos expansão.', campaign: 'Escala | Lookalike 1%', adj: 0.15 },
                        { id: '2', title: 'Ajustar Remarketing', desc: 'Fadiga de criativo detectada. Reduzir para evitar desperdício.', campaign: 'Remarketing | Carrinho', adj: -0.1 }
                      ].map(insight => (
                        <div key={insight.id} className="p-4 rounded-lg border bg-accent/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{insight.title}</span>
                            <Badge variant={insight.adj > 0 ? "success" : "destructive"} className="text-[10px]">{insight.adj > 0 ? 'Scale' : 'Cut'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{insight.desc}</p>
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs font-bold" onClick={() => applyAIRecommendation(insight.id, insight.adj)}>
                            Aplicar Recomendação
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-primary" />
                        Densidade de Audiência
                      </CardTitle>
                      <CardDescription>Engajamento por segmento e horário.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <AudienceHeatmap data={heatmapData} />
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm h-fit">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Projeção 7 Dias
                      </CardTitle>
                      <CardDescription>Tendência baseada em regressão linear.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-black">Investimento Est.</p>
                          <p className="text-xl font-black">R$ {projectionData.reduce((a, b) => a + b.spend, 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-black">Receita Est.</p>
                          <p className="text-xl font-black text-green-500">R$ {projectionData.reduce((a, b) => a + b.revenue, 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-[10px] font-bold text-primary flex items-center gap-2 uppercase">
                          <Zap className="h-3 w-3" /> ROAS Projetado: {(projectionData.reduce((a, b) => a + b.revenue, 0) / (projectionData.reduce((a, b) => a + b.spend, 0) || 1)).toFixed(2)}x
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* Sub-Dashboard: Criativos */
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Layout className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Análise de Ativos</h2>
                    <p className="text-muted-foreground text-sm font-medium">Comparativo granular vs. benchmark da categoria.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Formato:</span>
                  <Select value={creativeTypeFilter} onValueChange={setCreativeTypeFilter}>
                    <SelectTrigger className="w-[200px] h-11 border-primary/20 bg-background font-bold">
                      <SelectValue placeholder="Selecionar Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Formatos</SelectItem>
                      <SelectItem value="Video">🎥 Vídeos de Alta Conversão</SelectItem>
                      <SelectItem value="Imagem">🖼️ Imagens Estáticas</SelectItem>
                      <SelectItem value="Carrossel">🎠 Carrossel Dinâmico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(() => {
                const categoryAverages = {
                  Video: mockCreatives.filter(c => c.type === 'Video').reduce((a, b) => a + b.ctr, 0) / (mockCreatives.filter(c => c.type === 'Video').length || 1),
                  Imagem: mockCreatives.filter(c => c.type === 'Imagem').reduce((a, b) => a + b.ctr, 0) / (mockCreatives.filter(c => c.type === 'Imagem').length || 1),
                  Carrossel: mockCreatives.filter(c => c.type === 'Carrossel').reduce((a, b) => a + b.ctr, 0) / (mockCreatives.filter(c => c.type === 'Carrossel').length || 1),
                };

                const filteredCreatives = mockCreatives.filter(c => 
                  creativeTypeFilter === 'all' || c.type === creativeTypeFilter
                );

                return (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {filteredCreatives.map((creative) => {
                        const isTop = creative.roas >= 5;
                        const isFatigued = creative.roas < 2.5;
                        const catAvg = categoryAverages[creative.type as keyof typeof categoryAverages];
                        const performanceRatio = (creative.ctr / catAvg);
                        const isBelowAvg = creative.ctr < catAvg;
                        
                        return (
                          <div key={creative.id} className={cn(
                            "group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:scale-[1.02] hover:shadow-2xl",
                            isBelowAvg ? "border-red-500/20" : "border-green-500/20"
                          )}>
                            <div className="relative aspect-square w-full overflow-hidden">
                              <Image 
                                src={creative.imageUrl} 
                                alt={creative.name} 
                                fill 
                                className="object-cover transition-transform group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                              
                              <div className="absolute top-3 left-3 right-3 flex justify-between">
                                <Badge className={cn("text-[9px] h-6 border-none shadow-md", isTop ? "bg-green-600" : "bg-black/40 backdrop-blur-md")}>
                                  {creative.type}
                                </Badge>
                                {isFatigued && (
                                  <Badge variant="destructive" className="animate-pulse shadow-lg text-[9px] h-6 border-none">
                                    FADIGA DETECTADA
                                  </Badge>
                                )}
                              </div>

                              <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-sm font-black text-white leading-tight mb-2">{creative.name}</p>
                                <div className="flex items-center gap-2">
                                   <div className={cn(
                                     "h-2 w-2 rounded-full",
                                     isBelowAvg ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                   )} />
                                   <span className={cn("text-[10px] font-black uppercase", isBelowAvg ? "text-red-400" : "text-green-400")}>
                                     {isBelowAvg ? 'Performance Insuficiente' : 'Performance Saudável'}
                                   </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase font-black">CTR Efetivo</p>
                                  <p className={cn("text-2xl font-black", isBelowAvg ? "text-red-500" : "text-green-500")}>
                                    {creative.ctr.toFixed(2)}%
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[10px] text-muted-foreground uppercase font-black">Benchmark</p>
                                  <p className="text-2xl font-black opacity-40">{catAvg.toFixed(2)}%</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                  <span>Desvio vs Média</span>
                                  <span className={isBelowAvg ? "text-red-500" : "text-green-500"}>
                                    {isBelowAvg ? '↓' : '↑'} {Math.abs((performanceRatio - 1) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-muted overflow-hidden border">
                                  <div 
                                    className={cn("h-full transition-all duration-1000", isBelowAvg ? "bg-red-500" : "bg-green-500")} 
                                    style={{ width: `${Math.min(100, performanceRatio * 60)}%` }} 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="text-center p-2 rounded-lg bg-accent/30 border">
                                  <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Investido</p>
                                  <p className="text-xs font-black">R$ {creative.spend.toLocaleString()}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-accent/30 border">
                                  <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">ROAS</p>
                                  <p className="text-xs font-black">{creative.roas.toFixed(1)}x</p>
                                </div>
                              </div>

                              {isBelowAvg ? (
                                <Button variant="destructive" className="w-full font-black text-[10px] uppercase h-11" onClick={() => toast.error("Nova demanda criada para substituição do ativo.")}>
                                  🚨 Substituir Imediatamente
                                </Button>
                              ) : (
                                <Button variant="success" className="w-full font-black text-[10px] uppercase h-11 text-white" onClick={() => toast.success("Criativo escalado para públicos semelhantes!")}>
                                  🚀 Escalar em Novos Públicos
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Card className="border-none shadow-sm bg-primary/5">
                      <CardContent className="p-6 flex items-center gap-6">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                          <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-black tracking-tight text-primary mb-1 uppercase">Relatório de Oportunidades IA</h4>
                          <p className="text-sm text-muted-foreground font-medium">
                            Nossa rede neural identificou que criativos de <strong>{creativeTypeFilter === 'all' ? 'todos os tipos' : creativeTypeFilter}</strong> respondem por 85% do seu ROAS atual. 
                            A substituição de ativos com badge <strong>performance insuficiente</strong> pode elevar seu CTR médio em até 12.4% nos próximos 7 dias.
                          </p>
                        </div>
                        <Button className="font-black text-xs uppercase h-12 px-8">Gerar Briefing para Design</Button>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}

          {/* Audit Log Table (Fixed at bottom) */}
          <Card className="mt-12 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                  Log de Auditoria
                </CardTitle>
                <CardDescription>Histórico de alterações de orçamento diário e status.</CardDescription>
              </div>
              <Badge variant="secondary" className="font-bold">{auditLogs.length} EVENTOS REGISTRADOS</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-4 px-6">Data/Hora</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Anterior</TableHead>
                    <TableHead>Novo</TableHead>
                    <TableHead>Variação</TableHead>
                    <TableHead className="text-right px-6">Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">
                        Aguardando primeira alteração no sistema...
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map(log => {
                      const diff = log.newBudget - log.oldBudget;
                      const percent = ((diff / log.oldBudget) * 100).toFixed(1);
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-bold text-muted-foreground px-6">
                            {format(log.timestamp, 'dd/MM HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-bold tracking-tight">{log.campaignName}</TableCell>
                          <TableCell className="text-muted-foreground font-medium">R$ {log.oldBudget.toLocaleString()}</TableCell>
                          <TableCell className="font-black">R$ {log.newBudget.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={diff > 0 ? "success" : "destructive"} className="text-[10px] font-black border-none">
                              {diff > 0 ? '+' : ''}{percent}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase font-black px-3 py-1",
                              log.source === 'IA' ? "border-primary text-primary bg-primary/5" : "bg-muted"
                            )}>
                              {log.source}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Modal */}
        <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Comparação de Performance</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 sm:grid-cols-2 mt-4">
              {compareCampaigns.map((c, i) => (
                <Card key={c.id} className={cn("border-2", i === 0 ? "border-primary/50" : "border-destructive/50")}>
                  <CardHeader>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <Badge variant={i === 0 ? "default" : "destructive"}>{i === 0 ? "Primária" : "Secundária"}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Gasto Hoje', value: `R$ ${c.spend.toLocaleString()}` },
                      { label: 'Receita Hoje', value: `R$ ${c.revenue.toLocaleString()}` },
                      { label: 'ROAS', value: c.roas.toFixed(2) },
                      { label: 'Orçamento Diário', value: `R$ ${c.dailyBudget.toLocaleString()}` }
                    ].map(m => (
                      <div key={m.label} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                        <span className="text-sm font-bold">{m.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsCompareOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Modal */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edição em Massa</DialogTitle>
              <CardDescription>
                Ajuste o orçamento de {selectedCampaignIds.length} campanhas selecionadas.
              </CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Ajuste</label>
                <Select 
                  value={bulkAdjustmentType} 
                  onValueChange={(v: any) => setBulkAdjustmentType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Ajuste Percentual (%)</SelectItem>
                    <SelectItem value="flat">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  {bulkAdjustmentType === 'percentage' ? 'Variação (%)' : 'Novo Orçamento Diário (R$)'}
                </label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={bulkAdjustmentValue}
                    onChange={(e) => setBulkAdjustmentValue(Number(e.target.value))}
                  />
                  {bulkAdjustmentType === 'percentage' && (
                    <Badge variant={bulkAdjustmentValue >= 0 ? "success" : "destructive"}>
                      {bulkAdjustmentValue >= 0 ? '+' : ''}{bulkAdjustmentValue}%
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  {bulkAdjustmentType === 'percentage' 
                    ? 'Use valores negativos para reduzir o orçamento (ex: -10).' 
                    : 'Todas as campanhas selecionadas terão este valor exato como orçamento.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Cancelar</Button>
              <Button onClick={applyBulkEdit} className="gap-2">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Campaign Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <CardDescription>
                Configure os detalhes básicos da sua nova campanha de anúncios.
              </CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Nome da Campanha</label>
                <Input 
                  placeholder="Ex: Vendas | Black Friday" 
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Orçamento Diário (R$)</label>
                <Input 
                  type="number" 
                  value={newCampaignBudget}
                  onChange={(e) => setNewCampaignBudget(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button onClick={createCampaign} disabled={isCreating} className="gap-2">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Columns Modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Configurar Exportação CSV</DialogTitle>
              <CardDescription>
                Selecione quais colunas deseja incluir no arquivo de exportação.
              </CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'name', label: 'Nome da Campanha' },
                  { id: 'spend', label: 'Investimento' },
                  { id: 'revenue', label: 'Receita' },
                  { id: 'roas', label: 'ROAS' },
                  { id: 'status', label: 'Status' },
                  { id: 'dailyBudget', label: 'Orçamento Diário' }
                ].map((col) => (
                  <div key={col.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`col-${col.id}`} 
                      checked={selectedExportColumns.includes(col.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedExportColumns(prev => [...prev, col.id]);
                        } else {
                          setSelectedExportColumns(prev => prev.filter(i => i !== col.id));
                        }
                      }}
                    />
                    <label 
                      htmlFor={`col-${col.id}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancelar</Button>
              <Button onClick={exportCSV} disabled={selectedExportColumns.length === 0} className="gap-2">
                <Download className="h-4 w-4" /> Baixar CSV
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Floating AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen && (
          <Card className="mb-4 w-80 h-96 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 border-primary/20">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Assistente de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Como posso ajudar com suas campanhas hoje?
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSendingQuery && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analisando...
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-2 border-t">
              <form onSubmit={handleChatSubmit} className="flex w-full gap-2">
                <Input 
                  placeholder="Pergunte algo..." 
                  className="h-8 text-xs flex-1" 
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  disabled={isSendingQuery}
                />
                <Button type="submit" size="icon" className="h-8 w-8" disabled={isSendingQuery}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        )}
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          {isChatOpen ? <Pause className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>

      {/* Executive Summary Modal */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório Executivo Semanal Inteligente
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">O modelo IA está analisando seus dados de performance...</p>
              </div>
            ) : (
              <div className="markdown-body text-sm leading-relaxed">
                <ReactMarkdown>{summaryText}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6 gap-3">
            <Button variant="outline" onClick={() => setIsSummaryOpen(false)}>Fechar</Button>
            <Button className="gap-2" onClick={downloadPDF} disabled={!summaryText || isGeneratingSummary}>
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



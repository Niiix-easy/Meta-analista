'use client';

import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';

interface MetricsDashboardProps {
  metrics: {
    spend: number;
    revenue: number;
    roas: string;
    conversions: number;
  };
  formatCurrency: (v: number) => string;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, formatCurrency }) => {
  const roasValue = parseFloat(metrics.roas);
  const isRoasHealthy = roasValue >= 4.0;
  const roasProgress = Math.min(100, (roasValue / 8) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Investimento Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(metrics.spend)}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-bold">+12.5%</span> em relação ao período anterior
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Receita Gerada
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(metrics.revenue)}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-bold">+18.2%</span> em relação ao período anterior
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            ROAS Médio
          </CardTitle>
          <Zap className={cn("h-4 w-4", isRoasHealthy ? "text-yellow-500" : "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-black">{metrics.roas}x</div>
            <Badge variant={isRoasHealthy ? "success" : "warning"} className="font-black text-[10px]">
              {isRoasHealthy ? "SAUDÁVEL" : "ATENÇÃO"}
            </Badge>
          </div>
          <Progress value={roasProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-tighter">
            Meta Estabelecida: 4.5x
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Conversões
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{metrics.conversions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3 text-red-500" />
            <span className="text-red-500 font-bold">-2.1%</span> vs semana passada
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const Badge = ({ children, variant, className }: { children: React.ReactNode, variant: 'success' | 'warning', className?: string }) => {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-white font-bold",
      variant === 'success' ? "bg-green-500" : "bg-yellow-500",
      className
    )}>
      {children}
    </span>
  );
};

'use client';

import React, { memo, Fragment } from 'react';
import { 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Layers, 
  ChevronRight 
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/src/lib/utils';

import { Campaign, CampaignGroup } from '@/src/types';

export const CampaignRow = memo(({ 
  campaign, 
  isSelected, 
  onToggleSelection, 
  onUpdateBudget,
  isNested,
  formatCurrency
}: { 
  campaign: Campaign, 
  isSelected: boolean, 
  onToggleSelection: (id: string) => void, 
  onUpdateBudget: (id: string, val: number) => void,
  isNested?: boolean,
  formatCurrency: (v: number) => string
}) => {
  const pacingPercent = Math.min(100, (campaign.spend / campaign.dailyBudget) * 100);
  
  // Creative Health Calculation
  const roasValues = campaign.last7DaysSpend.map((d, i) => campaign.roas * (1 - (i * 0.05)));
  const isDeclining = roasValues[0] > roasValues[roasValues.length - 1];
  const healthScore = isDeclining ? Math.max(10, 85 - (roasValues[0] - roasValues[6]) * 10) : 95;

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        isSelected && "bg-muted/30",
        isNested && "bg-muted/5 border-l-2 border-l-primary/30"
      )}
    >
      <TableCell className={cn(isNested && "pl-8")}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggleSelection(campaign.id)} 
        />
      </TableCell>
      <TableCell className={cn("font-semibold", isNested && "text-sm")}>{campaign.name}</TableCell>
      <TableCell>
        <div className="h-8 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={campaign.last7DaysSpend}>
              <Line type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            healthScore > 80 ? "bg-green-500" : healthScore > 50 ? "bg-yellow-500" : "bg-red-500"
          )} />
          <span className="text-xs font-bold">{Math.round(healthScore)}%</span>
          {healthScore < 60 && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {formatCurrency(campaign.spend)}
          {campaign.spend >= campaign.dailyBudget * 0.95 && (
            <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="w-32 space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span>{Math.round(pacingPercent)}%</span>
            <span className="text-muted-foreground truncate ml-1">{formatCurrency(Math.max(0, campaign.dailyBudget - campaign.spend))} restando</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                pacingPercent > 90 ? "bg-orange-500" : "bg-primary"
              )}
              style={{ width: `${pacingPercent}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={campaign.roas > 5 ? "success" : "warning"}>{campaign.roas.toFixed(2)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <BudgetCell 
            id={campaign.id} 
            initialBudget={campaign.dailyBudget} 
            onUpdateBudget={onUpdateBudget} 
          />
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={campaign.status === 'Ativa' ? 'default' : 'secondary'}>{campaign.status}</Badge>
      </TableCell>
    </motion.tr>
  );
});

const BudgetCell = memo(({ 
  id, 
  initialBudget, 
  onUpdateBudget 
}: { 
  id: string, 
  initialBudget: number, 
  onUpdateBudget: (id: string, val: number) => void 
}) => {
  const [localValue, setLocalValue] = React.useState(initialBudget);

  React.useEffect(() => {
    setLocalValue(initialBudget);
  }, [initialBudget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(Number(e.target.value));
  };

  const handleBlur = () => {
    if (localValue !== initialBudget) {
      onUpdateBudget(id, localValue);
    }
  };

  return (
    <Input 
      type="number" 
      className="h-8 w-24 px-2 py-0" 
      value={localValue} 
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});

BudgetCell.displayName = 'BudgetCell';

CampaignRow.displayName = 'CampaignRow';

export const CampaignTable = memo(({ 
  campaigns, 
  groupedCampaigns,
  isGroupedView,
  expandedGroups,
  onToggleGroup,
  selectedCampaignIds, 
  onToggleSelection, 
  onUpdateBudget,
  onSort,
  sortConfig,
  formatCurrency
}: { 
  campaigns: Campaign[], 
  groupedCampaigns: CampaignGroup[],
  isGroupedView: boolean,
  expandedGroups: Set<string>,
  onToggleGroup: (id: string) => void,
  selectedCampaignIds: string[], 
  onToggleSelection: (id: string) => void, 
  onUpdateBudget: (id: string, val: number) => void,
  onSort: (key: string) => void,
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null,
  formatCurrency: (v: number) => string
}) => {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b">
          <TableHead className="w-[40px]"></TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('name')}>
            <div className="flex items-center">Campanha <SortIcon column="name" /></div>
          </TableHead>
          <TableHead>Tendência (7d)</TableHead>
          <TableHead>Saúde Criativa</TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('spend')}>
            <div className="flex items-center">Gasto (Hoje) <SortIcon column="spend" /></div>
          </TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('pacing')}>
            <div className="flex items-center">Ritmo do Orçamento <SortIcon column="pacing" /></div>
          </TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('roas')}>
            <div className="flex items-center">ROAS <SortIcon column="roas" /></div>
          </TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('dailyBudget')}>
            <div className="flex items-center">Orçamento Diário <SortIcon column="dailyBudget" /></div>
          </TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('status')}>
            <div className="flex items-center">Status <SortIcon column="status" /></div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!isGroupedView ? (
          campaigns.map(c => (
            <CampaignRow 
              key={c.id} 
              campaign={c} 
              isSelected={selectedCampaignIds.includes(c.id)}
              onToggleSelection={onToggleSelection}
              onUpdateBudget={onUpdateBudget}
              formatCurrency={formatCurrency}
            />
          ))
        ) : (
          groupedCampaigns.map(group => (
            <Fragment key={group.id}>
              <TableRow 
                className="bg-accent/10 cursor-pointer hover:bg-accent/20 transition-colors group border-b border-accent/20"
                onClick={() => onToggleGroup(group.id)}
              >
                <TableCell className="w-[40px]">
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      expandedGroups.has(group.id) && "rotate-90"
                    )} 
                  />
                </TableCell>
                <TableCell className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                   <Layers className="h-3 w-3 text-primary" />
                   {group.name}
                   <Badge variant="outline" className="ml-2 text-[8px] h-4">{group.campaigns.length} itens</Badge>
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="font-bold text-xs">{formatCurrency(group.totalSpend)}</TableCell>
                <TableCell>
                   <div className="h-1 w-24 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, (group.totalSpend / group.totalBudget) * 100)}%` }} />
                   </div>
                </TableCell>
                <TableCell>
                   <Badge variant={group.avgRoas > 5 ? "success" : "warning"} className="font-black">
                     {group.avgRoas.toFixed(2)}x
                   </Badge>
                </TableCell>
                <TableCell className="font-bold text-xs text-muted-foreground">
                   {formatCurrency(group.totalBudget)}
                </TableCell>
                <TableCell />
              </TableRow>
              <AnimatePresence mode="popLayout">
                {expandedGroups.has(group.id) && group.campaigns.map(c => (
                  <CampaignRow 
                    key={c.id} 
                    campaign={c} 
                    isSelected={selectedCampaignIds.includes(c.id)}
                    onToggleSelection={onToggleSelection}
                    onUpdateBudget={onUpdateBudget}
                    isNested
                    formatCurrency={formatCurrency}
                  />
                ))}
              </AnimatePresence>
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
});

CampaignTable.displayName = 'CampaignTable';

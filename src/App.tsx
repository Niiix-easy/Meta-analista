import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  status: 'Ativa' | 'Pausada';
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Vendas | Produto Principal', spend: 4320, revenue: 29890, roas: 6.92, status: 'Ativa' },
  { id: '2', name: 'Remarketing | Carrinho', spend: 2180, revenue: 12450, roas: 5.71, status: 'Ativa' },
];

export default function App() {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativa' | 'Pausada'>('Todos');
  const [dateRange, setDateRange] = useState('Ultimos 30 dias');
  const [campaigns] = useState<Campaign[]>(mockCampaigns);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => statusFilter === 'Todos' || c.status === statusFilter);
  }, [campaigns, statusFilter]);

  const { totalSpend, totalRevenue, averageRoas } = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const averageRoas = filteredCampaigns.length > 0 ? filteredCampaigns.reduce((sum, c) => sum + c.roas, 0) / filteredCampaigns.length : 0;
    return { totalSpend, totalRevenue, averageRoas };
  }, [filteredCampaigns]);

  const getInsights = async () => {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignData: filteredCampaigns })
    });
    const data = await res.json();
    alert(data.recommendation);
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold">Meta Ads AI Command Center</h1>
        <div className="flex gap-4">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-sm"
          >
            <option>Ultimos 7 dias</option>
            <option>Ultimos 30 dias</option>
            <option>Ultimos 90 dias</option>
          </select>
          <Button onClick={getInsights}>Generate AI Insights</Button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle>Total Spend</CardTitle></CardHeader>
          <CardContent className="text-3xl font-mono tabular-nums">R$ {totalSpend.toLocaleString()}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
          <CardContent className="text-3xl font-mono tabular-nums">R$ {totalRevenue.toLocaleString()}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle>Average ROAS</CardTitle></CardHeader>
          <CardContent className="text-3xl font-mono tabular-nums">{averageRoas.toFixed(2)}x</CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Campaigns</CardTitle>
          <div className="flex gap-2">
            {(['Todos', 'Ativa', 'Pausada'] as const).map(s => (
              <Button 
                key={s} 
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className="text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="font-mono tabular-nums">R$ {c.spend}</TableCell>
                  <TableCell className="font-mono tabular-nums">R$ {c.revenue}</TableCell>
                  <TableCell className="font-mono tabular-nums">{c.roas}</TableCell>
                  <TableCell>{c.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 h-[300px]">
        <CardHeader><CardTitle>ROAS Trend</CardTitle></CardHeader>
        <CardContent className="h-full">
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={filteredCampaigns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
              <Line type="monotone" dataKey="roas" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

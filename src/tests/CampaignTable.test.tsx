import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignTable } from '../components/CampaignTable';
import { Campaign } from '../types';
import React from 'react';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
}));

// Mock motion
vi.mock('motion/react', () => ({
  motion: {
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Campaign 1',
    spend: 1000,
    revenue: 5000,
    roas: 5,
    status: 'Ativa',
    dailyBudget: 100,
    last7DaysSpend: []
  },
  {
    id: '2',
    name: 'Campaign 2',
    spend: 2000,
    revenue: 4000,
    roas: 2,
    status: 'Pausada',
    dailyBudget: 200,
    last7DaysSpend: []
  }
];

describe('CampaignTable Component', () => {
  const defaultProps = {
    campaigns: mockCampaigns,
    groupedCampaigns: [],
    isGroupedView: false,
    expandedGroups: new Set<string>(),
    onToggleGroup: vi.fn(),
    selectedCampaignIds: [],
    onToggleSelection: vi.fn(),
    onUpdateBudget: vi.fn(),
    onSort: vi.fn(),
    sortConfig: null,
    formatCurrency: (v: number) => `R$ ${v}`
  };

  it('renders campaigns correctly', () => {
    render(<CampaignTable {...defaultProps} />);
    expect(screen.getByText('Campaign 1')).toBeDefined();
    expect(screen.getByText('Campaign 2')).toBeDefined();
  });

  it('calls onToggleSelection when checkbox is clicked', () => {
    render(<CampaignTable {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(defaultProps.onToggleSelection).toHaveBeenCalledWith('1');
  });

  it('calls onSort when a header is clicked', () => {
    render(<CampaignTable {...defaultProps} />);
    const nameHeader = screen.getByText(/Campanha/i);
    fireEvent.click(nameHeader);
    expect(defaultProps.onSort).toHaveBeenCalledWith('name');
  });

  it('calls onUpdateBudget when budget input changes', () => {
    render(<CampaignTable {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '150' } });
    fireEvent.blur(inputs[0]);
    expect(defaultProps.onUpdateBudget).toHaveBeenCalledWith('1', 150);
  });
});

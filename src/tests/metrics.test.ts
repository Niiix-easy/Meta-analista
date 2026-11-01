import { describe, it, expect } from 'vitest';
import { calculate, MetricsInput } from '../lib/metrics';

describe('Metrics Calculation Logic', () => {
  it('should calculate ROAS correctly', () => {
    const input: MetricsInput = {
      spend: 100,
      revenue: 500,
      clicks: 100,
      impressions: 1000,
      reach: 800,
      purchases: 10
    };
    const results = calculate(input);
    expect(results.roas).toBe(5);
  });

  it('should return null for ROAS if spend is 0', () => {
    const input: MetricsInput = {
      spend: 0,
      revenue: 500,
      clicks: 100,
      impressions: 1000,
      reach: 800,
      purchases: 10
    };
    const results = calculate(input);
    expect(results.roas).toBeNull();
  });

  it('should calculate CTR correctly', () => {
    const input: MetricsInput = {
      spend: 100,
      clicks: 50,
      impressions: 1000,
      reach: 800,
      purchases: 5
    };
    const results = calculate(input);
    expect(results.ctr).toBe(5); // (50 * 100) / 1000
  });

  it('should calculate CPA correctly', () => {
    const input: MetricsInput = {
      spend: 100,
      clicks: 100,
      impressions: 1000,
      reach: 800,
      purchases: 10
    };
    const results = calculate(input);
    expect(results.cpa).toBe(10);
  });

  it('should calculate ROI correctly', () => {
    const input: MetricsInput = {
      spend: 100,
      revenue: 300,
      totalCosts: 50,
      clicks: 100,
      impressions: 1000,
      reach: 800,
      purchases: 10
    };
    // ROI = (Revenue - Total Cost) / Total Cost
    // Total Cost = spend + totalCosts = 100 + 50 = 150
    // ROI = (300 - 150) / 150 = 1
    const results = calculate(input);
    expect(results.roi).toBe(1);
  });
});

'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HeatmapProps {
  data: { group: string; day: string; engagement: number }[];
}

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const segments = ['18-24', '25-34', '35-44', '45-54', '55+'];

export const AudienceHeatmap: React.FC<HeatmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(days)
      .padding(0.05);

    svg.append('g')
      .style('font-size', '10px')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(segments)
      .padding(0.05);

    svg.append('g')
      .style('font-size', '10px')
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.engagement) || 100]);

    // Add cells
    svg.selectAll()
      .data(data, (d: any) => d.group + ':' + d.day)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.day) || 0)
      .attr('y', (d: any) => y(d.group) || 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d: any) => colorScale(d.engagement))
      .style('stroke-width', 4)
      .style('stroke', 'none')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1).style('stroke', 'hsl(var(--primary))');
      })
      .on('mouseleave', function() {
        d3.select(this).style('opacity', 0.8).style('stroke', 'none');
      });

    // Add labels
    svg.selectAll()
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d: any) => (x(d.day) || 0) + x.bandwidth() / 2)
      .attr('y', (d: any) => (y(d.group) || 0) + y.bandwidth() / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .style('fill', (d: any) => d.engagement > 60 ? 'white' : 'black')
      .text((d: any) => d.engagement + '%');

  }, [data]);

  return (
    <div className="w-full h-full min-h-[300px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

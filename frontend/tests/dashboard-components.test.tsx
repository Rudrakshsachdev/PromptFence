import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { ColumnChart } from '@/components/charts/column-chart';
import { Sparkline } from '@/components/charts/sparkline';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Panel } from '@/components/shared/panel';

describe('Sparkline', () => {
  it('draws one point per value and exposes the summary as a tooltip', () => {
    const { container } = render(<Sparkline values={[0, 2, 5, 1]} color="#2A78D6" summary="8 runs over 4 days" />);

    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden');
    expect(svg.querySelector('title')).toHaveTextContent('8 runs over 4 days');
    expect(svg.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(4);
  });

  it('renders nothing for fewer than two points', () => {
    const { container } = render(<Sparkline values={[3]} color="#2A78D6" summary="one day" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('StatsCard', () => {
  it('shows the value, subtitle and a trend line from real data', () => {
    render(
      <StatsCard
        title="Test executions"
        value="8"
        subtitle="40 cases · 30d"
        icon={Activity}
        href="/test-runs"
        sparkline={{ values: [1, 3, 4], color: '#2A78D6', summary: '8 test runs' }}
      />,
    );

    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/test-runs');
    expect(within(card).getByText('8')).toBeInTheDocument();
    expect(within(card).getByText('40 cases · 30d')).toBeInTheDocument();
    expect(within(card).getByTestId('sparkline')).toBeInTheDocument();
  });

  it('hides the trend line while loading', () => {
    render(
      <StatsCard
        title="Vulnerabilities"
        value="—"
        icon={Activity}
        isLoading
        sparkline={{ values: [1, 2], color: '#EB6834', summary: 's' }}
      />,
    );
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });
});

describe('Panel', () => {
  it('defaults to an h2 title and accepts h3 under a section heading', () => {
    const { rerender } = render(<Panel title="Posture score">body</Panel>);
    expect(screen.getByRole('heading', { level: 2, name: 'Posture score' })).toBeInTheDocument();

    rerender(
      <Panel title="Posture score" headingLevel="h3">
        body
      </Panel>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Posture score' })).toBeInTheDocument();
  });
});

describe('ColumnChart legend totals', () => {
  it('prints each series total as text so low-contrast colours are not the only cue', () => {
    render(
      <ColumnChart
        data={[
          { date: '2026-11-01', canary: 2, tool: 1 },
          { date: '2026-11-02', canary: 3, tool: 0 },
        ]}
        xKey="date"
        legendTotals
        series={[
          { key: 'canary', label: 'Canary exposures', color: '#E87BA4' },
          { key: 'tool', label: 'Tool violations', color: '#EDA100' },
        ]}
      />,
    );

    expect(screen.getByText('Canary exposures').parentElement).toHaveTextContent('Canary exposures5');
    expect(screen.getByText('Tool violations').parentElement).toHaveTextContent('Tool violations1');
  });
});

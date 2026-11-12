import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Crosshair, ShieldAlert } from 'lucide-react';

describe('Dashboard Component Unit Tests', () => {
  it('renders StatsCard with provided metrics and title', () => {
    render(
      <StatsCard
        title="Active Targets"
        value={12}
        subtitle="12 operational"
        icon={Crosshair}
      />
    );

    expect(screen.getByText('Active Targets')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('12 operational')).toBeInTheDocument();
  });

  it('renders EmptyState with call-to-action button', () => {
    render(
      <EmptyState
        icon={ShieldAlert}
        title="No items found"
        description="Try configuring a new security scenario."
        actionText="Create Scenario"
        actionHref="/scenarios/new"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try configuring a new security scenario.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create scenario/i })).toBeInTheDocument();
  });
});


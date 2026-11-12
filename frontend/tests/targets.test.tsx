import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/shared/status-badge';
import { CategoryBadge } from '@/components/shared/category-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';

describe('Shared Security Badges', () => {
  it('renders StatusBadge active state correctly', () => {
    render(<StatusBadge isActive={true} activeText="Reachable" />);
    expect(screen.getByText('Reachable')).toBeInTheDocument();
  });

  it('renders StatusBadge inactive state correctly', () => {
    render(<StatusBadge isActive={false} inactiveText="Offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders CategoryBadge for Prompt Injection', () => {
    render(<CategoryBadge category="PROMPT_INJECTION" />);
    expect(screen.getByText('Prompt Injection')).toBeInTheDocument();
  });

  it('renders SeverityBadge for Critical', () => {
    render(<SeverityBadge severity="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });
});


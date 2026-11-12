import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

describe('ConfirmDialog Component', () => {
  it('renders confirmation modal with danger action button', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Test Suite"
        description="Are you sure you want to permanently remove this test suite?"
        confirmText="Confirm Delete"
        variant="destructive"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Delete Test Suite')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to permanently remove this test suite?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
  });
});


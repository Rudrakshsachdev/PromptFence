'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ className, onChange, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-9 h-9 text-sm"
        onChange={onChange}
        {...props}
      />
    </div>
  );
}


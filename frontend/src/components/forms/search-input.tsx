'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  /** Shows a clear button when the input has a value. */
  onClear?: () => void;
}

export function SearchInput({
  className,
  onChange,
  onSearch,
  onClear,
  value,
  placeholder = 'Search…',
  ...props
}: SearchInputProps) {
  const hasValue = typeof value === 'string' ? value.length > 0 : false;
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle-foreground"
        aria-hidden
      />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={props['aria-label'] ?? (typeof placeholder === 'string' ? placeholder : 'Search')}
        className="h-8 pl-8 pr-7 text-[13px] [&::-webkit-search-cancel-button]:hidden"
        value={value}
        onChange={(e) => {
          onChange?.(e);
          onSearch?.(e.target.value);
        }}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-subtle-foreground hover:bg-surface hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface JsonEditorProps {
  value?: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown> | null) => void;
  placeholder?: string;
  className?: string;
}

export function JsonEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  className,
}: JsonEditorProps) {
  const [text, setText] = useState(() => (value ? JSON.stringify(value, null, 2) : ''));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    setText(raw);

    if (!raw.trim()) {
      setError(null);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        setError(null);
        onChange(parsed);
      } else {
        setError('JSON must be an object');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid JSON syntax');
      }
    }
  };

  return (
    <div className="space-y-1">
      <Textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'font-mono text-xs min-h-[140px] leading-relaxed',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
      />
      {error && <p className="text-[11px] text-red-500 font-mono">{error}</p>}
    </div>
  );
}


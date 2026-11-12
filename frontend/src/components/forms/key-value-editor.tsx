'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KeyValueEditorProps {
  value?: Record<string, string> | null;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  value = {},
  onChange,
  keyPlaceholder = 'Header Name',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const currentEntries = Object.entries(value || {});
  const [entries, setEntries] = useState<Array<{ key: string; val: string }>>(
    currentEntries.length > 0
      ? currentEntries.map(([k, v]) => ({ key: k, val: v }))
      : [{ key: '', val: '' }]
  );

  const updateEntries = (newEntries: Array<{ key: string; val: string }>) => {
    setEntries(newEntries);
    const result: Record<string, string> = {};
    newEntries.forEach(({ key, val }) => {
      if (key.trim()) {
        result[key.trim()] = val;
      }
    });
    onChange(result);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const updated = [...entries];
    updated[index].key = newKey;
    updateEntries(updated);
  };

  const handleValChange = (index: number, newVal: string) => {
    const updated = [...entries];
    updated[index].val = newVal;
    updateEntries(updated);
  };

  const addRow = () => {
    updateEntries([...entries, { key: '', val: '' }]);
  };

  const removeRow = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    updateEntries(updated.length > 0 ? updated : [{ key: '', val: '' }]);
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <Input
            placeholder={keyPlaceholder}
            value={entry.key}
            onChange={(e) => handleKeyChange(idx, e.target.value)}
            className="flex-1 font-mono text-xs"
          />
          <Input
            placeholder={valuePlaceholder}
            value={entry.val}
            onChange={(e) => handleValChange(idx, e.target.value)}
            className="flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(idx)}
            className="text-slate-400 hover:text-red-500 h-9 w-9"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="text-xs h-8">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
      </Button>
    </div>
  );
}


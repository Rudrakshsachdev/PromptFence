import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        <p className="text-xs text-muted-foreground font-medium">Loading PromptFence...</p>
      </div>
    </div>
  );
}


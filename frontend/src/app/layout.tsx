import React from 'react';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'PromptFence — AI Application Security Testing Lab',
  description:
    'Provenance-aware adversarial security testing platform for AI-powered applications against prompt injection, data disclosure, and unauthorized tool execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


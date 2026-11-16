import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import '@/styles/globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PromptFence — LLM Security Platform',
  description:
    'Provenance-aware adversarial security testing platform for AI-powered applications against prompt injection, data disclosure, and unauthorized tool execution.',
};

export const viewport: Viewport = {
  themeColor: '#080D18',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                theme="dark"
                position="bottom-right"
                closeButton
                toastOptions={{
                  classNames: {
                    toast:
                      'border border-border bg-card text-foreground shadow-overlay font-sans text-[13px]',
                    description: 'text-muted-foreground',
                    success: '[&_[data-icon]]:text-success',
                    error: '[&_[data-icon]]:text-critical',
                    warning: '[&_[data-icon]]:text-warning',
                    info: '[&_[data-icon]]:text-info',
                    closeButton: 'border-border bg-surface text-muted-foreground',
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

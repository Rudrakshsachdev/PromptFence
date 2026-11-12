import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/overview',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ targetId: 'test-target-1', suiteId: 'test-suite-1', scenarioId: 'test-scenario-1' }),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));


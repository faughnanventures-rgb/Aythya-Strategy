import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-plan-id',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock environment variables
process.env.NEXT_PUBLIC_STORAGE_MODE = 'local';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-for-testing';
process.env.CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

// Suppress console errors during tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking ResizeObserver which is not present in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

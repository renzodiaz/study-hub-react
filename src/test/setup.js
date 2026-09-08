// Vitest global setup. Loaded once before the suite (see vite.config.js
// `test.setupFiles`). Registers the jest-dom matchers (toBeInTheDocument,
// toBeDisabled, …) on Vitest's `expect`. @testing-library/react registers its
// own afterEach(cleanup) automatically when globals are enabled, so unmounting
// between tests needs no wiring here.
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrollTo; TanStack Router calls it during scroll
// restoration. Stub it so tests don't emit "Not implemented" noise.
vi.stubGlobal('scrollTo', vi.fn());

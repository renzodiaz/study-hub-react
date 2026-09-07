import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';

// Minimal, realistic providers for rendering route components in tests.
//
// Kept deliberately small: it wires the two contexts every page component
// currently depends on — a fresh TanStack Query client and a real (in-memory)
// TanStack Router — and nothing else. It is not a universal test harness; add
// more only when a component under test genuinely needs it.

// A fresh client per test with retries OFF (a rejected query must fail fast and
// deterministically, never retry) and no caching (gcTime/staleTime 0) so no
// query state survives into the next test.
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

// Renders `Component` as the component of a route at `path`, inside a memory
// router seeded at `initialPath` (so route params resolve exactly as they would
// in the app — the router is real, never mocked). Register any navigation
// targets or <Link> destinations the component references via `extraRoutes`
// (each `{ path, component }`) so navigation is observable and Link hrefs
// resolve. Returns the Testing Library utils plus the live `router` and
// `queryClient`.
export function renderWithProviders(
  Component,
  {
    path = '/',
    initialPath = path,
    extraRoutes = [],
    queryClient = createTestQueryClient(),
  } = {},
) {
  const rootRoute = createRootRoute({ component: Outlet });

  const childRoutes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: Component,
    }),
    ...extraRoutes.map((r) =>
      createRoute({ getParentRoute: () => rootRoute, ...r }),
    ),
  ];
  rootRoute.addChildren(childRoutes);

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    // No defaultPreload: 'intent' — preloading needs IntersectionObserver, which
    // jsdom does not provide, and it is irrelevant to behavior under test.
    context: { user: null },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...utils, router, queryClient };
}

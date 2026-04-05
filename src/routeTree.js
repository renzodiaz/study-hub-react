import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';

import SidebarLayout from '@layouts/SidebarLayout';

// Pages
import Dashboard from '@pages/Dashboard/Home';
import Calendar from '@pages/Calendar/Index';
import Documents from '@pages/Documents/Index';
import Projects from '@pages/Projects/Index';
import Reports from '@pages/Reports/Index';
import Settings from '@pages/Settings/Index';
import StudyHub from '@pages/StudyHub/Index';

// ─── Dashboard Layout Route (wraps all sidebar pages) ─────────────────────────
const dashboardLayoutRoute = createRootRoute({
  component: SidebarLayout,
});

// ─── Child Routes (inside sidebar layout) ─────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  component: Dashboard,
});

const calendarRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'calendar',
  component: Calendar,
});

const documentsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'documents',
  component: Documents,
});

const projectsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'projects',
  component: Projects,
});

const reportsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'reports',
  component: Reports,
});

const settingsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'settings',
  component: Settings,
});

const studyHubRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'study-hub',
  component: StudyHub,
});

export const routeTree = dashboardLayoutRoute.addChildren([
  dashboardRoute,
  calendarRoute,
  documentsRoute,
  projectsRoute,
  reportsRoute,
  settingsRoute,
  studyHubRoute,
]);

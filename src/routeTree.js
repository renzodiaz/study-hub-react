import { createRootRoute, createRoute, redirect } from '@tanstack/react-router';

// Layouts
import AuthLayout from '@layouts/AuthLayout';
import SidebarLayout from '@layouts/SidebarLayout';

// Pages
import Dashboard from '@pages/Dashboard/Home';
import Calendar from '@pages/Calendar/Index';
import Documents from '@pages/Documents/Index';
import Login from '@pages/Auth/Login';
import Register from '@pages/Auth/Register';
import Projects from '@pages/Projects/Index';
import Reports from '@pages/Reports/Index';
import Settings from '@pages/Settings/Index';
import StudyHub from '@pages/StudyHub/Index';
import Editor from '@pages/StudyHub/Editor';
import CareerTracks from '@pages/CareerTracks/Index';
import Catalog from '@pages/Learn/Catalog';
import TrackDetail from '@pages/Learn/TrackDetail';
import MyLearning from '@pages/Learn/MyLearning';

// ─── Root Route ─────────────────────────
const rootRoute = createRootRoute();

// ─── Dashboard Layout Route (wraps all sidebar pages) ─────────────────────────
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'sidebar-layout',
  component: SidebarLayout,
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' });
    }
  },
});

// ─── Auth Layout Route (wraps all auth pages) ─────────────────────────
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  component: AuthLayout,
});

// ─── Child Routes (inside layouts) ─────────────────────────────────────
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

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: Login,
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: '/' });
    }
  },
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  component: Register,
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: '/' });
    }
  },
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

const careerTracksRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'career-tracks',
  component: CareerTracks,
});

const learnCatalogRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'learn',
  component: Catalog,
});

const learnTrackRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'learn/$trackId',
  component: TrackDetail,
});

const myLearningRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'my-learning',
  component: MyLearning,
});

// Same track detail page, reached from My learning — keeps that section
// active and the back link pointing back to My learning.
const myLearningTrackRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'my-learning/$trackId',
  component: TrackDetail,
});

const studyHubRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'study-hub',
  component: StudyHub,
});

const studyHubEditorRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'study-hub/$id',
  component: Editor,
});

export const routeTree = rootRoute.addChildren([
  dashboardLayoutRoute.addChildren([
    dashboardRoute,
    learnCatalogRoute,
    learnTrackRoute,
    myLearningRoute,
    myLearningTrackRoute,
    careerTracksRoute,
    calendarRoute,
    documentsRoute,
    projectsRoute,
    reportsRoute,
    settingsRoute,
    studyHubRoute,
    studyHubEditorRoute,
  ]),
  authLayoutRoute.addChildren([loginRoute, registerRoute]),
]);

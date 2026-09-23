import { createRootRoute, createRoute, redirect } from '@tanstack/react-router';

// Layouts
import AuthLayout from '@layouts/AuthLayout';
import SidebarLayout from '@layouts/SidebarLayout';
import ChromelessLayout from '@layouts/ChromelessLayout';

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
import ModuleDetail from '@pages/Learn/ModuleDetail';
import LessonViewer from '@pages/Learn/LessonViewer';
import Achievements from '@pages/Achievements/Index';
import AssessmentIntro from '@pages/Assessment/Intro';
import AssessmentAttemptShell from '@pages/Assessment/AttemptShell';
import Pilots from '@pages/Assessment/Pilots';
import InterviewIntro from '@pages/Interview/Intro';
import VerifyCredential from '@pages/Verify/Credential';
import Pricing from '@pages/Billing/Pricing';
import BillingManage from '@pages/Billing/Manage';
import BillingSuccess from '@pages/Billing/Success';
import BillingCanceled from '@pages/Billing/Canceled';

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

// ─── Chromeless Layout Route (authenticated, no AppShell) ─────────────────────
// Consequence-bearing attempts render without primary navigation (§3.3). Same
// auth guard as the app shell, but no sidebar/rail/bottom-nav chrome.
const chromelessLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'chromeless-layout',
  component: ChromelessLayout,
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' });
    }
  },
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

// Authenticated billing management (inside the app shell). The Stripe return
// pages (/billing/success, /billing/canceled) stay public at the root below.
const billingManageRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'billing',
  component: BillingManage,
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

const learnModuleRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'learn/$trackId/$courseId',
  component: ModuleDetail,
});

const lessonRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'lessons/$lessonId',
  component: LessonViewer,
});

// Credential assessment intro (start/resume) and the active attempt shell.
const assessmentIntroRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'learn/$trackId/$courseId/assessment',
  component: AssessmentIntro,
});

const pilotsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'pilots',
  component: Pilots,
});

// The active attempt runner is chromeless — no primary navigation while an
// assessment or Final Qualification attempt is in progress (§3.3, §10.3.5).
const assessmentAttemptRoute = createRoute({
  getParentRoute: () => chromelessLayoutRoute,
  path: 'assessment-attempts/$attemptId',
  component: AssessmentAttemptShell,
});

// Career final-interview intro/discovery (start/resume/state). The active
// attempt reuses the shared AttemptShell runner above.
const interviewIntroRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'learn/$trackId/interview',
  component: InterviewIntro,
});

const achievementsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: 'achievements',
  component: Achievements,
});

// Public credential verification (Certificate OR SeniorityBadge) — no auth, no
// app shell. Resolves the token via the unified backend endpoint.
const verifyCredentialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'verify/$token',
  component: VerifyCredential,
});

// Public pricing + Stripe Checkout return pages (no auth, no app shell). Pricing
// adapts its CTA to the viewer's auth state via useAuth.
const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pricing',
  component: Pricing,
});

const billingSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'billing/success',
  component: BillingSuccess,
});

const billingCanceledRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'billing/canceled',
  component: BillingCanceled,
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
    learnModuleRoute,
    lessonRoute,
    assessmentIntroRoute,
    pilotsRoute,
    interviewIntroRoute,
    myLearningRoute,
    myLearningTrackRoute,
    achievementsRoute,
    careerTracksRoute,
    calendarRoute,
    documentsRoute,
    projectsRoute,
    reportsRoute,
    settingsRoute,
    billingManageRoute,
    studyHubRoute,
    studyHubEditorRoute,
  ]),
  authLayoutRoute.addChildren([loginRoute, registerRoute]),
  chromelessLayoutRoute.addChildren([assessmentAttemptRoute]),
  verifyCredentialRoute,
  pricingRoute,
  billingSuccessRoute,
  billingCanceledRoute,
]);

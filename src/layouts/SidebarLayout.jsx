import AppShell from '@components/shell/AppShell';

// The authenticated learner layout is the approved AppShell (§3): primary
// navigation, responsive shell states and the content region. It renders its
// own <Outlet/>, so this stays a thin binding between the route tree and the
// shell component.
const SidebarLayout = () => <AppShell />;

export default SidebarLayout;

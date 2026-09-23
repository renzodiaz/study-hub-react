import { Outlet } from '@tanstack/react-router';

// Chromeless layout for consequence-bearing attempts (§3.3, §10.3.5): while a
// Course assessment or Final Qualification attempt is active, primary
// navigation is NOT rendered. The runner supplies its own top bar and manages
// its own layout, so this wrapper only provides the page ground and an outlet —
// it deliberately does not mount the AppShell or its navigation.
const ChromelessLayout = () => (
  <div className="min-h-screen bg-ground">
    <Outlet />
  </div>
);

export default ChromelessLayout;

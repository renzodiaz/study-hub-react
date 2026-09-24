import { Outlet } from '@tanstack/react-router';

// Public account-entry shell. The auth ground is the approved sunken neutral
// (§2.1 surface-sunken); each page renders its own AuthShell card on top.
const AuthLayout = () => {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-surface-sunken px-4 py-12 sm:px-6">
      <Outlet />
    </div>
  );
};

export default AuthLayout;

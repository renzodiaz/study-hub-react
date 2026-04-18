import { Outlet } from '@tanstack/react-router';

const AuthLayout = () => {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Outlet />
    </div>
  );
};

export default AuthLayout;

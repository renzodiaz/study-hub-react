import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useAuth } from '@hooks/useAuth';

// Client-side guard for admin-only pages. Redirects non-admins to the home
// dashboard. Defense-in-depth only — the API already enforces admin access
// (Admin::BaseController#require_admin!); this just hides the authoring UI.
export const useRequireAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) navigate({ to: '/' });
  }, [isAdmin, navigate]);

  return isAdmin;
};

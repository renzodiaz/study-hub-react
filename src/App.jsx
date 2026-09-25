import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';
import { useAuth } from '@hooks/useAuth';
import { Spinner } from '@components/ui';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { user: null },
});

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-sunken">
        <Spinner size="lg" label="Loading Study Hub" />
      </div>
    );
  }

  return <RouterProvider router={router} context={{ user }} />;
};

export default App;

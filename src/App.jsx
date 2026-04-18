import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';
import { useAuth } from '@hooks/useAuth';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { user: null },
});

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return <RouterProvider router={router} context={{ user }} />;
};

export default App;

import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

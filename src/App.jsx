import { useState } from 'react';
import SidebarLayout from './pages/Layouts/SidebarLayout';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarLayout
      sidebarOpen={sidebarOpen}
      setSidebarOpen={() => setSidebarOpen(!sidebarOpen)}
    >
      <h1>Hello World</h1>
    </SidebarLayout>
  );
}

export default App;

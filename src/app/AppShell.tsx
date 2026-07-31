import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>BirStore</h1>
        <Nav />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

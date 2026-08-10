import './App.css';
import './features/_registerAll';
import { Providers } from './app/providers';
import { AppRoutes } from './app/AppRoutes';
import { ErrorBoundary } from './shared/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;

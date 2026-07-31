import './App.css';
import './features/_registerAll';
import { Providers } from './app/providers';
import { AppRoutes } from './app/AppRoutes';

function App() {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
}

export default App;

import type { ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../shared/auth/AuthContext';
import { queryClient } from '../shared/lib/queryClient';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>{children}</HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

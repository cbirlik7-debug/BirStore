import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Beklenmeyen hata:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h1>Bir şeyler ters gitti</h1>
          <p>Ekran beklenmedik bir hatayla karşılaştı. Sayfayı yenilemeyi deneyin.</p>
          <button type="button" className="btn-accept" onClick={() => window.location.reload()}>
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

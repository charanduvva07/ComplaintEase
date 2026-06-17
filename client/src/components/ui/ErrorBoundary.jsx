import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error tracking service (e.g. Sentry)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '32px',
            textAlign: 'center',
            background: 'rgb(8, 12, 24)',
            color: '#f1f5f9',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239,68,68,0.1)',
              fontSize: 36,
            }}
          >
            ⚠️
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 380 }}>
              An unexpected error occurred. Please refresh the page or return to the home page.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#fca5a5',
                  textAlign: 'left',
                  maxWidth: 500,
                  overflow: 'auto',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ← Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                background: 'rgba(255,255,255,0.06)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

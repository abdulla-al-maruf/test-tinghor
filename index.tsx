
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declaring state as a class property ensures TypeScript recognizes it on the class instance, resolving errors on lines 19 and 32.
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Fix: Explicitly defining the constructor to ensure 'props' is correctly inherited and typed, resolving the error on line 33.
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // Correctly accessing state and props from the component instance
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div style={{
          padding: '40px', 
          fontFamily: 'sans-serif', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          backgroundColor: '#f8fafc'
        }}>
          <h1 style={{color: '#ef4444', fontSize: '24px', marginBottom: '10px'}}>সফটওয়্যারে সমস্যা হয়েছে</h1>
          <p style={{color: '#64748b', marginBottom: '20px'}}>দুঃখিত, কোনো একটি কারণে অ্যাপটি লোড হতে পারছে না।</p>
          
          <div style={{
            background: '#fff', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            maxWidth: '600px', 
            width: '100%', 
            overflow: 'auto',
            marginBottom: '20px',
            color: '#334155',
            fontFamily: 'monospace'
          }}>
            {error && error.toString()}
          </div>

          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            style={{
              padding: '12px 24px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reset Data & Reload
          </button>
        </div>
      );
    }

    return children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

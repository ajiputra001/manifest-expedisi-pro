import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', padding: '20px', backgroundColor: '#09090b', height: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>Opps! Terjadi Kesalahan (Runtime Error)</h1>
          <p>Tolong screenshot layar ini dan kirimkan ke saya:</p>
          <pre style={{ background: '#18181b', padding: '15px', borderRadius: '8px', overflowX: 'auto', color: '#f87171' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

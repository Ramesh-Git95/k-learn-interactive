
import './src/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  // Only register in production to avoid development caching issues
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // Service worker registered successfully
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Log to the same error tracking system
  try {
    const errorData = {
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const existingErrors = JSON.parse(localStorage.getItem('k-learn-errors') || '[]');
    existingErrors.push(errorData);
    const recentErrors = existingErrors.slice(-10);
    localStorage.setItem('k-learn-errors', JSON.stringify(recentErrors));
  } catch (e) {
    console.error('Failed to log unhandled rejection:', e);
  }
});

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

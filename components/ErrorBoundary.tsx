import React from 'react';

interface Props {
  children: React.ReactNode;
}

// Simple fallback component for now
const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export default ErrorBoundary;

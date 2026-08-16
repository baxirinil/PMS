import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Dashboard />
      </div>
    </AuthProvider>
  );
}

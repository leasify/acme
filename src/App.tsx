import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import './index.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('App: isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  console.log('App: Rendering', isAuthenticated ? 'Dashboard' : 'LoginPage');
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
};

const App: React.FC = () => {
  return (
    <div className="dark">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
};

export default App;
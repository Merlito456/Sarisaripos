import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePremium = false 
}) => {
  const { user, isLoading, isPremium } = useAuth();
  
  useEffect(() => {
    // Stringify for WebView console visibility
    console.log("ProtectedRoute check: " + JSON.stringify({ 
      user: !!user, 
      isLoading, 
      isPremium, 
      hash: window.location.hash,
      path: window.location.pathname
    }));
  }, [user, isLoading, isPremium]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requirePremium && !isPremium) {
    return <Navigate to="/premium" replace />;
  }

  return <>{children}</>;
};

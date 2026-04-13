import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import Loader from './loader';

const PrivateRoute = ({ role }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role (role can be a string or an array of strings)
  const hasRole = !role || (Array.isArray(role) ? role.includes(user?.role) : user?.role === role);

  if (!hasRole) {
    const targetDashboard = `/${user?.role}/dashboard`;
    // Prevent infinite loops if the user is already on their dashboard but doesn't have permissions
    if (window.location.pathname.startsWith(targetDashboard)) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
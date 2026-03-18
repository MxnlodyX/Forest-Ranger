import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/useAppContext';

function defaultSignInPath(role) {
  return role === 'fieldops' ? '/signin/fieldops' : '/signin/backoffice';
}

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, authRole } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to={defaultSignInPath(allowedRoles[0])} replace />;
  }

  if (!allowedRoles.includes(authRole)) {
    const redirectPath = authRole === 'fieldops' ? '/field-ops/home' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

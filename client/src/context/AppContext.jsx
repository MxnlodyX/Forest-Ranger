import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authRole, setAuthRole] = useState(null);

  const loginAs = (role, user = null) => {
    setAuthRole(role);
    setCurrentUser(user ?? { name: 'Operator', role });
  };

  const logout = () => {
    setAuthRole(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    setCurrentUser,
    authRole,
    isAuthenticated: Boolean(authRole),
    loginAs,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
  return ctx;
}

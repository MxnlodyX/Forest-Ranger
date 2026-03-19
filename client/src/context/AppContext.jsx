import { useEffect, useState } from 'react';
import { AppContext } from './AppContextObject';

const AUTH_STORAGE_KEY = 'forest_shield_auth';
const USER_PROFILE_KEY = 'forest_shield_user_profile';

function readStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { authRole: null, currentUser: null };

  try {
    const parsed = JSON.parse(raw);
    return {
      authRole: parsed.authRole ?? null,
      currentUser: parsed.currentUser ?? null,
    };
  } catch {
    return { authRole: null, currentUser: null };
  }
}

export function AppProvider({ children }) {
  const initialAuth = readStoredAuth();
  const [currentUser, setCurrentUser] = useState(initialAuth.currentUser);
  const [authRole, setAuthRole] = useState(initialAuth.authRole);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const loginAs = (role, user = null, options = {}) => {
    const remember = Boolean(options.remember);
    const normalizedUser = user ?? { name: 'Operator', role };

    setAuthRole(role);
    setCurrentUser(normalizedUser);

    const payload = JSON.stringify({ authRole: role, currentUser: normalizedUser });
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, payload);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setAuthRole(null);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
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

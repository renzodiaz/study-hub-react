import { useState, useEffect } from 'react';
import { AuthContext } from '@contexts/authContext';
import { getMe } from '@/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const setLoggedIn = (userData) => setUser(userData);
  const setLoggedOut = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, setLoggedIn, setLoggedOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

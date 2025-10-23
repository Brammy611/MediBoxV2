import React, { createContext, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useStore from '../store';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth, clearAuth } = useStore((state) => ({
    auth: state.auth,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth,
  }));

  useEffect(() => {
    const bootstrapSession = async () => {
      const tokenFromStorage = window.localStorage.getItem('token');
      const token = auth.token || tokenFromStorage;

      if (!token) {
        if (auth.loading) {
          setAuth({ loading: false });
        }
        if (location.pathname !== '/login') {
          navigate('/login', {
            replace: true,
            state: { from: location },
          });
        }
        return;
      }

      if (auth.user) {
        if (auth.loading) {
          setAuth({ loading: false });
        }
        return;
      }

      try {
        setAuth({ loading: true, token });
  const { data } = await api.get('auth/me');
        const resolvedRole = data?.user?.role || data?.role || auth.role;
        setAuth({
          user: data?.user || null,
          role: resolvedRole || null,
          token,
          loading: false,
        });
      } catch (err) {
        console.error('Session bootstrap failed', err);
        clearAuth();
        navigate('/login', {
          replace: true,
          state: { from: location, error: 'session-expired' },
        });
      }
    };

    bootstrapSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, auth.user]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated: Boolean(auth.token && auth.user),
      user: auth.user,
      role: auth.role,
      token: auth.token,
      loading: auth.loading,
      setAuth,
      clearAuth,
    }),
    [auth, clearAuth, setAuth]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;

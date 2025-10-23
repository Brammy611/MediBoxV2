import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../auth/AuthProvider';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const registeredEmail = location.state?.registeredEmail;
  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from?.pathname || '/';
  const urlFlag = useMemo(() => new URLSearchParams(location.search).get('registered'), [location.search]);
  const registrationMessage = urlFlag ? 'Account created successfully. Please sign in with your new credentials.' : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
  const { data } = await api.post('api/auth/login', { email, password });
      const token = data?.access_token || data?.token;
      if (!token) {
        throw new Error('Token missing from response');
      }

      window.localStorage.setItem('token', token);
      setAuth({
        token,
        user: data?.user || { email },
        role: data?.user?.role || data?.role || null,
        loading: false,
      });

      navigate(fromPath, { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to sign in. Please verify your credentials.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl md:grid-cols-2">
        <div className="relative hidden h-full flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white md:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">MediBox platform</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Connected care for every dose</h2>
            <p className="mt-3 text-sm text-indigo-100">
              One login unlocks proactive reminders, health intelligence, refill automation, and a collaborative family workspace.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-indigo-100">
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">1</span>
              Adaptive medication schedule that learns your routine.
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">2</span>
              Daily health check-ins with instant risk insights.
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">3</span>
              Seamless refill workflows shared with your pharmacist.
            </li>
          </ul>
        </div>
        <div className="bg-white px-8 py-10 text-gray-900 sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Sign in</p>
            <h1 className="mt-3 text-2xl font-semibold">Welcome back to MediBox</h1>
            <p className="mt-2 text-sm text-gray-500">Enter your credentials to continue where you left off.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {registrationMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {registrationMessage}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                Need an account?
                {' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                  Register now
                </Link>
                .
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

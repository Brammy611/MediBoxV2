import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const roles = [
  { value: 'user', label: 'User' },
  { value: 'family', label: 'Family' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Registering user:', { email, role });

      const response = await api.post('auth/register', {
        username: email, // ✅ Backend expect 'username', bukan 'email'
        email: email,
        password,
        role,
      });

      console.log('✅ Registration successful:', response.data);

      // Redirect to login with success message
      navigate('/login?registered=1', {
        replace: true,
        state: {
          registeredEmail: email,
          message: 'Registration successful! Please login.',
        },
      });
    } catch (err) {
      console.error('❌ Registration failed:', err);
      console.error('📋 Error response:', err.response?.data);
      console.error('🔢 Status code:', err.response?.status);
      
      setError(
        err?.response?.data?.message
          || err?.response?.data?.msg
          || err?.message
          || 'Unable to register right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl md:grid-cols-2">
        {/* Left Panel - Info */}
        <div className="relative hidden h-full flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white md:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">MediBox membership</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Create your connected care account</h2>
            <p className="mt-3 text-sm text-indigo-100">
              Register once to unlock coordinated reminders, family dashboards, and pharmacist collaboration across your devices.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-indigo-100">
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">✓</span>
              Real-time medication schedule synced across roles.
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">✓</span>
              Adaptive health insights tailored to daily check-ins.
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white border-opacity-30">✓</span>
              Smooth refill pipelines connecting households and pharmacies.
            </li>
          </ul>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-white px-8 py-10 text-gray-900 sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Register</p>
            <h1 className="mt-3 text-2xl font-semibold">Let&apos;s set up your MediBox account</h1>
            <p className="mt-2 text-sm text-gray-500">Choose a role and provide your credentials below.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
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

              {/* Password Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {roles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  User: pribadi, Family: pemantauan keluarga, Pharmacist: operasional apotek.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering…
                  </span>
                ) : (
                  'Create account'
                )}
              </button>
              <p className="text-center text-xs text-gray-500">
                Already registered?
                {' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in instead
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

export default RegisterPage;
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import useStore from '../store';
import useResource from '../hooks/useResource';

const linksByRole = {
  user: [
    { to: '/dashboard', label: 'Dashboard', exact: true },
    { to: '/schedule', label: 'Schedule' },
    { to: '/checkup', label: 'Checkup' },
    { to: '/profile', label: 'Profile' },
  ],
  family: [
    { to: '/family/dashboard', label: 'Family Dashboard', exact: true },
    { to: '/family/profile', label: 'Family Profile' },
  ],
  pharmacist: [
    { to: '/pharmacist', label: 'Pharmacist Dashboard', exact: true },
    { to: '/dashboard', label: 'User Dashboard' },
  ],
};

const AppLayout = () => {
  const { user, role, clearAuth } = useAuth();
  const { ui, reminders, healthReports, refillRequests, adherenceLogs } = useStore((state) => ({
    ui: state.ui,
    reminders: state.entities.reminders,
    healthReports: state.entities.healthReports,
    refillRequests: state.entities.refillRequests,
    adherenceLogs: state.entities.adherenceLogs,
  }));
  const [navOpen, setNavOpen] = useState(false);

  const shouldBootstrapUserData = role === 'user';
  const { refetch: refetchReminders } = useResource('reminders', 'reminders', {
    params: { scope: 'active' },
    auto: false,
  });
  const { refetch: refetchHealthReports } = useResource('healthReports', 'health/reports', {
    params: { limit: 1 },
    transform: (data) => (Array.isArray(data) ? data : [data].filter(Boolean)),
    auto: false,
  });

  useEffect(() => {
    if (!shouldBootstrapUserData) {
      return;
    }
    refetchReminders().catch(() => {});
    refetchHealthReports().catch(() => {});
  }, [shouldBootstrapUserData, refetchReminders, refetchHealthReports]);

  // 🧭 Tentukan navigasi berdasarkan role
  const navLinks = useMemo(() => {
    if (role === 'user') {
      return linksByRole.user;
    }
    const defaultLinks = [{ to: '/dashboard', label: 'Dashboard', exact: true }];
    if (!role) return defaultLinks;
    return linksByRole[role] || defaultLinks;
  }, [role]);

  // 📊 Hitung metrik berdasarkan data
  const metrics = useMemo(() => {
    const parseDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const safeReminders = Array.isArray(reminders) ? reminders : [];
    const mappedReminders = safeReminders
      .map((reminder) => ({
        ...reminder,
        scheduledAt: parseDate(
          reminder.time || reminder.scheduled_time || reminder.reminder_time
        ),
      }))
      .filter((reminder) => reminder.scheduledAt instanceof Date);

    mappedReminders.sort((a, b) => a.scheduledAt - b.scheduledAt);
    const now = new Date();

    const overdueCount = mappedReminders.filter(
      (r) => r.scheduledAt && r.scheduledAt < now
    ).length;

    const safeRefills = Array.isArray(refillRequests) ? refillRequests : [];
    const pendingRefills = safeRefills.filter((request) => {
      const status = (request.status || '').toLowerCase();
      return status === 'pending' || status === 'awaiting';
    }).length;

    const safeHealth = Array.isArray(healthReports) ? healthReports : [];
    const latestHealth = safeHealth.length > 0 ? safeHealth[0] : null;

    const safeLogs = Array.isArray(adherenceLogs) ? adherenceLogs : [];

    return {
      nextReminder: mappedReminders[0] || null,
      upcomingCount: mappedReminders.length,
      overdueCount,
      pendingRefills,
      healthRisk: (latestHealth?.adherence_risk || '').toLowerCase(),
      historyEntries: safeLogs.length,
    };
  }, [adherenceLogs, healthReports, refillRequests, reminders]);

  // 🧑‍💻 Identitas user
  const displayName = user?.name || user?.username || user?.email || 'Guest user';
  const initials = displayName
    .split(' ')
    .map((segment) => segment.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const nextReminderLabel = metrics.nextReminder?.scheduledAt
    ? metrics.nextReminder.scheduledAt.toLocaleString()
    : 'All caught up';

  const riskTone = (() => {
    switch (metrics.healthRisk) {
      case 'high':
        return 'border-red-500 bg-red-500 bg-opacity-10 text-red-200';
      case 'medium':
        return 'border-yellow-400 bg-yellow-400 bg-opacity-10 text-yellow-200';
      case 'low':
        return 'border-green-500 bg-green-500 bg-opacity-10 text-green-200';
      default:
        return 'border-blue-500 bg-blue-500 bg-opacity-10 text-blue-200';
    }
  })();

  const closeNavigation = () => setNavOpen(false);

  const isUserRole = role === 'user';

  const userSidebarSections = useMemo(
    () => ([
      {
        id: 'dashboard',
        path: '/dashboard',
        title: 'Dashboard',
        description: 'Medication history overview',
        highlight: `${metrics.historyEntries} records`,
      },
      {
        id: 'schedule',
        path: '/schedule',
        title: 'Schedule',
        description: 'Upcoming reminders & alerts',
        highlight: `${metrics.upcomingCount} upcoming`,
        badge: metrics.overdueCount > 0 ? `${metrics.overdueCount} overdue` : undefined,
      },
      {
        id: 'checkup',
        path: '/checkup',
        title: 'Checkup',
        description: 'Daily health questionnaire',
        highlight: metrics.healthRisk ? metrics.healthRisk.toUpperCase() : 'N/A',
      },
      {
        id: 'profile',
        path: '/profile',
        title: 'Profile',
        description: 'Personal health context',
        highlight: user?.email || displayName,
      },
    ]),
    [displayName, metrics, user?.email],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black bg-opacity-40 md:hidden"
          onClick={closeNavigation}
          aria-label="Close navigation"
        />
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 bg-opacity-80 shadow-2xl">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 bg-opacity-90 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNavOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-700 p-2 text-gray-200 transition hover:border-blue-500 hover:text-white md:hidden"
                aria-expanded={navOpen}
                aria-controls="primary-navigation"
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {navOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Medibox Control Center</p>
                <h1 className="text-lg font-semibold text-white sm:text-xl">
                  Connected adherence intelligence
                </h1>
              </div>
            </div>

            {/* Header kanan */}
            <div className="hidden items-center gap-6 md:flex">
              <div className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-gray-400">Next dose</p>
                <p className="text-sm font-semibold text-white">{nextReminderLabel}</p>
              </div>
              <div className={`rounded-xl border px-4 py-2 text-sm font-semibold ${riskTone}`}>
                <span className="text-xs uppercase tracking-wide text-gray-300">Risk level</span>
                <p className="text-sm font-semibold text-white">
                  {metrics.healthRisk ? metrics.healthRisk.toUpperCase() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Profil */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase">
                {initials || 'MB'}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">{role ? role : 'member'}</p>
                <button
                  type="button"
                  onClick={clearAuth}
                  className="mt-1 inline-flex items-center text-xs font-semibold text-blue-300 transition hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Layout utama */}
          <div className="relative flex flex-1">
            {/* Sidebar */}
            <aside
              id="primary-navigation"
              className={`absolute inset-y-0 left-0 z-30 w-64 transform border-r border-gray-800 bg-gray-900 bg-opacity-95 px-4 py-6 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
                navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}
            >
              {isUserRole ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your sections</p>
                  {userSidebarSections.map((section) => (
                    <NavLink
                      key={section.id}
                      to={section.path}
                      end={section.path === '/dashboard'}
                      onClick={closeNavigation}
                      className={({ isActive }) =>
                        `block rounded-xl border px-4 py-3 text-sm transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                            : 'border-transparent bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{section.title}</p>
                          <p className="text-xs text-gray-400">{section.description}</p>
                        </div>
                        <div className="text-right text-xs font-semibold uppercase tracking-wide text-blue-300">
                          {section.highlight}
                        </div>
                      </div>
                      {section.badge && (
                        <p className="mt-2 inline-flex rounded-full bg-red-500 bg-opacity-10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-red-300">
                          {section.badge}
                        </p>
                      )}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <nav className="space-y-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Navigation</p>
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.exact}
                      onClick={closeNavigation}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                            : 'border-transparent bg-gray-800 text-gray-300 hover:border-blue-500 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <span>{link.label}</span>
                      <svg
                        className="h-4 w-4 opacity-50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </NavLink>
                  ))}
                </nav>
              )}

              {/* Snapshot ringkasan */}
              <div className="mt-8 space-y-3 text-sm text-gray-400">
                <div className="rounded-xl border border-gray-800 bg-gray-800 bg-opacity-60 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Snapshot</p>
                  <dl className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <dt>Upcoming reminders</dt>
                      <dd className="font-semibold text-gray-200">{metrics.upcomingCount}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Overdue doses</dt>
                      <dd className="font-semibold text-red-300">{metrics.overdueCount}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Pending refills</dt>
                      <dd className="font-semibold text-yellow-300">{metrics.pendingRefills}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>

            {/* Konten utama */}
            <main className="flex-1 overflow-y-auto bg-gray-100 px-4 py-6 text-gray-900 sm:px-8 sm:py-8">
              <div className="space-y-6">
                {Array.isArray(ui.notifications) && ui.notifications.length > 0 && (
                  <section
                    className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6"
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-blue-700">Latest notifications</h2>
                      <span className="text-xs text-blue-500">
                        Showing {Math.min(ui.notifications.length, 5)} of {ui.notifications.length}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-blue-900">
                      {ui.notifications.slice(0, 5).map((notification, idx) => (
                        <li
                          key={`${notification.id || notification.title || 'notification'}-${idx}`}
                          className="rounded-lg border border-blue-100 bg-white bg-opacity-40 px-3 py-2"
                        >
                          <p className="font-medium">{notification.title || 'Update'}</p>
                          <p className="text-xs text-blue-700">
                            {notification.message || notification.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

import React, { useCallback, useMemo } from 'react';
import api from '../api/axios';
import MedicineSchedule from '../components/MedicineSchedule.jsx';
import Alerts from '../components/Alerts.jsx';
import AdherenceLogs from '../components/AdherenceLogs.jsx';
import CheckupForm from '../components/CheckupForm.jsx';
import useResource from '../hooks/useResource';
import { useAuth } from '../auth/AuthProvider';

const UserDashboard = () => {
    const { user } = useAuth();

    const {
        data: alerts = [],
        loading: alertsLoading,
        error: alertsError,
        refetch: refetchAlerts,
    } = useResource('alerts', 'alerts', { auto: true });

    const {
        data: reminders = [],
        loading: remindersLoading,
        error: remindersError,
        refetch: refetchReminders,
    } = useResource('reminders', 'reminders', {
        params: { scope: 'active' },
    });

    const {
        data: healthReports = [],
        loading: healthLoading,
        error: healthError,
        refetch: refetchHealth,
    } = useResource('healthReports', 'health/reports', {
        params: { limit: 1 },
        transform: (data) => (Array.isArray(data) ? data : [data].filter(Boolean)),
    });

    const {
        data: adherenceLogs = [],
        loading: logsLoading,
        error: logsError,
        refetch: refetchLogs,
    } = useResource('adherenceLogs', 'adherence/logs', {
        params: { limit: 50, scope: 'user' },
    });

    const healthStatus = useMemo(
        () => (Array.isArray(healthReports) ? healthReports[0] : healthReports),
        [healthReports]
    );

    const reminderInsights = useMemo(() => {
        const parseDate = (value) => {
            if (!value) {
                return null;
            }
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const enriched = reminders
            .map((reminder) => ({
                ...reminder,
                scheduledAt: parseDate(reminder.time || reminder.scheduled_time || reminder.reminder_time),
            }))
            .filter((reminder) => reminder.scheduledAt instanceof Date)
            .sort((a, b) => a.scheduledAt - b.scheduledAt);

        const today = new Date();
        const next = enriched[0] || null;
        const upcomingToday = enriched.filter((reminder) => {
            if (!reminder.scheduledAt) {
                return false;
            }
            return reminder.scheduledAt.toDateString() === today.toDateString();
        }).length;

        const overdue = enriched.filter((reminder) => reminder.scheduledAt && reminder.scheduledAt < today).length;

        return {
            nextReminder: next,
            upcomingToday,
            overdue,
            total: enriched.length,
        };
    }, [reminders]);

    const handleIntakeConfirmation = useCallback(
        async (reminder) => {
            if (!reminder?.id && !reminder?._id) {
                return;
            }
            try {
                await api.post('intake/logs', {
                    reminder_id: reminder.id || reminder._id,
                    confirmed: true,
                });
                await Promise.all([
                    refetchReminders(),
                    refetchHealth(),
                    refetchAlerts(),
                    refetchLogs(),
                ]);
            } catch (error) {
                console.error('Error logging intake confirmation', error);
            }
        },
        [refetchAlerts, refetchHealth, refetchLogs, refetchReminders]
    );

    const isLoading = remindersLoading || healthLoading || alertsLoading || logsLoading;
    const errorMessage = alertsError || remindersError || healthError || logsError;

    const riskLevel = (healthStatus?.adherence_risk || healthStatus?.risk_level || 'low').toLowerCase();
    const riskAccent = (() => {
        switch (riskLevel) {
            case 'high':
                return 'bg-red-500 bg-opacity-20 text-red-100 border-red-400';
            case 'medium':
                return 'bg-yellow-500 bg-opacity-20 text-yellow-100 border-yellow-400';
            default:
                return 'bg-green-500 bg-opacity-20 text-green-100 border-green-400';
        }
    })();

    const nextDoseLabel = reminderInsights.nextReminder?.scheduledAt
        ? reminderInsights.nextReminder.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'No upcoming doses';

    const nextDoseName = reminderInsights.nextReminder?.medicine_name
        || reminderInsights.nextReminder?.name
        || reminderInsights.nextReminder?.message
        || 'All caught up';

    const medicalHistory = user?.medical_history
        || healthStatus?.medical_history
        || 'Not documented yet.';

    const userAgeLabel = user?.age ? `${user.age} years` : 'Not provided';
    const userIdLabel = user?.id || user?._id || 'Unavailable';

    return (
        <div className="space-y-12">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-8 text-white shadow-xl sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-blue-200">Today&apos;s care summary</p>
                        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Welcome back, {user?.username || user?.email || 'member'}</h1>
                        <p className="mt-3 max-w-2xl text-sm text-blue-100">
                            Review your medication history, stay on top of upcoming doses, and complete a quick checkup to receive fresh recommendations.
                        </p>
                    </div>
                    <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
                        <div className="rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-widest text-blue-200">Next dose</p>
                            <p className="mt-2 text-lg font-semibold">{nextDoseName}</p>
                            <p className="text-sm text-blue-100">{nextDoseLabel}</p>
                        </div>
                        <div className={`rounded-2xl border p-4 shadow-lg ${riskAccent}`}>
                            <p className="text-xs uppercase tracking-widest">Risk level</p>
                            <p className="mt-2 text-lg font-semibold text-white">{riskLevel.toUpperCase()}</p>
                            <p className="text-sm text-blue-100">Based on the latest checkup insights</p>
                        </div>
                    </div>
                </div>
            </section>

            {isLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow" role="status">
                    Refreshing your personalised data…
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow">
                    {errorMessage}
                </div>
            )}

            <section id="dashboard" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Dashboard</p>
                        <h2 className="text-2xl font-semibold text-gray-900">Medication history</h2>
                        <p className="text-sm text-gray-500">Every dose confirmation and missed intake recorded on your MediBox.</p>
                    </div>
                    <span className="rounded-full bg-blue-500 bg-opacity-10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-500">
                        {Array.isArray(adherenceLogs) ? adherenceLogs.length : 0}
                        {' '}
                        entries
                    </span>
                </div>
                <AdherenceLogs logs={adherenceLogs} loading={logsLoading} />
            </section>

            <section id="schedule" className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Schedule</p>
                        <h2 className="text-2xl font-semibold text-gray-900">Upcoming reminders & alerts</h2>
                        <p className="text-sm text-gray-500">Stay informed about upcoming doses and track alerts for missed medication.</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p>Upcoming today: <span className="font-semibold text-gray-900">{reminderInsights.upcomingToday}</span></p>
                        <p>Overdue: <span className="font-semibold text-red-600">{reminderInsights.overdue}</span></p>
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <MedicineSchedule
                        reminders={reminders}
                        loading={remindersLoading}
                        onConfirmIntake={handleIntakeConfirmation}
                    />
                    <Alerts alerts={alerts} loading={alertsLoading} />
                </div>
            </section>

            <CheckupForm
                latestHealth={healthStatus}
                defaultHistory={medicalHistory}
                onSubmitted={refetchHealth}
            />

            <section id="profile" className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Profile</p>
                <h2 className="mt-1 text-2xl font-semibold text-gray-900">Health background</h2>
                <p className="mt-2 text-sm text-gray-500">Review your core details used to personalise reminders and checkups.</p>

                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">User ID</dt>
                        <dd className="mt-2 text-sm font-semibold text-gray-900 break-all">{userIdLabel}</dd>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Age</dt>
                        <dd className="mt-2 text-sm font-semibold text-gray-900">{userAgeLabel}</dd>
                    </div>
                </dl>
                <div className="mt-6">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Medical history</dt>
                    <dd className="mt-2 whitespace-pre-line rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">{medicalHistory}</dd>
                </div>
            </section>
        </div>
    );
};

export default UserDashboard;
import React, { useCallback, useMemo } from 'react';
import api from '../api/axios';
import MedicineSchedule from '../components/MedicineSchedule.jsx';
import HealthCheck from '../components/HealthCheck.jsx';
import Alerts from '../components/Alerts.jsx';
import useResource from '../hooks/useResource';

const UserDashboard = () => {
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
                await Promise.all([refetchReminders(), refetchHealth(), refetchAlerts()]);
            } catch (error) {
                console.error('Error logging intake confirmation', error);
            }
        },
        [refetchAlerts, refetchHealth, refetchReminders]
    );

    const isLoading = remindersLoading || healthLoading || alertsLoading;
    const errorMessage = alertsError || remindersError || healthError;

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

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-8 text-white shadow-xl sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-blue-200">Today&apos;s care summary</p>
                        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Welcome back to your MediBox hub</h1>
                        <p className="mt-3 max-w-2xl text-sm text-blue-100">
                            Review upcoming doses, submit your daily health check, and keep adherence on track with live insights.
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
                            <p className="text-sm text-blue-100">Based on the latest health check</p>
                        </div>
                    </div>
                </div>
            </section>

            {isLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow">
                    Refreshing your personalized data…
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow">
                    {errorMessage}
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <Alerts alerts={alerts} loading={alertsLoading} />
                    <MedicineSchedule
                        reminders={reminders}
                        loading={remindersLoading}
                        onConfirmIntake={handleIntakeConfirmation}
                    />
                </div>
                <div className="space-y-6">
                    <HealthCheck healthStatus={healthStatus} onSubmitted={refetchHealth} />
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
                        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s overview</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Snapshot of your adherence activity and reminders.
                        </p>
                        <dl className="mt-4 space-y-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <dt>Scheduled today</dt>
                                <dd className="font-semibold text-gray-900">{reminderInsights.upcomingToday}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Total upcoming</dt>
                                <dd className="font-semibold text-gray-900">{reminderInsights.total}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Overdue doses</dt>
                                <dd className="font-semibold text-red-600">{reminderInsights.overdue}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Alert signals</dt>
                                <dd className="font-semibold text-indigo-600">{alerts?.length || 0}</dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </section>
        </div>
    );
};

export default UserDashboard;
import React, { useMemo } from 'react';
import useResource from '../hooks/useResource';
import Alerts from '../components/Alerts.jsx';
import AdherenceLogs from '../components/AdherenceLogs.jsx';
import RefillRequests from '../components/RefillRequests.jsx';
import MedicineSchedule from '../components/MedicineSchedule.jsx';

const FamilyDashboard = () => {
    const {
        data: alerts = [],
        loading: alertsLoading,
        error: alertsError,
    } = useResource('alerts', 'alerts');

    const {
        data: reminders = [],
        loading: remindersLoading,
        error: remindersError,
    } = useResource('reminders', 'reminders', {
        params: { scope: 'household' },
    });

    const {
        data: adherenceLogs = [],
        loading: adherenceLoading,
        error: adherenceError,
    } = useResource('adherenceLogs', 'adherence/logs', {
        params: { limit: 50 },
    });

    const {
        data: refillRequests = [],
        loading: refillLoading,
        error: refillError,
    } = useResource('refillRequests', 'refill/requests', {
        params: { scope: 'household' },
    });

    const isLoading = remindersLoading || adherenceLoading || refillLoading;
    const errorMessage = alertsError || remindersError || adherenceError || refillError;

    const adherenceStats = useMemo(() => {
        if (!Array.isArray(adherenceLogs) || adherenceLogs.length === 0) {
            return {
                total: 0,
                taken: 0,
                skipped: 0,
                completion: 0,
                lastTimestamp: null,
            };
        }

        const total = adherenceLogs.length;
        const taken = adherenceLogs.filter((log) => {
            const status = (log.status || (log.confirmed ? 'taken' : 'skipped')).toLowerCase();
            return status === 'taken' || status === 'completed';
        }).length;
        const skipped = total - taken;
        const completion = total ? Math.round((taken / total) * 100) : 0;
        const lastTimestamp = adherenceLogs[0]?.date || adherenceLogs[0]?.taken_at || null;

        return {
            total,
            taken,
            skipped,
            completion,
            lastTimestamp,
        };
    }, [adherenceLogs]);

    const refillStats = useMemo(() => {
        const pending = refillRequests.filter((request) => (request.status || '').toLowerCase() === 'pending').length;
        const approved = refillRequests.filter((request) => (request.status || '').toLowerCase() === 'approved').length;
        return { pending, approved };
    }, [refillRequests]);

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-8 text-white shadow-xl sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-200">Household adherence pulse</p>
                        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Coordinate care across the family</h1>
                        <p className="mt-3 max-w-2xl text-sm text-emerald-100">
                            Monitor reminders, intake activity, and refill requests for every connected member in one view.
                        </p>
                    </div>
                    <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
                        <div className="rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-widest text-emerald-100">Completion rate</p>
                            <p className="mt-2 text-3xl font-semibold">{adherenceStats.completion}%</p>
                            <p className="text-xs text-emerald-100">Across {adherenceStats.total} recent logs</p>
                        </div>
                        <div className="rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-widest text-emerald-100">Pending refills</p>
                            <p className="mt-2 text-3xl font-semibold">{refillStats.pending}</p>
                            <p className="text-xs text-emerald-100">Approved: {refillStats.approved}</p>
                        </div>
                    </div>
                </div>
            </section>

            {isLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow">
                    Loading household data…
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
                    <AdherenceLogs logs={adherenceLogs} loading={adherenceLoading} />
                </div>
                <div className="space-y-6">
                    <MedicineSchedule reminders={reminders} loading={remindersLoading} />
                    <RefillRequests requests={refillRequests} loading={refillLoading} />
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
                        <h2 className="text-lg font-semibold text-gray-900">Household snapshot</h2>
                        <dl className="mt-4 space-y-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <dt>Total reminders queued</dt>
                                <dd className="font-semibold text-gray-900">{reminders.length}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Doses taken</dt>
                                <dd className="font-semibold text-emerald-600">{adherenceStats.taken}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Doses skipped</dt>
                                <dd className="font-semibold text-red-500">{adherenceStats.skipped}</dd>
                            </div>
                            {adherenceStats.lastTimestamp && (
                                <div className="flex flex-col text-xs text-gray-500">
                                    <dt className="uppercase tracking-wide">Last activity</dt>
                                    <dd>
                                        {(() => {
                                            const parsed = new Date(adherenceStats.lastTimestamp);
                                            if (Number.isNaN(parsed.getTime())) {
                                                return adherenceStats.lastTimestamp;
                                            }
                                            return parsed.toLocaleString();
                                        })()}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                </div>
            </section>
        </div>
    );
};

export default FamilyDashboard;
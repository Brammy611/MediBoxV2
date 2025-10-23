import React, { useCallback, useMemo } from 'react';
import RefillRequests from '../components/RefillRequests.jsx';
import AdherenceLogs from '../components/AdherenceLogs.jsx';
import PharmacistPanel from '../components/PharmacistPanel.jsx';
import Alerts from '../components/Alerts.jsx';
import useResource from '../hooks/useResource';
import api from '../api/axios';

const PharmacistDashboard = () => {
    const {
        data: alerts = [],
        loading: alertsLoading,
        error: alertsError,
    } = useResource('alerts', 'alerts');

    const {
        data: refillRequests = [],
        loading: refillLoading,
        error: refillError,
        refetch: refetchRefills,
    } = useResource('refillRequests', 'refill/requests', {
        params: { scope: 'managed' },
    });

    const {
        data: adherenceLogs = [],
        loading: adherenceLoading,
        error: adherenceError,
    } = useResource('adherenceLogs', 'adherence/logs', {
        params: { limit: 100, scope: 'managed' },
    });

    const {
        data: medicines = [],
        loading: medicinesLoading,
        error: medicinesError,
        refetch: refetchMedicines,
    } = useResource('medicines', 'medicines', {
        params: { scope: 'managed' },
    });

    const handleMedicineUpdate = useCallback(
        async (medicineId, payload) => {
            if (!medicineId) {
                return;
            }
            try {
                await api.put(`medicines/${medicineId}`, payload);
                await refetchMedicines();
            } catch (error) {
                console.error('Error updating medicine', error);
            }
        },
        [refetchMedicines]
    );

    const handleRefillAction = useCallback(
        async (requestId, action) => {
            try {
                await api.post(`refill/requests/${requestId}/${action}`);
                await refetchRefills();
            } catch (error) {
                console.error('Error processing refill request', error);
            }
        },
        [refetchRefills]
    );

    const isLoading = refillLoading || adherenceLoading || medicinesLoading || alertsLoading;
    const errorMessage = alertsError || refillError || adherenceError || medicinesError;

    const metrics = useMemo(() => {
        const refillItems = Array.isArray(refillRequests) ? refillRequests : [];
        const medicineItems = Array.isArray(medicines) ? medicines : [];
        const alertItems = Array.isArray(alerts) ? alerts : [];

        const pending = refillItems.filter((request) => (request.status || '').toLowerCase() === 'pending').length;
        const approved = refillItems.filter((request) => (request.status || '').toLowerCase() === 'approved').length;
        const totalInventory = medicineItems.length;
        const activeAlerts = alertItems.length;
        return { pending, approved, totalInventory, activeAlerts };
    }, [alerts, medicines, refillRequests]);

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 px-6 py-8 text-white shadow-xl sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-indigo-200">Pharmacy operations</p>
                        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Stay ahead of refill demand</h1>
                        <p className="mt-3 max-w-2xl text-sm text-indigo-100">
                            Track refill queues, monitor patient adherence, and keep the virtual shelf updated in real time.
                        </p>
                    </div>
                    <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
                        <div className="rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-widest text-indigo-100">Pending refills</p>
                            <p className="mt-2 text-3xl font-semibold">{metrics.pending}</p>
                            <p className="text-xs text-indigo-100">Approved: {metrics.approved}</p>
                        </div>
                        <div className="rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-widest text-indigo-100">Inventory monitored</p>
                            <p className="mt-2 text-3xl font-semibold">{metrics.totalInventory}</p>
                            <p className="text-xs text-indigo-100">Active alerts: {metrics.activeAlerts}</p>
                        </div>
                    </div>
                </div>
            </section>

            {isLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow">
                    Syncing pharmacist workspace…
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow">
                    {errorMessage}
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <RefillRequests
                        requests={refillRequests}
                        loading={refillLoading}
                        onAction={handleRefillAction}
                    />
                    <AdherenceLogs logs={adherenceLogs} loading={adherenceLoading} />
                </div>
                <div className="space-y-6">
                    <PharmacistPanel
                        medicines={medicines}
                        loading={medicinesLoading}
                        onUpdateMedicine={handleMedicineUpdate}
                    />
                    <Alerts alerts={alerts} loading={alertsLoading} />
                </div>
            </section>
        </div>
    );
};

export default PharmacistDashboard;
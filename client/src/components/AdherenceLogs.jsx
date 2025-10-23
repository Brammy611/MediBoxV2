import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const toneByStatus = {
    taken: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    skipped: 'bg-red-100 text-red-700',
    missed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};

const AdherenceLogs = ({ logs, loading }) => {
    const items = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" aria-live="polite">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Adherence logs</h2>
                {loading && <span className="text-xs uppercase tracking-wide text-blue-500">Updating…</span>}
            </div>

            {!loading && items.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">No adherence activity recorded yet. Logs will appear as soon as intakes are confirmed.</p>
            )}

            {loading && items.length === 0 && (
                <div className="mt-4 space-y-2">
                    <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
            )}

            {items.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Medicine</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.map((log) => {
                                const status = (log.status || (log.confirmed ? 'taken' : 'skipped')).toLowerCase();
                                const tone = toneByStatus[status] || 'bg-blue-100 text-blue-700';
                                const timestamp = log.date || log.taken_at;
                                return (
                                    <tr
                                        key={log.id || log._id || `${timestamp}-${log.medicine || log.medicine_name}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                                            {(() => {
                                                if (!timestamp) {
                                                    return '—';
                                                }
                                                const parsed = new Date(timestamp);
                                                if (Number.isNaN(parsed.getTime())) {
                                                    return timestamp;
                                                }
                                                return parsed.toLocaleString();
                                            })()}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                                            {log.medicine || log.medicine_name || 'Not specified'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                                            {log.box_id ? `Box ${log.box_id}` : log.user_id ? `User ${log.user_id}` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

AdherenceLogs.propTypes = {
    logs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        taken_at: PropTypes.string,
        medicine: PropTypes.string,
        medicine_name: PropTypes.string,
        status: PropTypes.string,
        confirmed: PropTypes.bool,
    })),
    loading: PropTypes.bool,
};

AdherenceLogs.defaultProps = {
    logs: [],
    loading: false,
};

export default AdherenceLogs;
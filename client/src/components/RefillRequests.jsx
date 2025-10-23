import React from 'react';
import PropTypes from 'prop-types';

const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    awaiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    fulfilled: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    denied: 'bg-red-100 text-red-700 border-red-200',
};

const RefillRequests = ({ requests, loading, onAction }) => {
    const items = Array.isArray(requests) ? requests : [];

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Refill requests</h2>
                {loading && <span className="text-xs uppercase tracking-wide text-blue-500">Syncing…</span>}
            </div>

            {!loading && items.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">No refill requests in the queue right now.</p>
            )}

            {loading && items.length === 0 && (
                <div className="mt-4 space-y-2">
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
            )}

            <ul className="mt-4 space-y-3">
                {items.map((request) => {
                    const status = (request.status || 'pending').toLowerCase();
                    const tone = statusStyles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
                    const timestamp = request.requested_at || request.updated_at;
                    const formattedTimestamp = (() => {
                        if (!timestamp) {
                            return null;
                        }
                        const parsed = new Date(timestamp);
                        if (Number.isNaN(parsed.getTime())) {
                            return typeof timestamp === 'string' ? timestamp : null;
                        }
                        return parsed.toLocaleString();
                    })();

                    return (
                        <li
                            key={request.id || request._id || `${request.medicineName}-${request.status}`}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {request.medicineName || request.medicine_name || 'Unnamed medicine'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Requested by {request.requested_by || request.user_id || 'Household'}
                                        {request.quantity ? ` · ${request.quantity} units` : ''}
                                    </p>
                                    {request.notes && (
                                        <p className="mt-1 text-xs text-gray-600">Notes: {request.notes}</p>
                                    )}
                                    {formattedTimestamp && (
                                        <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-gray-400">
                                            {formattedTimestamp}
                                        </p>
                                    )}
                                </div>
                                <span className={`inline-flex h-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
                                    {status}
                                </span>
                            </div>
                            {onAction && status === 'pending' && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onAction(request.id || request._id, 'approve')}
                                        className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onAction(request.id || request._id, 'reject')}
                                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

RefillRequests.propTypes = {
    requests: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        medicineName: PropTypes.string,
        medicine_name: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        notes: PropTypes.string,
        requested_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    })),
    loading: PropTypes.bool,
    onAction: PropTypes.func,
};

RefillRequests.defaultProps = {
    requests: [],
    loading: false,
    onAction: undefined,
};

export default RefillRequests;
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const palette = {
    critical: 'border-red-300 bg-red-50 text-red-700',
    high: 'border-red-300 bg-red-50 text-red-700',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    low: 'border-blue-200 bg-blue-50 text-blue-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
};

const Alerts = ({ alerts, loading }) => {
    const formattedAlerts = useMemo(
        () => (Array.isArray(alerts) ? alerts : []),
        [alerts]
    );

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" aria-live="assertive">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Alerts &amp; signals</h2>
                    <p className="text-xs text-gray-500">Real-time reminders and adherence warnings.</p>
                </div>
                {loading && <span className="text-xs font-medium uppercase tracking-wide text-blue-500">Refreshing…</span>}
            </div>

            {!loading && formattedAlerts.length === 0 && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    Your alerts feed is quiet. Stay consistent and we&apos;ll nudge you when something needs attention.
                </div>
            )}

            {loading && formattedAlerts.length === 0 && (
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
            )}

            <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {formattedAlerts.map((alert) => {
                    const severity = (alert.severity || alert.urgency || 'info').toLowerCase();
                    const tone = palette[severity] || palette.info;
                    const timestamp = alert.timestamp || alert.created_at;
                    const formattedTimestamp = (() => {
                        if (!timestamp) {
                            return null;
                        }
                        const parsed = new Date(timestamp);
                        if (Number.isNaN(parsed.getTime())) {
                            return null;
                        }
                        return parsed.toLocaleString();
                    })();
                    const description = alert.message || alert.description || alert.details || alert.title;

                    return (
                        <li
                            key={alert.id || alert._id || `${alert.title || description}`}
                            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${tone}`}
                        >
                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-current bg-white bg-opacity-40 text-sm font-semibold uppercase">
                                !
                            </span>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                    {alert.title || 'Alert'}
                                </p>
                                {description && <p className="text-xs font-medium opacity-80">{description}</p>}
                                {formattedTimestamp && (
                                    <p className="text-[0.7rem] uppercase tracking-wide opacity-60">
                                        {formattedTimestamp}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

Alerts.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        message: PropTypes.string,
        description: PropTypes.string,
        details: PropTypes.string,
        severity: PropTypes.string,
        urgency: PropTypes.string,
        timestamp: PropTypes.string,
        created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    })),
    loading: PropTypes.bool,
};

Alerts.defaultProps = {
    alerts: [],
    loading: false,
};

export default Alerts;
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const MedicineSchedule = ({ reminders, loading, onUpdateStatus }) => {
    const items = useMemo(() => (Array.isArray(reminders) ? reminders : []), [reminders]);

    const formatTime = (value) => {
        if (!value) {
            return 'Time TBD';
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const now = new Date();

    if (loading && items.length === 0) {
        return (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" aria-label="Medicine schedule loading">
                <h2 className="text-lg font-semibold text-gray-900">Medicine schedule</h2>
                <div className="mt-4 space-y-3">
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
            </section>
        );
    }

    if (items.length === 0) {
        return (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center shadow" aria-label="Empty medicine schedule">
                <h2 className="text-lg font-semibold text-gray-900">Medicine schedule</h2>
                <p className="mt-2 text-sm text-gray-500">
                    No upcoming reminders yet. Once prescriptions are synced, they will appear here automatically.
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" aria-label="Medicine schedule">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Medicine schedule</h2>
                <p className="text-xs uppercase tracking-wide text-gray-400">Chronological timeline</p>
            </div>
            <ul className="mt-4 space-y-3">
                {items.map((reminder) => {
                    const timeLabel = reminder.scheduled_time || reminder.time || reminder.reminder_time;
                    const timelineTime = formatTime(timeLabel);
                    const doseLabel = reminder.dosage || reminder.dose || reminder.quantity || 'As prescribed';
                    const isOverdue = (() => {
                        const parsed = new Date(timeLabel);
                        return !Number.isNaN(parsed.getTime()) && parsed < now;
                    })();

                    return (
                        <li
                            key={reminder.id || reminder._id || `${reminder.name}-${timeLabel}`}
                            className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                        >
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                isOverdue ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                            }`}
                            >
                                {timelineTime.replace(/[^0-9]/g, '').slice(0, 2) || '⏰'}
                            </div>
                            <div className="flex flex-1 flex-col gap-1">
                                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{reminder.medicine_name || reminder.name || 'Scheduled dose'}</p>
                                        <p className="text-xs text-gray-500">{timelineTime} · {doseLabel}</p>
                                    </div>
                                    {onUpdateStatus && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onUpdateStatus(reminder, 'taken')}
                                                className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                            >
                                                Mark taken
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onUpdateStatus(reminder, 'missed')}
                                                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                            >
                                                Mark missed
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {reminder.notes && (
                                    <p className="text-xs text-gray-600">Notes: {reminder.notes}</p>
                                )}
                            </div>
                            {isOverdue && (
                                <span className="rounded-full bg-red-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-red-600">
                                    Overdue
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

MedicineSchedule.propTypes = {
    reminders: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        medicine_name: PropTypes.string,
        name: PropTypes.string,
        scheduled_time: PropTypes.string,
        time: PropTypes.string,
        dosage: PropTypes.string,
        dose: PropTypes.string,
    })),
    loading: PropTypes.bool,
    onUpdateStatus: PropTypes.func,
};

MedicineSchedule.defaultProps = {
    reminders: [],
    loading: false,
    onUpdateStatus: undefined,
};

export default MedicineSchedule;
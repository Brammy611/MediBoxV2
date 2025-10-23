import React from 'react';
import PropTypes from 'prop-types';

const resolveSchedule = (schedule) => {
    if (!schedule) {
        return 'Not scheduled';
    }
    if (Array.isArray(schedule)) {
        return schedule.join(', ');
    }
    if (typeof schedule === 'object') {
        return Object.values(schedule).join(', ');
    }
    return schedule;
};

const PharmacistPanel = ({ medicines, loading, onUpdateMedicine }) => {
    const items = Array.isArray(medicines) ? medicines : [];

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Medicine catalogue</h2>
                {loading && <span className="text-xs uppercase tracking-wide text-blue-500">Loading…</span>}
            </div>

            {!loading && items.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">No medicines registered yet. Add inventories from the admin console to populate this list.</p>
            )}

            {loading && items.length === 0 && (
                <div className="mt-4 space-y-2">
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
            )}

            <ul className="mt-4 space-y-3">
                {items.map((medicine) => (
                    <li
                        key={medicine.id || medicine._id || medicine.name}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{medicine.name}</p>
                                <p className="text-xs text-gray-500">Dose: {medicine.dose || medicine.dosage || 'Not specified'}</p>
                                <p className="text-xs text-gray-500">Schedule: {resolveSchedule(medicine.schedule)}</p>
                                {medicine.notes && (
                                    <p className="mt-1 text-xs text-gray-600">Notes: {medicine.notes}</p>
                                )}
                            </div>
                            {onUpdateMedicine && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextDose = window.prompt(
                                                'Update dose',
                                                medicine.dose || medicine.dosage || ''
                                            );
                                            if (nextDose === null) {
                                                return;
                                            }
                                            const nextNotes = window.prompt(
                                                'Update notes',
                                                medicine.notes || ''
                                            );
                                            if (nextNotes === null) {
                                                return;
                                            }
                                            onUpdateMedicine(medicine.id || medicine._id, {
                                                dose: nextDose,
                                                notes: nextNotes,
                                            });
                                        }}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Update
                                    </button>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

PharmacistPanel.propTypes = {
    medicines: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        dose: PropTypes.string,
        dosage: PropTypes.string,
        schedule: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
            PropTypes.object,
            PropTypes.string,
        ]),
        notes: PropTypes.string,
    })),
    loading: PropTypes.bool,
    onUpdateMedicine: PropTypes.func,
};

PharmacistPanel.defaultProps = {
    medicines: [],
    loading: false,
    onUpdateMedicine: undefined,
};

export default PharmacistPanel;

import React, { useCallback } from 'react';
import Alerts from '../../components/Alerts.jsx';
import MedicineSchedule from '../../components/MedicineSchedule.jsx';
import useResource from '../../hooks/useResource';
import api from '../../api/axios';

const SchedulePage = () => {
	const {
		data: scheduleData,
		loading,
		error,
		refetch,
	} = useResource('userSchedule', 'users/schedule', {
		transform: (payload) => ({
			schedule: Array.isArray(payload?.schedule) ? payload.schedule : [],
			alerts: Array.isArray(payload?.alerts) ? payload.alerts : [],
			stats: payload?.stats || {},
			generatedAt: payload?.generated_at,
		}),
	});

	const reminders = scheduleData?.schedule || [];
	const alerts = scheduleData?.alerts || [];
	const stats = scheduleData?.stats || {};

	const nextReminderLabel = stats.nextReminderTime
		? (() => {
			const parsed = new Date(stats.nextReminderTime);
			return Number.isNaN(parsed.getTime()) ? stats.nextReminderTime : parsed.toLocaleString();
		})()
		: 'Nothing scheduled';

	const nextReminderName = stats.nextReminderName || 'All caught up';
	const upcomingCount = stats.upcoming ?? reminders.length;
	const missedCount = stats.missed ?? 0;
	const totalCount = stats.total ?? reminders.length;

	const handleUpdateStatus = useCallback(
		async (reminder, status) => {
			const identifier = reminder.schedule_id || reminder.id || reminder._id;
			if (!identifier) {
				return;
			}
			try {
				await api.put('users/schedule/update', {
					scheduleId: identifier,
					status,
				});
				await refetch();
			} catch (err) {
				console.error('Failed to update schedule entry', err);
			}
		},
		[refetch],
	);

	return (
		<div className="space-y-6" id="schedule">
			<section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 px-6 py-8 text-white shadow-xl sm:px-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Medication schedule</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Stay on top of upcoming doses</h1>
						<p className="mt-3 max-w-2xl text-sm text-blue-100">
							Review your timetable, monitor overdue doses, and action any alerts that need your attention.
						</p>
					</div>
					<div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
						<div className="rounded-2xl border border-white/40 bg-white/10 p-4 text-sm shadow-lg">
							<p className="text-xs uppercase tracking-wide text-blue-100">Next reminder</p>
							<p className="mt-2 text-lg font-semibold">{nextReminderName}</p>
							<p className="text-xs text-blue-100">{nextReminderLabel}</p>
						</div>
						<div className="rounded-2xl border border-white/40 bg-white/10 p-4 text-sm shadow-lg">
							<p className="text-xs uppercase tracking-wide text-blue-100">Alerts</p>
							<p className="mt-2 text-lg font-semibold">{alerts.length}</p>
							<p className="text-xs text-blue-100">{missedCount} overdue doses detected</p>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-5 text-gray-200">
					<p className="text-xs uppercase tracking-wide text-gray-400">Upcoming</p>
					<p className="mt-2 text-2xl font-semibold text-white">{upcomingCount}</p>
				</div>
				<div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-red-100">
					<p className="text-xs uppercase tracking-wide text-red-200">Missed</p>
					<p className="mt-2 text-2xl font-semibold text-white">{missedCount}</p>
				</div>
				<div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-5 text-blue-100">
					<p className="text-xs uppercase tracking-wide text-blue-200">Total scheduled</p>
					<p className="mt-2 text-2xl font-semibold text-white">{totalCount}</p>
				</div>
			</section>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			{loading && (
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
					Syncing schedule…
				</div>
			)}

			<MedicineSchedule
				reminders={reminders}
				loading={loading}
				onUpdateStatus={handleUpdateStatus}
			/>

			<Alerts alerts={alerts} loading={loading} />
		</div>
	);
};

export default SchedulePage;

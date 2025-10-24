import React, { useCallback, useMemo } from 'react';
import Alerts from '../../components/Alerts.jsx';
import MedicineSchedule from '../../components/MedicineSchedule.jsx';
import useResource from '../../hooks/useResource';
import api from '../../api/axios';

const SchedulePage = () => {
	const {
		data: reminders = [],
		loading: remindersLoading,
		error: remindersError,
		refetch: refetchReminders,
	} = useResource('reminders', 'reminders', {
		params: { scope: 'active' },
	});

	const {
		data: alerts = [],
		loading: alertsLoading,
		error: alertsError,
		refetch: refetchAlerts,
	} = useResource('alerts', 'alerts');

	const { refetch: refetchHealthReports } = useResource('healthReports', 'health/reports', {
		params: { limit: 1 },
		transform: (data) => (Array.isArray(data) ? data : [data].filter(Boolean)),
		auto: false,
	});

	const insights = useMemo(() => {
		const parseDate = (value) => {
			if (!value) {
				return null;
			}
			const parsed = new Date(value);
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		};

		const enriched = (Array.isArray(reminders) ? reminders : [])
			.map((reminder) => ({
				...reminder,
				scheduledAt: parseDate(reminder.time || reminder.scheduled_time || reminder.reminder_time),
			}))
			.filter((reminder) => reminder.scheduledAt instanceof Date)
			.sort((a, b) => a.scheduledAt - b.scheduledAt);

		const now = new Date();
		const nextReminder = enriched.find((entry) => entry.scheduledAt && entry.scheduledAt >= now) || enriched[0] || null;
		const overdue = enriched.filter((entry) => entry.scheduledAt && entry.scheduledAt < now).length;
		const upcoming = enriched.filter((entry) => entry.scheduledAt && entry.scheduledAt >= now).length;

		return {
			nextReminder,
			overdue,
			upcoming,
			total: enriched.length,
		};
	}, [reminders]);

	const nextReminderLabel = insights.nextReminder?.scheduledAt
		? insights.nextReminder.scheduledAt.toLocaleString()
		: 'Nothing scheduled';

	const nextReminderName = insights.nextReminder?.medicine_name
		|| insights.nextReminder?.name
		|| insights.nextReminder?.message
		|| 'All caught up';

	const errorMessage = remindersError || alertsError;
	const isLoading = remindersLoading || alertsLoading;

	const handleConfirmIntake = useCallback(
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
					refetchAlerts(),
					refetchHealthReports(),
				]);
			} catch (err) {
				console.error('Failed to log intake confirmation', err);
			}
		},
		[refetchAlerts, refetchHealthReports, refetchReminders],
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
							<p className="mt-2 text-lg font-semibold">{Array.isArray(alerts) ? alerts.length : 0}</p>
							<p className="text-xs text-blue-100">{insights.overdue} overdue doses detected</p>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-5 text-gray-200">
					<p className="text-xs uppercase tracking-wide text-gray-400">Upcoming</p>
					<p className="mt-2 text-2xl font-semibold text-white">{insights.upcoming}</p>
				</div>
				<div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-red-100">
					<p className="text-xs uppercase tracking-wide text-red-200">Missed</p>
					<p className="mt-2 text-2xl font-semibold text-white">{insights.overdue}</p>
				</div>
				<div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-5 text-blue-100">
					<p className="text-xs uppercase tracking-wide text-blue-200">Total scheduled</p>
					<p className="mt-2 text-2xl font-semibold text-white">{insights.total}</p>
				</div>
			</section>

			{errorMessage && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
					{errorMessage}
				</div>
			)}

			{isLoading && (
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
					Syncing schedule…
				</div>
			)}

			<MedicineSchedule
				reminders={reminders}
				loading={remindersLoading}
				onConfirmIntake={handleConfirmIntake}
			/>

			<Alerts alerts={alerts} loading={alertsLoading} />
		</div>
	);
};

export default SchedulePage;

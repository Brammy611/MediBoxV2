import React, { useMemo } from 'react';
import AdherenceLogs from '../../components/AdherenceLogs.jsx';
import useResource from '../../hooks/useResource';

const DashboardPage = () => {
	const {
		data: logs = [],
		loading,
		error,
		refetch,
	} = useResource('adherenceLogs', 'adherence/logs', {
		params: { limit: 100 },
	});

	const summary = useMemo(() => {
		const safeLogs = Array.isArray(logs) ? logs : [];
		const parseDate = (value) => {
			if (!value) {
				return null;
			}
			const parsed = new Date(value);
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		};

		const sorted = safeLogs
			.map((entry) => ({
				...entry,
				timestamp: parseDate(entry.taken_at || entry.date),
			}))
			.sort((a, b) => {
				if (a.timestamp && b.timestamp) {
					return b.timestamp - a.timestamp;
				}
				if (a.timestamp) {
					return -1;
				}
				if (b.timestamp) {
					return 1;
				}
				return 0;
			});

		const totals = safeLogs.reduce(
			(acc, entry) => {
				const status = (entry.status || (entry.confirmed ? 'taken' : 'missed')).toLowerCase();
				acc.total += 1;
				if (status === 'taken' || status === 'completed') {
					acc.completed += 1;
				} else if (status === 'missed' || status === 'skipped') {
					acc.missed += 1;
				} else {
					acc.pending += 1;
				}
				return acc;
			},
			{ total: safeLogs.length, completed: 0, missed: 0, pending: 0 },
		);

		return {
			...totals,
			lastEvent: sorted[0] || null,
		};
	}, [logs]);

	const lastEventLabel = summary.lastEvent?.timestamp
		? summary.lastEvent.timestamp.toLocaleString()
		: 'No history yet';

	const lastMedicine = summary.lastEvent?.medicine
		|| summary.lastEvent?.medicine_name
		|| summary.lastEvent?.name
		|| summary.lastEvent?.message
		|| '—';

	return (
		<div className="space-y-6" id="dashboard">
			<section className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-8 text-white shadow-xl sm:px-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Medication history</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your recent adherence activity</h1>
						<p className="mt-3 max-w-2xl text-sm text-blue-100">
							Track confirmed doses, catch any missed medicine, and review the latest actions recorded by your MediBox.
						</p>
					</div>
					<div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
						<div className="rounded-2xl border border-white/40 bg-white/10 p-4 text-sm shadow-lg">
							<p className="text-xs uppercase tracking-wide text-blue-100">Last intake</p>
							<p className="mt-2 text-lg font-semibold">{lastMedicine}</p>
							<p className="text-xs text-blue-100">{lastEventLabel}</p>
						</div>
						<div className="rounded-2xl border border-white/40 bg-white/10 p-4 text-sm shadow-lg">
							<p className="text-xs uppercase tracking-wide text-blue-100">Completion rate</p>
							<p className="mt-2 text-lg font-semibold">
								{summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
							</p>
							<p className="text-xs text-blue-100">{summary.completed} of {summary.total} logged doses</p>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-5 text-gray-200">
					<p className="text-xs uppercase tracking-wide text-gray-400">Total entries</p>
					<p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
				</div>
				<div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-emerald-100">
					<p className="text-xs uppercase tracking-wide text-emerald-200">Completed</p>
					<p className="mt-2 text-2xl font-semibold text-white">{summary.completed}</p>
				</div>
				<div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-5 text-red-100">
					<p className="text-xs uppercase tracking-wide text-red-200">Missed</p>
					<p className="mt-2 text-2xl font-semibold text-white">{summary.missed}</p>
				</div>
			</section>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-100">History log</h2>
				<button
					type="button"
					onClick={() => refetch()}
					className="inline-flex items-center rounded-lg border border-blue-500 px-3 py-1.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:text-white"
				>
					Refresh
				</button>
			</div>

			<AdherenceLogs logs={logs} loading={loading} />
		</div>
	);
};

export default DashboardPage;

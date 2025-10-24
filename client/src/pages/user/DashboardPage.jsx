import React, { useMemo } from 'react';
import AdherenceLogs from '../../components/AdherenceLogs.jsx';
import useResource from '../../hooks/useResource';

const HUMIDITY_THRESHOLD = 80;
const TEMPERATURE_THRESHOLD = 30;

const parseDate = (value) => {
	if (!value) {
		return null;
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildTrendPolyline = (series = [], maxValue = 100, height = 80) => {
	if (!Array.isArray(series) || series.length === 0) {
		return '';
	}

	const values = series
		.map((point) => {
			if (typeof point === 'number') {
				return point;
			}
			if (typeof point?.value === 'number') {
				return point.value;
			}
			return Number(point?.value);
		})
		.filter((value) => Number.isFinite(value));

	if (values.length === 0) {
		return '';
	}

	const max = Math.max(...values, maxValue);
	const min = Math.min(...values, 0);
	const range = max - min || 1;

	return values
		.map((value, index) => {
			const x = (index / (values.length - 1 || 1)) * 300;
			const y = height - ((value - min) / range) * height;
			return `${x},${y}`;
		})
		.join(' ');
};

const DashboardPage = () => {
	const {
		data: dashboardData,
		loading,
		error,
		refetch,
	} = useResource('userDashboard', 'users/dashboard', {
		transform: (payload) => ({
			history: Array.isArray(payload?.history) ? payload.history : [],
			boxStatus: payload?.boxStatus || null,
			trend: {
				temperature: Array.isArray(payload?.trend?.temperature) ? payload.trend.temperature : [],
				humidity: Array.isArray(payload?.trend?.humidity) ? payload.trend.humidity : [],
			},
		}),
	});

	const history = dashboardData?.history || [];
	const boxStatus = dashboardData?.boxStatus || null;
	const temperatureTrend = dashboardData?.trend?.temperature || [];
	const humidityTrend = dashboardData?.trend?.humidity || [];

	const summary = useMemo(() => {
		const safeLogs = Array.isArray(history) ? history : [];

		const sorted = safeLogs
			.map((entry) => ({
				...entry,
				timestamp: parseDate(entry.taken_time || entry.taken_at || entry.date),
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
	}, [history]);

	const lastEventLabel = summary.lastEvent?.timestamp
		? summary.lastEvent.timestamp.toLocaleString()
		: 'No history yet';

	const lastMedicine = summary.lastEvent?.medicine
		|| summary.lastEvent?.medicine_name
		|| summary.lastEvent?.name
		|| summary.lastEvent?.message
		|| '—';

	const environmentAlerts = useMemo(() => {
		if (!boxStatus) {
			return [];
		}
		const alerts = [];
		if (typeof boxStatus.humidity === 'number' && boxStatus.humidity > HUMIDITY_THRESHOLD) {
			alerts.push('Humidity is high – consider moving the box to a drier spot.');
		}
		if (typeof boxStatus.temperature === 'number' && boxStatus.temperature > TEMPERATURE_THRESHOLD) {
			alerts.push('Temperature is high – keep the box in a cooler place.');
		}
		if (boxStatus.motion) {
			alerts.push('Recent motion detected – confirm the lid is closed properly.');
		}
		return alerts;
	}, [boxStatus]);

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

			{boxStatus && (
				<section className="grid gap-6 lg:grid-cols-3">
					<div className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-5 text-gray-100">
						<h2 className="text-lg font-semibold text-white">Medicine box condition</h2>
						<p className="mt-1 text-xs text-gray-400">Latest reading updated {parseDate(boxStatus.recorded_at)?.toLocaleString() || 'recently'}</p>
						<dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
							<div>
								<dt className="uppercase tracking-wide text-xs text-gray-400">Humidity</dt>
								<dd className={`mt-1 text-xl font-semibold ${boxStatus.humidity > HUMIDITY_THRESHOLD ? 'text-red-300' : 'text-emerald-300'}`}>
									{boxStatus.humidity ?? '—'}%
								</dd>
							</div>
							<div>
								<dt className="uppercase tracking-wide text-xs text-gray-400">Temperature</dt>
								<dd className={`mt-1 text-xl font-semibold ${boxStatus.temperature > TEMPERATURE_THRESHOLD ? 'text-red-300' : 'text-emerald-300'}`}>
									{boxStatus.temperature ?? '—'}°C
								</dd>
							</div>
							<div>
								<dt className="uppercase tracking-wide text-xs text-gray-400">Light duration</dt>
								<dd className="mt-1 text-xl font-semibold text-blue-300">{boxStatus.light_duration ?? '—'} min</dd>
							</div>
							<div>
								<dt className="uppercase tracking-wide text-xs text-gray-400">Motion</dt>
								<dd className="mt-1 text-xl font-semibold text-blue-300">{boxStatus.motion ? 'Detected' : 'Stable'}</dd>
							</div>
						</dl>
						{environmentAlerts.length > 0 && (
							<ul className="mt-4 space-y-2 text-xs text-red-300">
								{environmentAlerts.map((alert, index) => (
									<li key={`${alert}-${index}`} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
										{alert}
									</li>
								))}
							</ul>
						)}
					</div>
					<div className="lg:col-span-2">
						<div className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-5 text-gray-100">
							<h3 className="text-sm font-semibold text-white">Environment trend (last 24h)</h3>
							<div className="mt-4 overflow-hidden rounded-2xl border border-gray-800 bg-black/30 p-4">
								<svg viewBox="0 0 300 80" className="h-24 w-full">
									<polyline
										fill="none"
										stroke="url(#userTempGradient)"
										strokeWidth="3"
										strokeLinecap="round"
										points={buildTrendPolyline(temperatureTrend, 40)}
									/>
									<polyline
										fill="none"
										stroke="url(#userHumidityGradient)"
										strokeWidth="3"
										strokeLinecap="round"
										points={buildTrendPolyline(humidityTrend, 100)}
									/>
									<defs>
										<linearGradient id="userTempGradient" x1="0" x2="1" y1="0" y2="0">
											<stop offset="0%" stopColor="#f97316" />
											<stop offset="100%" stopColor="#ef4444" />
										</linearGradient>
										<linearGradient id="userHumidityGradient" x1="0" x2="1" y1="1" y2="0">
											<stop offset="0%" stopColor="#38bdf8" />
											<stop offset="100%" stopColor="#0ea5e9" />
										</linearGradient>
									</defs>
								</svg>
								<div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-400">
									<div className="flex items-center gap-2">
										<span className="inline-flex h-2 w-2 rounded-full bg-orange-500" /> Temperature trend
									</div>
									<div className="flex items-center gap-2">
										<span className="inline-flex h-2 w-2 rounded-full bg-sky-500" /> Humidity trend
									</div>
									<div>Updated {parseDate(boxStatus.generated_at)?.toLocaleString() || 'recently'}</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

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

			<AdherenceLogs logs={history} loading={loading} />
		</div>
	);
};

export default DashboardPage;

import React, { useEffect, useMemo } from 'react';
import useResource from '../../hooks/useResource';

const HUMIDITY_THRESHOLD = 80;
const TEMPERATURE_THRESHOLD = 30;

const formatDateTime = (value) => {
	if (!value) return 'Unknown';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}
	return parsed.toLocaleString();
};

const evaluateBoxStatus = (device) => {
	if (!device) {
		return {
			tone: 'border-gray-700 bg-gray-800 text-gray-200',
			message: 'No data received yet',
			alerts: [],
		};
	}

	const alerts = [...(device.alerts || [])];

	if (typeof device.humidity === 'number' && device.humidity > HUMIDITY_THRESHOLD) {
		alerts.push('Too humid — risk of medication spoilage');
	}
	if (typeof device.temperature === 'number' && device.temperature > TEMPERATURE_THRESHOLD) {
		alerts.push('High temperature — move box to a cooler place');
	}
	if (device.motion) {
		alerts.push('Recent movement detected — box may have been opened');
	}

	const severity = alerts.length === 0 ? 'ok' : alerts.length > 1 ? 'critical' : 'warning';

	const tone = {
		ok: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
		warning: 'border-yellow-400 bg-yellow-400/10 text-yellow-200',
		critical: 'border-rose-500 bg-rose-500/10 text-rose-200',
	}[severity];

	const message = severity === 'ok' ? 'Environment within safe thresholds' : alerts[0];

	return {
		tone,
		message,
		alerts,
	};
};

const buildTrendPolyline = (series = [], maxValue = 100, height = 80) => {
	if (!Array.isArray(series) || series.length === 0) {
		return '';
	}

	const normalized = series.map((point) => ({
		value: typeof point.value === 'number' ? point.value : Number(point.value),
	}));

	const values = normalized.map((point) => point.value).filter((value) => Number.isFinite(value));
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

const DashboardFamily = () => {
	const {
		data: history = [],
		loading: historyLoading,
		error: historyError,
		refetch: refetchHistory,
	} = useResource('familyHistory', 'family/history', {
		params: { limit: 50 },
	});

	const {
		data: alerts = [],
		loading: alertsLoading,
		error: alertsError,
		refetch: refetchAlerts,
	} = useResource('familyAlerts', 'family/alerts', {
		params: { limit: 25 },
	});

	const {
		data: boxStatus,
		loading: boxLoading,
		error: boxError,
		refetch: refetchBox,
	} = useResource('familyBoxStatus', 'family/box-status', {
		transform: (normalized, raw) => raw || normalized,
	});

	useEffect(() => {
		const interval = setInterval(() => {
			refetchBox().catch(() => {});
		}, 30000);
		return () => clearInterval(interval);
	}, [refetchBox]);

	const statusDevices = Array.isArray(boxStatus?.devices) ? boxStatus.devices : [];

	const processedHistory = useMemo(() => (Array.isArray(history) ? history : []), [history]);

	const adherenceSummary = useMemo(() => {
		if (processedHistory.length === 0) {
			return {
				total: 0,
				missed: 0,
				delayed: 0,
				onTime: 0,
				onTimePercentage: 0,
				lastDose: null,
			};
		}

		let missed = 0;
		let delayed = 0;
		let onTime = 0;
		const ordered = [...processedHistory].sort((a, b) => {
			const timeA = new Date(a.taken_time || a.scheduled_time || a.created_at || 0).getTime();
			const timeB = new Date(b.taken_time || b.scheduled_time || b.created_at || 0).getTime();
			return timeB - timeA;
		});

		ordered.forEach((entry) => {
			const status = (entry.status || '').toLowerCase();
			if (status.includes('miss')) {
				missed += 1;
				return;
			}
			if (status.includes('delay')) {
				delayed += 1;
				return;
			}
			if (status.includes('late')) {
				delayed += 1;
				return;
			}
			onTime += 1;
		});

		const total = ordered.length;
		const onTimePercentage = total === 0 ? 0 : Math.round((onTime / total) * 100);

		return {
			total,
			missed,
			delayed,
			onTime,
			onTimePercentage,
			lastDose: ordered[0] || null,
		};
	}, [processedHistory]);

	const alertsList = useMemo(() => (Array.isArray(alerts) ? alerts : []), [alerts]);

	const temperatureTrend = boxStatus?.trend?.temperature || [];
	const humidityTrend = boxStatus?.trend?.humidity || [];

	const loading = historyLoading || alertsLoading || boxLoading;
	const unifiedError = historyError || alertsError || boxError;

	return (
		<div className="space-y-8">
			<section className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white shadow-xl sm:px-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-blue-200">Family insight center</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Monitor loved ones in real time</h1>
						<p className="mt-3 max-w-2xl text-sm text-blue-100">
							Review adherence trends, receive alerts for missed doses, and make sure each smart medicine box stays within safe conditions.
						</p>
						<div className="mt-4 flex flex-wrap gap-3 text-xs text-blue-100">
							<button
								type="button"
								onClick={() => {
									refetchHistory().catch(() => {});
									refetchAlerts().catch(() => {});
									refetchBox().catch(() => {});
								}}
								className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-semibold uppercase tracking-wide text-white transition hover:bg-white/25"
							>
								Refresh data
							</button>
							{loading && <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1">Updating…</span>}
						</div>
					</div>
					<div className="grid w-full gap-4 sm:grid-cols-3 lg:w-auto">
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wider text-blue-100">On-time percentage</p>
							<p className="mt-2 text-3xl font-semibold">{adherenceSummary.onTimePercentage}%</p>
							<p className="text-xs text-blue-100">Across {adherenceSummary.total} logged doses</p>
						</div>
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wider text-blue-100">Total missed doses</p>
							<p className="mt-2 text-3xl font-semibold">{adherenceSummary.missed}</p>
							<p className="text-xs text-blue-100">Delayed: {adherenceSummary.delayed}</p>
						</div>
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wider text-blue-100">Last dose taken</p>
							<p className="mt-2 text-lg font-semibold">
								{adherenceSummary.lastDose
									? formatDateTime(adherenceSummary.lastDose.taken_time || adherenceSummary.lastDose.scheduled_time)
									: 'No records'}
							</p>
							<p className="text-xs text-blue-100">
								{adherenceSummary.lastDose?.user_name || adherenceSummary.lastDose?.user?.name || ''}
							</p>
						</div>
					</div>
				</div>
			</section>

			{unifiedError && (
				<div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
					{unifiedError}
				</div>
			)}

			<section className="grid gap-6 xl:grid-cols-3">
				<div className="space-y-6 xl:col-span-2">
					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">Medication history</h2>
								<p className="text-sm text-gray-500">Latest intake activity across all monitored users</p>
							</div>
							<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
								{processedHistory.length} entries
							</span>
						</header>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">User</th>
										<th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">Medication</th>
										<th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">Scheduled</th>
										<th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">Taken</th>
										<th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100 bg-white">
									{processedHistory.length === 0 && (
										<tr>
											<td colSpan={5} className="px-6 py-4 text-center text-gray-500">
												No medication activity recorded yet.
											</td>
										</tr>
									)}
									{processedHistory.map((entry, index) => {
										const status = (entry.status || 'unknown').toLowerCase();
										const statusTone = status.includes('miss')
											? 'text-rose-600 bg-rose-50'
											: status.includes('delay') || status.includes('late')
												? 'text-amber-600 bg-amber-50'
												: 'text-emerald-600 bg-emerald-50';

										return (
											<tr key={`${entry._id || entry.id || 'history'}-${index}`}>
												<td className="whitespace-nowrap px-6 py-4">
													<div className="text-sm font-semibold text-gray-900">
														{entry.user_name || entry.user?.name || 'Unknown user'}
													</div>
													<div className="text-xs text-gray-500">{entry.relationship || entry.user_relationship || ''}</div>
												</td>
												<td className="px-6 py-4">
													<div className="text-sm text-gray-900">{entry.medicine_name || entry.medicine || '—'}</div>
													<div className="text-xs text-gray-500">Dose: {entry.dose || entry.dosage || 'n/a'}</div>
												</td>
												<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{formatDateTime(entry.scheduled_time)}</td>
												<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{formatDateTime(entry.taken_time)}</td>
												<td className="px-6 py-4">
													<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone}`}>
														{status || 'unknown'}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
								<p className="text-sm text-gray-500">Triggered by missed or delayed doses</p>
							</div>
							<span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
								{alertsList.length} active
							</span>
						</header>
						<ul className="divide-y divide-gray-100">
							{alertsList.length === 0 && (
								<li className="px-6 py-5 text-sm text-gray-500">No active alerts — great job keeping everyone on track!</li>
							)}
							{alertsList.map((alert, index) => (
								<li key={`${alert._id || alert.id || 'alert'}-${index}`} className="px-6 py-4">
									<div className="flex items-start justify-between">
										<div>
											<p className="text-sm font-semibold text-gray-900">{alert.title || alert.message || 'Medication alert'}</p>
											<p className="mt-1 text-xs text-gray-500">
												{alert.user_name || alert.user?.name || 'Unknown user'} · {formatDateTime(alert.created_at || alert.timestamp)}
											</p>
										</div>
										<span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
											{(alert.severity || 'warning').toUpperCase()}
										</span>
									</div>
									{alert.details && <p className="mt-2 text-sm text-gray-600">{alert.details}</p>}
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">Medicine box condition</h2>
								<p className="text-sm text-gray-500">Live environment readings from connected devices</p>
							</div>
							<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
								{statusDevices.length} devices
							</span>
						</header>
						<div className="space-y-4 px-6 py-5">
							{statusDevices.length === 0 && (
								<p className="text-sm text-gray-500">No smart boxes linked yet. Pair a device to start monitoring.</p>
							)}
							{statusDevices.map((device, index) => {
								const evaluation = evaluateBoxStatus(device);
								return (
									<div
										key={`${device._id || device.user_id || 'device'}-${index}`}
										className={`rounded-2xl border px-4 py-4 text-sm shadow-inner transition ${evaluation.tone}`}
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-base font-semibold">
													{device.user_name || device.user?.name || 'Unassigned device'}
												</p>
												<p className="text-xs uppercase tracking-wide opacity-80">
													Last updated: {formatDateTime(device.recorded_at)}
												</p>
											</div>
											<div className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
												{device.motion ? 'Motion detected' : 'Stable'}
											</div>
										</div>
										<dl className="mt-4 grid gap-3 sm:grid-cols-4">
											<div>
												<dt className="text-xs uppercase tracking-wide opacity-70">Humidity</dt>
												<dd className="text-base font-semibold">{device.humidity ?? '—'}%</dd>
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wide opacity-70">Temperature</dt>
												<dd className="text-base font-semibold">{device.temperature ?? '—'}°C</dd>
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wide opacity-70">Light duration</dt>
												<dd className="text-base font-semibold">{device.light_duration ?? '—'} min</dd>
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wide opacity-70">Status</dt>
												<dd className="text-sm font-semibold">{evaluation.message}</dd>
											</div>
										</dl>
										{evaluation.alerts.length > 0 && (
											<ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-rose-100">
												{evaluation.alerts.map((alert, idx) => (
													<li key={`${alert}-${idx}`}>{alert}</li>
												))}
											</ul>
										)}
									</div>
								);
							})}
						</div>
						<div className="border-t border-gray-200 px-6 py-5">
							<h3 className="text-sm font-semibold text-gray-900">Environment trend (last 24h)</h3>
							<div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4">
								<svg viewBox="0 0 300 80" className="h-24 w-full">
									<polyline
										fill="none"
										stroke="url(#tempGradient)"
										strokeWidth="3"
										strokeLinecap="round"
										points={buildTrendPolyline(temperatureTrend, 40)}
									/>
									<polyline
										fill="none"
										stroke="url(#humidityGradient)"
										strokeWidth="3"
										strokeLinecap="round"
										points={buildTrendPolyline(humidityTrend, 100)}
									/>
									<defs>
										<linearGradient id="tempGradient" x1="0" x2="1" y1="0" y2="0">
											<stop offset="0%" stopColor="#f97316" />
											<stop offset="100%" stopColor="#ef4444" />
										</linearGradient>
										<linearGradient id="humidityGradient" x1="0" x2="1" y1="1" y2="0">
											<stop offset="0%" stopColor="#38bdf8" />
											<stop offset="100%" stopColor="#0ea5e9" />
										</linearGradient>
									</defs>
								</svg>
								<div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-500">
									<div className="flex items-center gap-2">
										<span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
										Temperature trend
									</div>
									<div className="flex items-center gap-2">
										<span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
										Humidity trend
									</div>
									<div>Updated {formatDateTime(boxStatus?.generated_at)}</div>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">Key metrics</h2>
								<p className="text-sm text-gray-500">Quick snapshot of adherence across the household</p>
							</div>
						</header>
						<dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
							<div className="rounded-2xl bg-blue-50/80 p-4">
								<dt className="text-xs font-semibold uppercase tracking-wide text-blue-600">On-time doses</dt>
								<dd className="mt-2 text-2xl font-semibold text-blue-900">{adherenceSummary.onTime}</dd>
							</div>
							<div className="rounded-2xl bg-rose-50/80 p-4">
								<dt className="text-xs font-semibold uppercase tracking-wide text-rose-600">Missed doses</dt>
								<dd className="mt-2 text-2xl font-semibold text-rose-900">{adherenceSummary.missed}</dd>
							</div>
							<div className="rounded-2xl bg-amber-50/80 p-4">
								<dt className="text-xs font-semibold uppercase tracking-wide text-amber-600">Delayed doses</dt>
								<dd className="mt-2 text-2xl font-semibold text-amber-900">{adherenceSummary.delayed}</dd>
							</div>
							<div className="rounded-2xl bg-emerald-50/80 p-4">
								<dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total records</dt>
								<dd className="mt-2 text-2xl font-semibold text-emerald-900">{adherenceSummary.total}</dd>
							</div>
						</dl>
					</div>
				</div>
			</section>
		</div>
	);
};

export default DashboardFamily;


import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import useResource from '../../hooks/useResource';
import CheckupForm from '../../components/CheckupForm.jsx';

const CheckupPage = () => {
	const { user } = useAuth();

	const {
		data: historyData,
		loading,
		error,
		refetch,
	} = useResource('userCheckupHistory', 'users/checkup/history', {
		params: { limit: 1 },
		transform: (payload) => {
			if (Array.isArray(payload)) {
				return payload;
			}
			if (Array.isArray(payload?.items)) {
				return payload.items;
			}
			return payload ? [payload] : [];
		},
	});

	const { data: profileData } = useResource('userProfile', 'users/profile', {
		transform: (payload) => payload || {},
	});

	const latestEntry = Array.isArray(historyData) && historyData.length > 0 ? historyData[0] : null;
	const medicalHistory = profileData?.medicalHistory
		|| profileData?.medical_history
		|| user?.medical_history
		|| user?.profile?.medical_history
		|| user?.medicalHistory
		|| '';

	return (
		<div className="space-y-6" id="checkup">
			<section className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 px-6 py-8 text-white shadow-xl sm:px-8">
				<div className="flex flex-col gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Daily checkup</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Answer a quick wellbeing questionnaire</h1>
						<p className="mt-3 max-w-3xl text-sm text-indigo-100">
							Questions adapt based on your medical history and any complaints you share today. Submit your responses to refresh personalised recommendations.
						</p>
					</div>
					{latestEntry && (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm shadow-lg">
								<p className="text-xs uppercase tracking-wide text-indigo-100">Adherence risk</p>
								<p className="mt-2 text-lg font-semibold">
									{(latestEntry.risk || latestEntry.risk_level || 'N/A').toUpperCase()}
								</p>
							</div>
							{latestEntry.created_at && (
								<div className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm shadow-lg">
									<p className="text-xs uppercase tracking-wide text-indigo-100">Last update</p>
									<p className="mt-2 text-lg font-semibold">
										{(() => {
											const parsed = new Date(latestEntry.created_at || latestEntry.date);
											return Number.isNaN(parsed.getTime()) ? latestEntry.created_at : parsed.toLocaleString();
										})()}
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			{loading && (
				<div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
					Loading latest recommendations…
				</div>
			)}

			<CheckupForm
				latestEntry={latestEntry}
				defaultHistory={medicalHistory}
				onComplete={refetch}
			/>
		</div>
	);
};

export default CheckupPage;

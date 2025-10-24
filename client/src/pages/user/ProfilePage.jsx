import React, { useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';

const ProfilePage = () => {
	const { user } = useAuth();

	const computedAge = useMemo(() => {
		if (!user) {
			return 'Not provided';
		}
		if (typeof user.age === 'number') {
			return user.age;
		}
		const birthDate = user.date_of_birth || user.dob;
		if (!birthDate) {
			return 'Not provided';
		}
		const parsed = new Date(birthDate);
		if (Number.isNaN(parsed.getTime())) {
			return 'Not provided';
		}
		const diff = Date.now() - parsed.getTime();
		const ageDate = new Date(diff);
		return Math.abs(ageDate.getUTCFullYear() - 1970);
	}, [user]);

	const medicalHistoryItems = useMemo(() => {
		const raw = user?.medical_history
			|| user?.profile?.medical_history
			|| user?.medicalHistory
			|| user?.profile?.history
			|| '';

		if (!raw) {
			return [];
		}
		if (Array.isArray(raw)) {
			return raw.filter(Boolean);
		}
		return raw
			.split(/[,;\n]/)
			.map((entry) => entry.trim())
			.filter(Boolean);
	}, [user]);

	const createdAtLabel = useMemo(() => {
		if (!user?.created_at) {
			return 'Not available';
		}
		const parsed = new Date(user.created_at);
		if (Number.isNaN(parsed.getTime())) {
			return user.created_at;
		}
		return parsed.toLocaleString();
	}, [user?.created_at]);

	return (
		<div className="space-y-6" id="profile">
			<section className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black px-6 py-8 text-gray-100 shadow-xl sm:px-8">
				<div className="flex flex-col gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-widest text-slate-300">User profile</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Personal health overview</h1>
						<p className="mt-3 max-w-3xl text-sm text-slate-300">
							Review your account identifiers and the medical history we use to tailor reminders and health checkups.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
							<p className="text-xs uppercase tracking-wide text-slate-300">User ID</p>
							<p className="mt-2 text-lg font-semibold">{user?.id || 'Unknown'}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
							<p className="text-xs uppercase tracking-wide text-slate-300">Age</p>
							<p className="mt-2 text-lg font-semibold">{computedAge}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
							<p className="text-xs uppercase tracking-wide text-slate-300">Role</p>
							<p className="mt-2 text-lg font-semibold">{user?.role || 'user'}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
							<p className="text-xs uppercase tracking-wide text-slate-300">Member since</p>
							<p className="mt-2 text-lg font-semibold">{createdAtLabel}</p>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-6 text-gray-100">
				<h2 className="text-lg font-semibold">Contact &amp; login details</h2>
				<dl className="mt-4 space-y-3 text-sm text-gray-300">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
						<dt className="font-medium text-gray-400">Name</dt>
						<dd className="text-gray-100">{user?.full_name || user?.name || user?.username || 'Not provided'}</dd>
					</div>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
						<dt className="font-medium text-gray-400">Email</dt>
						<dd className="text-gray-100">{user?.email || 'Not provided'}</dd>
					</div>
				</dl>
			</section>

			<section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-6 text-gray-100">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Medical history</h2>
					<span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
						{medicalHistoryItems.length} entries
					</span>
				</div>
				{medicalHistoryItems.length === 0 ? (
					<p className="mt-3 text-sm text-gray-400">
						No medical history has been recorded yet. Update your profile or share details with your healthcare provider to personalise reminders.
					</p>
				) : (
					<ul className="mt-4 space-y-2 text-sm text-gray-200">
						{medicalHistoryItems.map((item, index) => (
							<li key={`${item}-${index}`} className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-3">
								{item}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

export default ProfilePage;

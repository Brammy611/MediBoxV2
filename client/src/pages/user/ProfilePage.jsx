import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import useResource from '../../hooks/useResource';
import api from '../../api/axios';

const normalizeList = (value) => {
	if (!value) {
		return [];
	}
	if (Array.isArray(value)) {
		return value.filter(Boolean);
	}
	return value
		.split(/[,;\n]/)
		.map((entry) => entry.trim())
		.filter(Boolean);
};

const ProfilePage = () => {
	const { user, setAuth } = useAuth();

	const {
		data: profileData,
		loading,
		error,
		refetch,
	} = useResource('userProfile', 'users/profile', {
		transform: (payload) => payload || {},
	});

	const profile = profileData || {};

	const [formState, setFormState] = useState({
		medicalHistory: normalizeList(profile.medicalHistory).join('\n'),
		currentConditions: normalizeList(profile.currentConditions).join('\n'),
	});
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	useEffect(() => {
		setFormState({
			medicalHistory: normalizeList(profile.medicalHistory || profile.medical_history).join('\n'),
			currentConditions: normalizeList(profile.currentConditions || profile.conditions).join('\n'),
		});
	}, [profile.medicalHistory, profile.medical_history, profile.currentConditions, profile.conditions]);

	const computedAge = useMemo(() => {
		const sourceAge = profile.age ?? user?.age;
		if (typeof sourceAge === 'number') {
			return sourceAge;
		}
		const birthDate = profile.dateOfBirth || profile.date_of_birth || user?.date_of_birth || user?.dob;
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
	}, [profile.age, profile.dateOfBirth, profile.date_of_birth, user?.age, user?.date_of_birth, user?.dob]);

	const medicalHistoryItems = useMemo(
		() => normalizeList(profile.medicalHistory || profile.medical_history || user?.medical_history),
		[profile.medicalHistory, profile.medical_history, user?.medical_history],
	);

	const conditionsList = useMemo(
		() => normalizeList(profile.currentConditions || profile.conditions),
		[profile.currentConditions, profile.conditions],
	);

	const createdAtLabel = useMemo(() => {
		const source = profile.createdAt || profile.created_at || user?.created_at;
		if (!source) {
			return 'Not available';
		}
		const parsed = new Date(source);
		if (Number.isNaN(parsed.getTime())) {
			return source;
		}
		return parsed.toLocaleString();
	}, [profile.createdAt, profile.created_at, user?.created_at]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setSubmitError(null);
		setSubmitSuccess(false);
		try {
			const payload = {
				medicalHistory: normalizeList(formState.medicalHistory),
				currentConditions: normalizeList(formState.currentConditions),
			};

			const { data } = await api.put('users/profile', payload);
			setSubmitSuccess(true);
			await refetch();
			if (data?.userSnapshot) {
				setAuth({ user: data.userSnapshot });
			}
		} catch (err) {
			setSubmitError(err?.response?.data?.message || err?.message || 'Unable to update profile right now.');
		} finally {
			setSaving(false);
		}
	};

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
							<p className="mt-2 text-lg font-semibold">{profile.userId || profile.id || user?.id || 'Unknown'}</p>
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
						<dd className="text-gray-100">{profile.fullName || user?.full_name || user?.name || user?.username || 'Not provided'}</dd>
					</div>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
						<dt className="font-medium text-gray-400">Email</dt>
						<dd className="text-gray-100">{profile.email || user?.email || 'Not provided'}</dd>
					</div>
				</dl>
			</section>

			<section className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-6">
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

					<section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-6 text-gray-100">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Current conditions</h2>
							<span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
								{conditionsList.length} noted
							</span>
						</div>
						{conditionsList.length === 0 ? (
							<p className="mt-3 text-sm text-gray-400">No ongoing symptoms have been logged.</p>
						) : (
							<ul className="mt-4 space-y-2 text-sm text-gray-200">
								{conditionsList.map((item, index) => (
									<li key={`${item}-${index}`} className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-3">
										{item}
									</li>
								))}
							</ul>
						)}
					</section>
				</div>

				<section className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-6 text-gray-100">
					<h2 className="text-lg font-semibold">Update health information</h2>
					<p className="mt-1 text-sm text-gray-400">
						Adjust your medical history and current conditions to keep AI checkups personalised.
					</p>
					<form onSubmit={handleSubmit} className="mt-5 space-y-4">
						<div>
							<label htmlFor="medicalHistory" className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
								Medical history (one per line)
							</label>
							<textarea
								id="medicalHistory"
								name="medicalHistory"
								rows={4}
								value={formState.medicalHistory}
								onChange={handleChange}
								className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
								placeholder="e.g. Type 2 Diabetes\nHypertension"
							/>
						</div>

						<div>
							<label htmlFor="currentConditions" className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
								Current symptoms or conditions (one per line)
							</label>
							<textarea
								id="currentConditions"
								name="currentConditions"
								rows={3}
								value={formState.currentConditions}
								onChange={handleChange}
								className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
								placeholder="e.g. Mild headache"
							/>
						</div>

						{submitError && (
							<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
								{submitError}
							</div>
						)}

						<div className="flex items-center gap-3">
							<button
								type="submit"
								disabled={saving}
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-400"
							>
								{saving ? 'Saving…' : 'Save changes'}
							</button>
							<button
								type="button"
								onClick={() => refetch()}
								className="text-sm font-semibold text-blue-300 hover:text-white"
							>
								Reload
							</button>
							{submitSuccess && <span className="text-xs font-semibold text-emerald-400">Saved!</span>}
						</div>
					</form>

					{loading && (
						<p className="mt-4 text-xs text-gray-500">Syncing latest profile data…</p>
					)}
					{error && (
						<p className="mt-4 text-xs text-red-400">{error}</p>
					)}
				</section>
			</section>
		</div>
	);
};

export default ProfilePage;

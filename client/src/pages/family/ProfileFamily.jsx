import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import useResource from '../../hooks/useResource';
import { useAuth } from '../../auth/AuthProvider';

const ProfileFamily = () => {
	const { user } = useAuth();
	const {
		data: profileData,
		loading,
		error,
		refetch,
	} = useResource('familyProfile', 'family/profile', {
		transform: (normalized, raw) => raw || normalized,
	});

	const profile = useMemo(() => profileData || {}, [profileData]);
	const linkedUsers = useMemo(() => profile.linkedUsers || [], [profile.linkedUsers]);

	const [formState, setFormState] = useState({
		relationship: '',
		contactNumber: '',
		notes: '',
	});
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	useEffect(() => {
		setFormState({
			relationship: profile.relationship || '',
			contactNumber: profile.contactNumber || profile.contact_number || '',
			notes: profile.notes || '',
		});
	}, [profile.relationship, profile.contactNumber, profile.contact_number, profile.notes]);

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
			await api.put('family/profile', {
				relationship: formState.relationship,
				contactNumber: formState.contactNumber,
				notes: formState.notes,
			});
			setSubmitSuccess(true);
			await refetch();
		} catch (err) {
			setSubmitError(err?.response?.data?.message || err?.message || 'Unable to save changes');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-8">
			<section className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 px-6 py-8 text-white shadow-xl sm:px-8">
				<div className="flex flex-col gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-indigo-200">Family profile</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Manage linked accounts and preferences</h1>
						<p className="mt-3 max-w-2xl text-sm text-indigo-100">
							Keep your contact details up to date and review the list of user accounts you monitor through MediBox.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wide text-indigo-100">Primary contact</p>
							<p className="mt-2 text-lg font-semibold">{user?.full_name || user?.name || user?.email || 'Family caretaker'}</p>
							<p className="text-xs text-indigo-100">{formState.contactNumber || 'Add contact number'}</p>
						</div>
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wide text-indigo-100">Relationship</p>
							<p className="mt-2 text-lg font-semibold">{formState.relationship || 'Not specified'}</p>
							<p className="text-xs text-indigo-100">Helps tailor alerts</p>
						</div>
						<div className="rounded-2xl border border-white/20 bg-white/10 p-4">
							<p className="text-xs uppercase tracking-wide text-indigo-100">Linked users</p>
							<p className="mt-2 text-3xl font-semibold">{linkedUsers.length}</p>
							<p className="text-xs text-indigo-100">Monitored accounts</p>
						</div>
					</div>
				</div>
			</section>

			{error && (
				<div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<section className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-6">
					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="border-b border-gray-200 px-6 py-4">
							<h2 className="text-lg font-semibold text-gray-900">Contact details</h2>
							<p className="text-sm text-gray-500">Update the information used to reach you for urgent alerts.</p>
						</header>
						<form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
							<div>
								<label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
									Relationship to monitored users
								</label>
								<input
									id="relationship"
									name="relationship"
									type="text"
									value={formState.relationship}
									onChange={handleChange}
									placeholder="e.g. Parent, Sibling"
									className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
								/>
							</div>

							<div>
								<label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
									Contact number
								</label>
								<input
									id="contactNumber"
									name="contactNumber"
									type="tel"
									value={formState.contactNumber}
									onChange={handleChange}
									placeholder="Enter active phone number"
									className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
								/>
							</div>

							<div>
								<label htmlFor="notes" className="block text-sm font-medium text-gray-700">
									Notes for healthcare professionals
								</label>
								<textarea
									id="notes"
									name="notes"
									rows={4}
									value={formState.notes}
									onChange={handleChange}
									placeholder="Optional context you want to share with pharmacists or doctors."
									className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
								/>
							</div>

							<div className="flex items-center gap-3">
								<button
									type="submit"
									disabled={saving}
									className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
								>
									{saving ? 'Saving…' : 'Save changes'}
								</button>
								<button
									type="button"
									onClick={() => refetch()}
									className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
								>
									Reload
								</button>
								{submitSuccess && <span className="text-xs font-semibold text-emerald-600">Saved!</span>}
							</div>

							{submitError && (
								<p className="text-xs text-rose-600">{submitError}</p>
							)}
						</form>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-white shadow">
						<header className="border-b border-gray-200 px-6 py-4">
							<h2 className="text-lg font-semibold text-gray-900">Account metadata</h2>
						</header>
						<dl className="grid gap-3 px-6 py-5 text-sm text-gray-600">
							<div className="flex flex-col">
								<dt className="uppercase tracking-wide text-xs text-gray-400">Email</dt>
								<dd className="text-gray-900">{user?.email || profile.email || 'Not provided'}</dd>
							</div>
							<div className="flex flex-col">
								<dt className="uppercase tracking-wide text-xs text-gray-400">Member since</dt>
								<dd className="text-gray-900">{profile.joinedAt ? new Date(profile.joinedAt).toLocaleString() : 'Unknown'}</dd>
							</div>
							<div className="flex flex-col">
								<dt className="uppercase tracking-wide text-xs text-gray-400">Total alerts received</dt>
								<dd className="text-gray-900">{profile.alertCount ?? 0}</dd>
							</div>
							<div className="flex flex-col">
								<dt className="uppercase tracking-wide text-xs text-gray-400">Preferred notification channel</dt>
								<dd className="text-gray-900">{profile.notificationChannel || 'Email'}</dd>
							</div>
						</dl>
					</div>
				</div>

				<div className="rounded-2xl border border-gray-200 bg-white shadow">
					<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">Linked users</h2>
							<p className="text-sm text-gray-500">Accounts whose medication activity you monitor.</p>
						</div>
						<span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{linkedUsers.length} connected</span>
					</header>
					<ul className="divide-y divide-gray-100">
						{loading && (
							<li className="px-6 py-5 text-sm text-gray-500">Loading linked users…</li>
						)}
						{!loading && linkedUsers.length === 0 && (
							<li className="px-6 py-5 text-sm text-gray-500">No user accounts linked yet. Ask a user to invite you from their profile.</li>
						)}
						{linkedUsers.map((linked, index) => (
							<li key={`${linked.userId || linked._id || 'linked'}-${index}`} className="px-6 py-5">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<p className="text-base font-semibold text-gray-900">{linked.name || linked.user?.name || 'Unknown user'}</p>
										<p className="text-sm text-gray-500">Relationship: {linked.relationship || 'Not provided'}</p>
										<p className="text-xs text-gray-400">Medication count: {Array.isArray(linked.medications) ? linked.medications.length : 0}</p>
									</div>
									<div className="space-y-1 text-xs text-gray-500">
										<p className="font-semibold uppercase tracking-wide text-gray-400">Active medications</p>
										{Array.isArray(linked.medications) && linked.medications.length > 0 ? (
											<ul className="list-disc pl-5 text-left">
												{linked.medications.slice(0, 4).map((med, medIndex) => (
													<li key={`${med.name || med.medicine || 'med'}-${medIndex}`} className="text-gray-600">
														{med.name || med.medicine} · {med.schedule || med.dosage || ''}
													</li>
												))}
												{linked.medications.length > 4 && <li className="text-gray-400">+{linked.medications.length - 4} more</li>}
											</ul>
										) : (
											<p>No prescriptions listed</p>
										)}
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>
		</div>
	);
};

export default ProfileFamily;

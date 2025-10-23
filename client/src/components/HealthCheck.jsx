import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

const HealthCheck = ({ healthStatus, onSubmitted }) => {
    const [sleepQuality, setSleepQuality] = useState('');
    const [appetite, setAppetite] = useState('');
    const [fatigue, setFatigue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [result, setResult] = useState(null);

    const latestSummary = useMemo(() => {
        if (!healthStatus) {
            return null;
        }
        return {
            adherence_risk: healthStatus?.adherence_risk || healthStatus?.risk_level,
            recommendation: healthStatus?.recommendation || healthStatus?.recommendations,
            captured_at: healthStatus?.captured_at || healthStatus?.created_at,
        };
    }, [healthStatus]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmissionError(null);
        setSubmitting(true);
        try {
            const payload = {
                sleep_quality: sleepQuality,
                appetite,
                fatigue,
            };
            const { data } = await api.post('health/check', payload);
            setResult(data);
            if (onSubmitted) {
                onSubmitted();
            }
            setSleepQuality('');
            setAppetite('');
            setFatigue('');
        } catch (error) {
            console.error('Error submitting health check', error);
            setSubmissionError(error?.message || 'Unable to submit health report');
        } finally {
            setSubmitting(false);
        }
    };

    const recommendations = useMemo(() => {
        const recs = result?.recommendation || result?.recommendations || latestSummary?.recommendation;
        if (!recs) {
            return [];
        }
        return Array.isArray(recs) ? recs : [recs];
    }, [latestSummary?.recommendation, result]);

    const riskLevel = (result?.adherence_risk || result?.risk_level || latestSummary?.adherence_risk || 'low').toLowerCase();

    const tone = (() => {
        switch (riskLevel) {
            case 'high':
                return 'border-red-300 bg-red-50 text-red-700';
            case 'medium':
                return 'border-yellow-300 bg-yellow-50 text-yellow-800';
            default:
                return 'border-green-300 bg-green-50 text-green-700';
        }
    })();

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Daily health check</h2>
                    <p className="text-xs text-gray-500">Share a quick snapshot so we can personalise your reminders.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
                    {riskLevel.toUpperCase()}
                </span>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Daily health check form">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="sleepQuality" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Sleep quality
                        </label>
                        <select
                            id="sleepQuality"
                            name="sleepQuality"
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={sleepQuality}
                            onChange={(event) => setSleepQuality(event.target.value)}
                            required
                        >
                            <option value="">Select</option>
                            <option value="good">Good</option>
                            <option value="average">Average</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="appetite" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Appetite level
                        </label>
                        <select
                            id="appetite"
                            name="appetite"
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={appetite}
                            onChange={(event) => setAppetite(event.target.value)}
                            required
                        >
                            <option value="">Select</option>
                            <option value="good">Good</option>
                            <option value="average">Average</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="fatigue" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Fatigue level
                        </label>
                        <select
                            id="fatigue"
                            name="fatigue"
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={fatigue}
                            onChange={(event) => setFatigue(event.target.value)}
                            required
                        >
                            <option value="">Select</option>
                            <option value="none">None</option>
                            <option value="mild">Mild</option>
                            <option value="severe">Severe</option>
                        </select>
                    </div>
                </div>
                {submissionError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                        {submissionError}
                    </div>
                )}
                <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={submitting}
                >
                    {submitting ? 'Submitting…' : 'Submit health check'}
                </button>
            </form>

            {(riskLevel || recommendations.length > 0 || latestSummary?.captured_at) && (
                <div className="mt-6 space-y-3" aria-live="polite">
                    {recommendations.length > 0 && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                            <p className="font-semibold">Recommendations</p>
                            <ul className="mt-2 space-y-1 text-xs">
                                {recommendations.map((item, index) => (
                                    <li key={`${item}-${index}`} className="leading-relaxed">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {latestSummary?.captured_at && (
                        <p className="text-xs text-gray-500">
                            {(() => {
                                const parsed = new Date(latestSummary.captured_at);
                                const label = Number.isNaN(parsed.getTime())
                                    ? latestSummary.captured_at
                                    : parsed.toLocaleString();
                                return `Last updated ${label}`;
                            })()}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
};

HealthCheck.propTypes = {
    healthStatus: PropTypes.shape({
        adherence_risk: PropTypes.string,
        risk_level: PropTypes.string,
        recommendation: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.string),
            PropTypes.string,
        ]),
        recommendations: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.string),
            PropTypes.string,
        ]),
        captured_at: PropTypes.string,
        created_at: PropTypes.string,
    }),
    onSubmitted: PropTypes.func,
};

HealthCheck.defaultProps = {
    healthStatus: null,
    onSubmitted: undefined,
};

export default HealthCheck;
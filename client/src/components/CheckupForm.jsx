import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

const QUESTION_LIBRARY = [
  {
    keyword: 'diabetes',
    prompts: [
      'Did you monitor your blood sugar today?',
      'Have you taken your diabetes medication as prescribed?',
      'Have you experienced unusual thirst or fatigue today?',
    ],
  },
  {
    keyword: 'hypertension',
    prompts: [
      'Have you taken your blood pressure medicine today?',
      'Did you feel dizzy or experience headaches today?',
      'Did you measure your blood pressure within the last 24 hours?',
    ],
  },
  {
    keyword: 'heart',
    prompts: [
      'Did you feel any chest discomfort today?',
      'Have you noticed shortness of breath during normal activity?',
      'Did you take your heart medication on schedule?',
    ],
  },
  {
    keyword: 'asthma',
    prompts: [
      'Did you experience wheezing or tightness in your chest today?',
      'Did you need to use your inhaler today?',
      'Are you currently experiencing any breathing difficulty?',
    ],
  },
];

const FALLBACK_PROMPTS = [
  'Did you take all of your scheduled medications today?',
  'Did you sleep well last night?',
  'Are you experiencing any discomfort right now?',
];

const normalizeText = (value) => (value || '').toString().toLowerCase();

const collectKeywords = (history, complaints) => {
  const source = `${normalizeText(history)} ${normalizeText(complaints)}`;
  const matches = new Set();
  QUESTION_LIBRARY.forEach((entry) => {
    if (source.includes(entry.keyword)) {
      matches.add(entry.keyword);
    }
  });
  return matches;
};

const generateQuestions = (history, complaints) => {
  const keywords = collectKeywords(history, complaints);
  const prompts = [];
  QUESTION_LIBRARY.forEach((entry) => {
    if (keywords.has(entry.keyword)) {
      entry.prompts.forEach((prompt) => prompts.push({ id: `${entry.keyword}-${prompt}`, text: prompt }));
    }
  });

  if (prompts.length === 0) {
    FALLBACK_PROMPTS.forEach((prompt) => prompts.push({ id: `default-${prompt}`, text: prompt }));
  }

  // Always ensure at least three questions, pad with fallback as needed
  while (prompts.length < 3) {
    const fallback = FALLBACK_PROMPTS[prompts.length % FALLBACK_PROMPTS.length];
    prompts.push({ id: `padding-${prompts.length}`, text: fallback });
  }

  return prompts.slice(0, 6);
};

const formatTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const CheckupForm = ({ latestHealth, defaultHistory, onSubmitted }) => {
  const [complaints, setComplaints] = useState('');
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const questions = useMemo(
    () => generateQuestions(defaultHistory, complaints),
    [complaints, defaultHistory],
  );

  useEffect(() => {
    setResponses((prev) => {
      const next = {};
      questions.forEach((question) => {
        next[question.id] = Object.prototype.hasOwnProperty.call(prev, question.id) ? prev[question.id] : null;
      });
      return next;
    });
  }, [questions]);

  useEffect(() => {
    if (latestHealth) {
      setResult(latestHealth);
    }
  }, [latestHealth]);

  const handleAnswer = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const isComplete = useMemo(
    () => questions.every((question) => responses[question.id] !== null && responses[question.id] !== undefined),
    [questions, responses],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!isComplete) {
      setError('Please answer every question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedResponses = questions.map((question) => ({
        question: question.text,
        answer: responses[question.id] ? 'yes' : 'no',
      }));

      const payload = {
        complaints: complaints || undefined,
        medical_history: defaultHistory,
        responses: formattedResponses,
      };

      const { data } = await api.post('health/check', payload);
      setResult(data);
      if (typeof onSubmitted === 'function') {
        onSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit checkup', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to submit checkup right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const recommendations = useMemo(() => {
    const source = result?.recommendation || result?.recommendations;
    if (!source) {
      return [];
    }
    return Array.isArray(source) ? source : [source];
  }, [result]);

  const detectedRisk = (result?.adherence_risk || result?.risk_level || 'low').toLowerCase();
  const severityTone = (() => {
    switch (detectedRisk) {
      case 'high':
        return 'border-red-300 bg-red-50 text-red-700';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      default:
        return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    }
  })();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" id="checkup">
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Daily checkup questionnaire">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Daily checkup</p>
            <h2 className="text-xl font-semibold text-gray-900">Answer a quick yes/no questionnaire</h2>
            <p className="mt-1 text-sm text-gray-500">
              Questions adapt to your medical history and any complaints you add today.
            </p>
          </div>
          <span className={`inline-flex h-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${severityTone}`}>
            {detectedRisk.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          <label htmlFor="checkup-complaints" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Today&apos;s complaints or notes (optional)
          </label>
          <textarea
            id="checkup-complaints"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Describe anything unusual today..."
            value={complaints}
            onChange={(event) => setComplaints(event.target.value)}
          />
        </div>

        <div className="space-y-4">
          {questions.map((question) => {
            const value = responses[question.id];
            return (
              <div key={question.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{question.text}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-500 hover:text-emerald-600'}`}
                    onClick={() => handleAnswer(question.id, true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === false ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-600'}`}
                    onClick={() => handleAnswer(question.id, false)}
                  >
                    No
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isComplete}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? 'Submitting…' : 'Submit checkup'}
        </button>
      </form>

      {(result || latestHealth) && (
        <div className="mt-6 space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Latest recommendations</p>
            {formatTimestamp(result?.captured_at || result?.created_at || latestHealth?.captured_at || latestHealth?.created_at) && (
              <span className="text-xs text-blue-600">
                {`Updated ${formatTimestamp(result?.captured_at || result?.created_at || latestHealth?.captured_at || latestHealth?.created_at)}`}
              </span>
            )}
          </div>
          {recommendations.length === 0 ? (
            <p className="text-xs text-blue-800">No personalised tips yet. Submit today&apos;s checkup to generate new insights.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {recommendations.map((item, index) => (
                <li key={`${item}-${index}`} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

CheckupForm.propTypes = {
  latestHealth: PropTypes.shape({
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
  defaultHistory: PropTypes.string,
  onSubmitted: PropTypes.func,
};

CheckupForm.defaultProps = {
  latestHealth: null,
  defaultHistory: '',
  onSubmitted: undefined,
};

export default CheckupForm;

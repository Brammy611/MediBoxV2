import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import api from '../api/axios';

const FALLBACK_QUESTIONS = [
  {
    id: 'fallback-0',
    text: 'Did you take all scheduled medications today?',
    type: 'yesNo',
  },
  {
    id: 'fallback-1',
    text: 'How severe is your discomfort right now? (1 = none, 10 = severe)',
    type: 'scale',
    min: 1,
    max: 10,
    step: 1,
  },
  {
    id: 'fallback-2',
    text: 'List any unusual symptoms or feelings today.',
    type: 'text',
  },
  {
    id: 'fallback-3',
    text: 'Which of these symptoms did you notice today?',
    type: 'multiple',
    options: ['Dizziness', 'Nausea', 'Headache', 'Fatigue'],
  },
  {
    id: 'fallback-4',
    text: 'Do you need support managing your medication routine?',
    type: 'yesNo',
  },
];

const normalizeList = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const inferType = (entry) => {
  const rawType = (entry.type || entry.responseType || '').toString().toLowerCase();
  if (['scale', 'slider', 'range'].includes(rawType)) {
    return 'scale';
  }
  if (['text', 'open', 'textarea', 'descriptive'].includes(rawType)) {
    return 'text';
  }
  if (['multiple', 'multi', 'multi_choice', 'checkbox'].includes(rawType)) {
    return 'multiple';
  }
  if (['single', 'single_choice', 'radio', 'select'].includes(rawType)) {
    return 'single';
  }
  if (['boolean', 'yes_no', 'true_false'].includes(rawType)) {
    return 'yesNo';
  }
  if (Array.isArray(entry.options) && entry.options.length > 0) {
    const lowercaseOptions = entry.options.map((option) => option?.toString().toLowerCase());
    if (lowercaseOptions.includes('yes') && lowercaseOptions.includes('no')) {
      return 'yesNo';
    }
    return entry.maxSelections === 1 ? 'single' : 'multiple';
  }
  if (typeof entry.min !== 'undefined' || entry.range) {
    return 'scale';
  }
  return 'yesNo';
};

const normalizeQuestions = (payload = []) => {
  const source = Array.isArray(payload) && payload.length > 0 ? payload.slice(0, 6) : FALLBACK_QUESTIONS;

  return source.map((entry, index) => {
    if (typeof entry === 'string') {
      return {
        id: `ai-${index}`,
        text: entry,
        type: 'yesNo',
      };
    }

    const question = entry || {};
    const resolvedType = inferType(question);
    const min = Number(question.min ?? question.range?.min ?? (resolvedType === 'scale' ? 1 : undefined));
    const max = Number(question.max ?? question.range?.max ?? (resolvedType === 'scale' ? 5 : undefined));

    return {
      id: question.id || question.questionId || question.key || `ai-${index}`,
      text: question.text || question.question || `Question ${index + 1}?`,
      type: resolvedType === 'single' ? 'multiple' : resolvedType,
      options: Array.isArray(question.options)
        ? question.options.map((option) => (typeof option === 'string' ? option : option?.label || option?.value)).filter(Boolean)
        : undefined,
      min: Number.isFinite(min) ? min : undefined,
      max: Number.isFinite(max) ? max : undefined,
      step: Number.isFinite(question.step) ? question.step : undefined,
      description: question.description || question.help || question.prompt,
    };
  });
};

const INITIAL_QUESTIONS = normalizeQuestions();

const buildDefaultResponses = (questionList) =>
  questionList.reduce((acc, question) => {
    switch (question.type) {
      case 'scale': {
        const min = Number.isFinite(question.min) ? question.min : 1;
        const max = Number.isFinite(question.max) ? question.max : 5;
        acc[question.id] = Math.round((min + max) / 2);
        break;
      }
      case 'multiple':
        acc[question.id] = [];
        break;
      case 'text':
        acc[question.id] = '';
        break;
      default:
        acc[question.id] = null;
    }
    return acc;
  }, {});

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

const CheckupForm = ({ latestEntry, defaultHistory, onComplete }) => {
  const normalizedHistory = useMemo(() => normalizeList(defaultHistory), [defaultHistory]);
  const historyFingerprint = useMemo(() => normalizedHistory.join('|'), [normalizedHistory]);
  const [complaints, setComplaints] = useState('');
  const [questions, setQuestions] = useState(() => INITIAL_QUESTIONS);
  const [responses, setResponses] = useState(() => buildDefaultResponses(INITIAL_QUESTIONS));
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [result, setResult] = useState(latestEntry || null);
  const requestKeyRef = useRef(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }, []);

  const applyQuestions = useCallback((nextQuestions) => {
    if (!mountedRef.current) {
      return;
    }
    setQuestions(nextQuestions);
    setResponses(buildDefaultResponses(nextQuestions));
  }, []);

  const loadQuestions = useCallback(
    async (complaintText, historyList) => {
      const trimmedComplaint = complaintText?.trim() || '';
      const historyKey = Array.isArray(historyList) ? historyList.join('|') : '';
      const nextKey = `${historyKey}::${trimmedComplaint}`;

      if (requestKeyRef.current === nextKey && questions.length > 0) {
        return;
      }

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      requestKeyRef.current = nextKey;
      setLoadingQuestions(true);
      setQuestionError(null);

      try {
        const { data } = await api.post(
          'users/checkup/questions',
          {
            medicalHistory: historyList,
            complaints: trimmedComplaint || undefined,
            latestEntryId: latestEntry?.id || latestEntry?._id,
            latestAnswers: latestEntry?.answers,
          },
          {
            signal: controller.signal,
          },
        );

        const nextQuestions = normalizeQuestions(data?.questions || data);
        applyQuestions(nextQuestions);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }

        console.error('Failed to generate AI questions', err);
        setQuestionError(
          err?.response?.data?.message
            || err?.message
            || 'Unable to generate AI-assisted questions. Using fallback prompts instead.',
        );
        applyQuestions(normalizeQuestions());
      } finally {
        if (mountedRef.current) {
          setLoadingQuestions(false);
        }
      }
    },
    [applyQuestions, latestEntry, questions.length],
  );

  useEffect(() => {
    loadQuestions('', normalizedHistory);
  }, [historyFingerprint, loadQuestions, normalizedHistory]);

  useEffect(() => {
    if (!complaints || complaints.trim().length < 3) {
      return undefined;
    }
    const handle = setTimeout(() => {
      loadQuestions(complaints, normalizedHistory);
    }, 600);
    return () => clearTimeout(handle);
  }, [complaints, loadQuestions, normalizedHistory]);

  useEffect(() => {
    if (latestEntry) {
      setResult(latestEntry);
    }
  }, [latestEntry]);

  useEffect(() => {
    if (!submitSuccess) {
      return undefined;
    }
    const timeout = setTimeout(() => setSubmitSuccess(false), 4000);
    return () => clearTimeout(timeout);
  }, [submitSuccess]);

  const handleBinaryAnswer = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleScaleAnswer = (questionId, value) => {
    const numeric = Number(value);
    setResponses((prev) => ({
      ...prev,
      [questionId]: Number.isNaN(numeric) ? prev[questionId] : numeric,
    }));
  };

  const handleTextAnswer = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMultipleAnswer = (questionId, option) => {
    setResponses((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(option);
      return {
        ...prev,
        [questionId]: exists ? current.filter((item) => item !== option) : [...current, option],
      };
    });
  };

  const isComplete = useMemo(
    () =>
      questions.every((question) => {
        const response = responses[question.id];
        switch (question.type) {
          case 'scale':
            return typeof response === 'number';
          case 'multiple':
            return Array.isArray(response) && response.length > 0;
          case 'text':
            return typeof response === 'string' && response.trim().length > 0;
          default:
            return response === true || response === false;
        }
      }),
    [questions, responses],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (!isComplete) {
      setSubmitError('Please answer every question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        complaints: complaints.trim() || undefined,
        medicalHistory: normalizedHistory,
        answers: questions.map((question) => ({
          id: question.id,
          question: question.text,
          type: question.type,
          response: responses[question.id],
        })),
      };

      const { data } = await api.post('users/checkup/answers', payload);
      const responseData = data?.result || data?.checkup || data;
      setResult(responseData);
      setSubmitSuccess(true);
      setComplaints('');
      requestKeyRef.current = null;
      loadQuestions('', normalizedHistory);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to submit checkup', err);
      setSubmitError(err?.response?.data?.message || err?.message || 'Unable to submit checkup right now.');
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

  const detectedRisk = (result?.risk || result?.adherence_risk || result?.risk_level || 'low').toLowerCase();
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

  const renderQuestion = (question) => {
    const value = responses[question.id];

    if (question.type === 'scale') {
      const min = Number.isFinite(question.min) ? question.min : 1;
      const max = Number.isFinite(question.max) ? question.max : 5;
      const step = Number.isFinite(question.step) ? question.step : 1;
      return (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>{min}</span>
            <span>{max}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value ?? Math.round((min + max) / 2)}
            onChange={(event) => handleScaleAnswer(question.id, event.target.value)}
            className="mt-3 w-full accent-blue-600"
          />
          <p className="mt-1 text-sm font-semibold text-gray-700">Current value: {value}</p>
        </div>
      );
    }

    if (question.type === 'text') {
      return (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(event) => handleTextAnswer(question.id, event.target.value)}
          className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe your experience..."
        />
      );
    }

    if (question.type === 'multiple' && Array.isArray(question.options)) {
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          {question.options.map((option) => {
            const checked = Array.isArray(value) && value.includes(option);
            return (
              <label
                key={`${question.id}-${option}`}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  onChange={() => handleMultipleAnswer(question.id, option)}
                />
                {option}
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-500 hover:text-emerald-600'}`}
          onClick={() => handleBinaryAnswer(question.id, true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === false ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-600'}`}
          onClick={() => handleBinaryAnswer(question.id, false)}
        >
          No
        </button>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow" id="checkup">
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Daily checkup questionnaire">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Daily checkup</p>
            <h2 className="text-xl font-semibold text-gray-900">Answer a personalised questionnaire</h2>
            <p className="mt-1 text-sm text-gray-500">
              Questions adapt to your medical history and any complaints you add today.
            </p>
          </div>
          <span className={`inline-flex h-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${severityTone}`}>
            {detectedRisk.toUpperCase()}
          </span>
        </div>

        {questionError && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            {questionError}
          </div>
        )}

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
          {loadingQuestions && (
            <p className="text-xs text-gray-500">Generating questions tailored to your inputs…</p>
          )}
          {questions.map((question) => (
            <div key={question.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{question.text}</p>
              {question.description && (
                <p className="mt-1 text-xs text-gray-500">{question.description}</p>
              )}
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !isComplete}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? 'Submitting…' : 'Submit checkup'}
        </button>

        {submitSuccess && (
          <p className="text-center text-xs font-semibold text-emerald-600">Checkup submitted successfully.</p>
        )}
      </form>

      {(result || latestEntry) && (
        <div className="mt-6 space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Latest recommendations</p>
            {formatTimestamp(
              result?.captured_at
                || result?.created_at
                || latestEntry?.captured_at
                || latestEntry?.created_at
                || latestEntry?.date,
            ) && (
              <span className="text-xs text-blue-600">
                {`Updated ${formatTimestamp(
                  result?.captured_at
                    || result?.created_at
                    || latestEntry?.captured_at
                    || latestEntry?.created_at
                    || latestEntry?.date,
                )}`}
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
  latestEntry: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    risk: PropTypes.string,
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
    date: PropTypes.string,
    answers: PropTypes.array,
  }),
  defaultHistory: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  onComplete: PropTypes.func,
};

CheckupForm.defaultProps = {
  latestEntry: null,
  defaultHistory: [],
  onComplete: undefined,
};

export default CheckupForm;

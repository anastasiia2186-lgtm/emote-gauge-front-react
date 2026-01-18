import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import utils from "../utils/utils";

const TakeSurveyPage = () => {
  const [searchParams] = useSearchParams();
  const uniqueLink = searchParams.get("link");

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const loadSurvey = useCallback(async () => {
    try {
      const data = await api.getPublicSurvey(uniqueLink);
      setSurvey(data.data);

      // Initialize answers
      const initialAnswers = {};
      data.data.questions.forEach((q) => {
        initialAnswers[q._id] = q.questionType === "checkbox" ? [] : null;
      });
      setAnswers(initialAnswers);

      // Start timer
      setStartTime(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uniqueLink]);

  useEffect(() => {
    if (!uniqueLink) {
      setError("Невалідне посилання на опитування");
      setLoading(false);
      return;
    }

    loadSurvey();
  }, [uniqueLink, loadSurvey]);

  // Timer
  useEffect(() => {
    if (!startTime || submitted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.values(answers).filter((answer) => {
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== null && answer !== "";
  }).length;

  const progressPercentage = survey
    ? Math.round((answeredCount / survey.questions.length) * 100)
    : 0;

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      return {
        ...prev,
        [questionId]: checked
          ? [...current, option]
          : current.filter((v) => v !== option),
      };
    });
  };

  const validateAnswers = () => {
    const errors = {};
    let isValid = true;

    survey.questions.forEach((question) => {
      if (question.required) {
        const answer = answers[question._id];
        if (
          answer === null ||
          answer === "" ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          errors[question._id] = "Це поле обов'язкове";
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAnswers()) {
      utils.showToast("Будь ласка, заповніть всі обов'язкові поля", "error");
      const firstError = Object.keys(validationErrors)[0];
      if (firstError) {
        document
          .querySelector(`[data-question-id="${firstError}"]`)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }
      return;
    }

    setSubmitting(true);

    try {
      const answersArray = survey.questions.map((question) => ({
        questionId: question._id,
        answerValue: answers[question._id],
      }));

      await api.submitResponse(uniqueLink, {
        answers: answersArray,
        completionTime: elapsedTime,
      });

      setSubmitted(true);
      utils.showToast("Відповіді відправлено!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      utils.showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading && !survey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
          <p className="text-gray-600 mt-4 text-lg">
            Завантаження опитування...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !survey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Опитування не знайдено
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            На головну
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Дякуємо!</h2>
          <p className="text-gray-600 mb-6">Ваші відповіді успішно збережено</p>

          {survey?.settings?.showResults && (
            <Link
              to={`/pages/survey-results.html?link=${uniqueLink}`}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📊 Переглянути результати
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Survey Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {survey.coverImage?.url && (
            <div
              className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"
              style={{
                backgroundImage: `url('${survey.coverImage.url}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-gray-600 text-lg">{survey.description}</p>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="text-red-500 mr-1">*</span>
              <span>Обов'язкові поля</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Прогрес</span>
            <span>
              {answeredCount}/{survey.questions.length} питань
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {survey.questions.map((question, index) => (
              <div
                key={question._id}
                data-question-id={question._id}
                className="bg-white rounded-xl shadow-sm p-6 animate-fadeIn"
              >
                <div className="mb-4">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    {index + 1}. {question.questionText}
                    {question.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                </div>

                <div>
                  {/* TEXT */}
                  {question.questionType === "text" && (
                    <input
                      type="text"
                      value={answers[question._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ваша відповідь..."
                      required={question.required}
                    />
                  )}

                  {/* TEXTAREA */}
                  {question.questionType === "textarea" && (
                    <textarea
                      value={answers[question._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question._id, e.target.value)
                      }
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ваша відповідь..."
                      required={question.required}
                    />
                  )}

                  {/* RADIO */}
                  {question.questionType === "radio" && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition"
                        >
                          <input
                            type="radio"
                            name={`question-${question._id}`}
                            value={option}
                            checked={answers[question._id] === option}
                            onChange={(e) =>
                              handleAnswerChange(question._id, e.target.value)
                            }
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                            required={question.required}
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* CHECKBOX */}
                  {question.questionType === "checkbox" && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={(answers[question._id] || []).includes(
                              option,
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                question._id,
                                option,
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* RATING */}
                  {question.questionType === "rating" && (
                    <div className="flex items-center space-x-2">
                      <RatingStars
                        rating={answers[question._id] || 0}
                        onChange={(rating) =>
                          handleAnswerChange(question._id, rating)
                        }
                      />
                      {answers[question._id] && (
                        <span className="ml-4 text-gray-600 font-semibold">
                          {answers[question._id]}/5
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {validationErrors[question._id] && (
                  <p className="text-red-500 text-sm mt-2">
                    {validationErrors[question._id]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-gray-600 text-sm">
                <svg
                  className="inline w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Час проходження: </span>
                <span className="font-semibold">{formatTime(elapsedTime)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Відправка...</span>
                  </>
                ) : (
                  <span>Відправити відповіді</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rating Stars Component
const RatingStars = ({ rating, onChange }) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="flex items-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <svg
            className={`w-12 h-12 ${
              hoveredRating >= star || rating >= star
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default TakeSurveyPage;

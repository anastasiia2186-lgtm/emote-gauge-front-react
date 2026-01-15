import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Chart from "chart.js/auto";
import api from "../services/api";
import auth from "../services/auth";
import utils from "../utils/utils";

const SurveyDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get("id");

  const [survey, setSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const chartsRef = useRef({});

  const loadData = useCallback(async () => {
    try {
      const [surveyData, analyticsData] = await Promise.all([
        api.getSurvey(surveyId),
        api.getSurveyAnalytics(surveyId).catch(() => ({ data: null })),
      ]);

      setSurvey(surveyData.data);
      setAnalytics(analyticsData.data);
    } catch (error) {
      utils.showToast(error.message, "error");
      setTimeout(() => navigate("/pages/dashboard.html"), 2000);
    } finally {
      setLoading(false);
    }
  }, [surveyId, navigate]);

  useEffect(() => {
    if (!auth.requireAuth()) return;

    if (!surveyId) {
      utils.showToast("ID опитування не знайдено", "error");
      setTimeout(() => navigate("/pages/dashboard.html"), 2000);
      return;
    }

    loadData();
    const charts = chartsRef.current;

    // Cleanup charts on unmount
    return () => {
      Object.values(charts).forEach((chart) => chart?.destroy());
      charts.destroy();
    };
  }, [surveyId, navigate, loadData]);

  const publicLink = survey
    ? `${window.location.origin}/pages/take-survey.html?link=${survey.uniqueLink}`
    : "";

  const copyPublicLink = () => {
    utils.copyToClipboard(publicLink);
  };

  const formatDate = (date) => {
    return utils.formatDate(date);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}хв ${secs}с`;
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      text: "📝 Коротка відповідь",
      textarea: "📄 Довга відповідь",
      radio: "⭕ Один варіант",
      checkbox: "☑️ Кілька варіантів",
      rating: "⭐ Оцінка",
    };
    return labels[type] || type;
  };

  const toggleActive = async () => {
    setActionLoading(true);
    try {
      await api.updateSurvey(surveyId, {
        isActive: !survey.isActive,
      });
      setSurvey({ ...survey, isActive: !survey.isActive });
      utils.showToast(
        survey.isActive ? "Опитування призупинено" : "Опитування активовано"
      );
    } catch (error) {
      utils.showToast(error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateLink = async () => {
    if (
      !window.confirm(
        "Згенерувати нове посилання? Старе посилання перестане працювати."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const data = await api.regenerateLink(surveyId);
      setSurvey({ ...survey, uniqueLink: data.data.uniqueLink });
      utils.showToast("Нове посилання згенеровано");
    } catch (error) {
      utils.showToast(error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSurvey = async () => {
    if (
      !window.confirm(
        "Видалити опитування та всі відповіді? Це не можна буде скасувати."
      )
    ) {
      return;
    }

    try {
      await api.deleteSurvey(surveyId);
      utils.showToast("Опитування видалено");
      setTimeout(() => navigate("/pages/dashboard.html"), 1500);
    } catch (error) {
      utils.showToast(error.message, "error");
    }
  };

  // Chart rendering
  const renderResponsesByDateChart = (canvasRef) => {
    if (!canvasRef || !analytics?.responsesByDate?.length) return;

    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    if (chartsRef.current["responsesByDate"]) {
      chartsRef.current["responsesByDate"].destroy();
    }

    chartsRef.current["responsesByDate"] = new Chart(ctx, {
      type: "line",
      data: {
        labels: analytics.responsesByDate.map((d) => d.date),
        datasets: [
          {
            label: "Відповіді",
            data: analytics.responsesByDate.map((d) => d.count),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  };

  const renderAnalyticsChart = (canvasRef, question) => {
    if (!canvasRef || question.data?.chartType === "text") return;

    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    if (chartsRef.current[question.questionId]) {
      chartsRef.current[question.questionId].destroy();
    }

    let chartData;
    let backgroundColors;
    let borderColors;

    if (question.questionType === "rating") {
      backgroundColors = [
        "rgba(239, 68, 68, 0.6)",
        "rgba(251, 146, 60, 0.6)",
        "rgba(250, 204, 21, 0.6)",
        "rgba(163, 230, 53, 0.6)",
        "rgba(34, 197, 94, 0.6)",
      ];
      borderColors = [
        "rgb(239, 68, 68)",
        "rgb(251, 146, 60)",
        "rgb(250, 204, 21)",
        "rgb(163, 230, 53)",
        "rgb(34, 197, 94)",
      ];

      chartData = {
        labels: question.data.labels.map((l) => `${l} ⭐`),
        datasets: [
          {
            label: "Кількість оцінок",
            data: question.data.values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
          },
        ],
      };
    } else {
      chartData = {
        labels: question.data.labels,
        datasets: [
          {
            label: "Кількість відповідей",
            data: question.data.values,
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
          },
        ],
      };
    }

    chartsRef.current[question.questionId] = new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${value} відповідей (${percentage}%)`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
          <p className="text-gray-600 mt-4 text-lg">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/pages/dashboard.html"
                className="text-xl font-bold text-gray-800"
              >
                📊 Survey App
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                {survey?.title || "Опитування"}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={copyPublicLink}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="hidden sm:inline">Копіювати посилання</span>
              </button>

              <Link
                to="/pages/dashboard.html"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Назад
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Survey Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {survey?.coverImage?.url && (
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
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {survey?.title}
                </h1>
                <p className="text-gray-600">
                  {survey?.description || "Без опису"}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  survey?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {survey?.isActive ? "🟢 Активне" : "🔴 Неактивне"}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={toggleActive}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {survey?.isActive ? "⏸️ Призупинити" : "▶️ Активувати"}
              </button>

              <button
                onClick={regenerateLink}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                🔄 Нове посилання
              </button>

              <button
                onClick={deleteSurvey}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                🗑️ Видалити
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {["overview", "analytics", "questions", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 border-b-2 font-semibold transition ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "overview" && "📊 Огляд"}
                  {tab === "analytics" && "📈 Аналітика"}
                  {tab === "questions" && "❓ Питання"}
                  {tab === "settings" && "⚙️ Налаштування"}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold mb-1">
                          Всього відповідей
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {analytics?.summary?.totalResponses || 0}
                        </p>
                      </div>
                      <div className="bg-blue-200 rounded-full p-3">
                        <svg
                          className="w-8 h-8 text-blue-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold mb-1">
                          Середній час
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {formatTime(
                            analytics?.summary?.averageCompletionTime || 0
                          )}
                        </p>
                      </div>
                      <div className="bg-green-200 rounded-full p-3">
                        <svg
                          className="w-8 h-8 text-green-700"
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
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-semibold mb-1">
                          Питань
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {survey?.questions?.length || 0}
                        </p>
                      </div>
                      <div className="bg-purple-200 rounded-full p-3">
                        <svg
                          className="w-8 h-8 text-purple-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Public Link */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    🔗 Публічне посилання
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={publicLink}
                      readOnly
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={copyPublicLink}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Копіювати
                    </button>
                  </div>
                </div>

                {/* Responses Chart */}
                {analytics?.responsesByDate?.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📅 Відповіді по датах
                    </h3>
                    <div style={{ height: "320px" }}>
                      <canvas
                        ref={(ref) => ref && renderResponsesByDateChart(ref)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="mt-4 text-gray-600">
                      Ще немає відповідей на це опитування
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div>
                {analytics?.questionAnalytics?.length > 0 ? (
                  <div className="space-y-8">
                    {analytics.questionAnalytics.map((question, index) => (
                      <div
                        key={question.questionId}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {index + 1}. {question.questionText}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {question.totalAnswers} відповідей •{" "}
                          {getQuestionTypeLabel(question.questionType)}
                        </p>

                        {question.data?.chartType !== "text" ? (
                          <div style={{ height: "320px" }}>
                            <canvas
                              ref={(ref) =>
                                ref && renderAnalyticsChart(ref, question)
                              }
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {question.data?.answers?.map((answer, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <p className="text-gray-700">{answer}</p>
                              </div>
                            ))}
                            {question.data?.totalAnswers >
                              question.data?.answers?.length && (
                              <p className="text-sm text-gray-500 text-center">
                                Показано {question.data?.answers?.length} з{" "}
                                {question.data?.totalAnswers}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="mt-4 text-gray-600">
                      Немає даних для аналітики
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div className="space-y-4">
                {survey?.questions?.map((question, index) => (
                  <div
                    key={question._id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {index + 1}. {question.questionText}
                        {question.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {getQuestionTypeLabel(question.questionType)}
                      </span>
                    </div>

                    {["radio", "checkbox"].includes(question.questionType) &&
                      question.options?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {question.options.map((option, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 text-gray-700"
                            >
                              <span>
                                {question.questionType === "radio"
                                  ? "⭕"
                                  : "☑️"}
                              </span>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {question.questionType === "rating" && (
                      <div className="mt-3 flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-6 h-6 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Загальні налаштування
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-700">
                          Дозволити анонімні відповіді
                        </p>
                        <p className="text-sm text-gray-500">
                          Користувачі можуть проходити без реєстрації
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          survey?.settings?.allowAnonymous
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey?.settings?.allowAnonymous
                          ? "✓ Увімкнено"
                          : "✗ Вимкнено"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-700">
                          Одна відповідь на користувача
                        </p>
                        <p className="text-sm text-gray-500">
                          Обмеження повторного проходження
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          survey?.settings?.oneResponsePerUser
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey?.settings?.oneResponsePerUser
                          ? "✓ Увімкнено"
                          : "✗ Вимкнено"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-700">
                          Показувати результати
                        </p>
                        <p className="text-sm text-gray-500">
                          Публічний доступ до результатів
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          survey?.settings?.showResults
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey?.settings?.showResults
                          ? "✓ Увімкнено"
                          : "✗ Вимкнено"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-700">
                          Дата закриття
                        </p>
                        <p className="text-sm text-gray-500">
                          {survey?.settings?.closeDate
                            ? formatDate(survey.settings.closeDate)
                            : "Не встановлено"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Інформація
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дата створення:</span>
                      <span className="font-semibold">
                        {formatDate(survey?.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Унікальний код:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {survey?.uniqueLink}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyDetailPage;

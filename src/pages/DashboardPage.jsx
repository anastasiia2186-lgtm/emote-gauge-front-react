import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import auth from "../services/auth";
import utils from "../utils/utils";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Перевірка автентифікації
    if (!auth.requireAuth()) return;

    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Завантаження користувача
      const userData = await api.getMe();
      setUser(userData.user);

      // Завантаження опитувань
      const surveysData = await api.getSurveys();
      setSurveys(surveysData.data || []);
    } catch (error) {
      console.error("Init error:", error);
      utils.showToast("Помилка завантаження даних", "error");

      // Якщо токен недійсний - розлогінити
      if (
        error.message.includes("авторизовано") ||
        error.message.includes("токен")
      ) {
        auth.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const activeSurveysCount = surveys.filter((s) => s.isActive).length;
  const totalResponses = surveys.reduce(
    (sum, s) => sum + (s.responseCount || 0),
    0
  );

  const formatDate = (date) => {
    return utils.formatDate(date);
  };

  const copyLink = (uniqueLink) => {
    const url = `${window.location.origin}/pages/take-survey.html?link=${uniqueLink}`;
    utils.copyToClipboard(url);
  };

  const deleteSurvey = async (id) => {
    if (
      !window.confirm("Ви впевнені? Це видалить опитування та всі відповіді.")
    ) {
      return;
    }

    try {
      await api.deleteSurvey(id);
      setSurveys(surveys.filter((s) => s._id !== id));
      utils.showToast("Опитування видалено");
    } catch (error) {
      utils.showToast(error.message, "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Ви впевнені, що хочете вийти?")) {
      auth.logout();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">📊 Survey App</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      <span>
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block">
                    {user?.username || "User"}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Профіль
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚙️ Налаштування
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      🚪 Вийти
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Мої опитування</h2>
            <p className="text-gray-600 mt-1">
              Керуйте своїми опитуваннями та переглядайте результати
            </p>
          </div>

          <Link
            to="/create-survey"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Створити опитування</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Всього опитувань</p>
                <p className="text-3xl font-bold text-gray-900">
                  {surveys.length}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Активні опитування</p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeSurveysCount}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Всього відповідей</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalResponses}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-purple-600"
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Завантаження...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && surveys.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Немає опитувань
            </h3>
            <p className="mt-2 text-gray-600">
              Почніть з створення вашого першого опитування
            </p>
            <Link
              to="/create-survey"
              className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Створити опитування
            </Link>
          </div>
        )}

        {/* Surveys Grid */}
        {!loading && surveys.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div
                key={survey._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Cover Image */}
                <div
                  className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 relative"
                  style={
                    survey.coverImage?.url
                      ? {
                          backgroundImage: `url('${survey.coverImage.url}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}
                  }
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        survey.isActive ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {survey.isActive ? "🟢 Активне" : "🔴 Неактивне"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                    {survey.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {survey.description || "Без опису"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      <span>{survey.responseCount} відповідей</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatDate(survey.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/pages/survey-detail.html?id=${survey._id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Переглянути
                    </Link>

                    <button
                      onClick={() => copyLink(survey.uniqueLink)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      title="Копіювати посилання"
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
                    </button>

                    <button
                      onClick={() => deleteSurvey(survey._id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Видалити"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

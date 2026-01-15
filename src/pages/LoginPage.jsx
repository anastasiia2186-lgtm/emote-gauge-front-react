import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import auth from "../services/auth";
import utils from "../utils/utils";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  // Перенаправлення якщо вже залогінений
  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate("/pages/dashboard.html");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setNeedsVerification(false);
    setLoading(true);

    try {
      const data = await api.login(form);

      // Зберігаємо токен та користувача
      auth.login(data.token, data.user);
      utils.showToast("Успішний вхід!");

      // Перенаправлення на dashboard
      setTimeout(() => {
        navigate("/pages/dashboard.html");
      }, 1000);
    } catch (error) {
      setErrorMessage(error.message);

      // Перевірка чи потрібна верифікація
      if (
        error.message.includes("підтвердіть email") ||
        error.message.includes("verification")
      ) {
        setNeedsVerification(true);
      }

      utils.showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!form.email) {
      utils.showToast("Введіть email", "error");
      return;
    }

    try {
      await api.resendVerification(form.email);
      utils.showToast("Email відправлено! Перевірте пошту.");
    } catch (error) {
      utils.showToast(error.message, "error");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Emoti Gauge</h1>
            <p className="text-gray-600 mt-2">
              Увійдіть у свій обліковий запис
            </p>
          </div>

          {/* Alert для неверифікованого email */}
          {needsVerification && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 transition-all">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Будь ласка, підтвердіть email перед входом.{" "}
                    <button
                      onClick={resendVerification}
                      className="font-semibold underline hover:text-yellow-800"
                    >
                      Відправити ще раз
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {!showPassword ? (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right mb-6">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Забули пароль?
              </Link>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Завантаження..." : "Увійти"}
            </button>
          </form>

          {/* Link to Register */}
          <p className="text-center text-gray-600 mt-6">
            Немає облікового запису?{" "}
            <Link
              to="/pages/register.html"
              className="text-blue-600 hover:underline font-semibold"
            >
              Зареєструватися
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

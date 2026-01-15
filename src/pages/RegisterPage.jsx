import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import auth from "../services/auth";
import utils from "../utils/utils";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    // Очищаємо помилку при зміні поля
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (form.username.length < 3) {
      newErrors.username = "Мінімум 3 символи";
    }

    if (!utils.isValidEmail(form.email)) {
      newErrors.email = "Невалідний email";
    }

    if (form.password.length < 6) {
      newErrors.password = "Мінімум 6 символів";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.register(form);

      utils.showToast("Реєстрація успішна! Перевірте email для підтвердження.");

      // Перенаправлення на сторінку логіну
      setTimeout(() => {
        navigate("/pages/login.html");
      }, 2000);
    } catch (error) {
      setErrors({ general: error.message });
      utils.showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Emoti Gauge</h1>
            <p className="text-gray-600 mt-2">Створіть свій обліковий запис</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Імʼя користувача
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="johndoe"
                required
                minLength="3"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

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
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength="6"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Завантаження..." : "Зареєструватися"}
            </button>
          </form>

          {/* Link to Login */}
          <p className="text-center text-gray-600 mt-6">
            Вже маєте обліковий запис?{" "}
            <Link
              to="/pages/login.html"
              className="text-blue-600 hover:underline font-semibold"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

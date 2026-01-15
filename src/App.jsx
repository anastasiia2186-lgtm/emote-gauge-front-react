import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateSurveyPage from "./pages/CreateSurveyPage";
import SurveyDetailPage from "./pages/SurveyDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Головна сторінка - редірект на реєстрацію */}
        <Route path="/" element={<Navigate to="/register" replace />} />

        {/* Сторінки */}
        <Route path="/pages/register.html" element={<RegisterPage />} />
        <Route path="/pages/login.html" element={<LoginPage />} />
        <Route path="/pages/dashboard.html" element={<DashboardPage />} />
        <Route
          path="/pages/create-survey.html"
          element={<CreateSurveyPage />}
        />
        <Route
          path="/pages/survey-detail.html"
          element={<SurveyDetailPage />}
        />

        {/* TODO в майбутньому */}
        <Route
          path="/reset-password"
          element={<div>Reset Password (TODO)</div>}
        />
        <Route
          path="/forgot-password"
          element={<div>Forgot Password (TODO)</div>}
        />

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

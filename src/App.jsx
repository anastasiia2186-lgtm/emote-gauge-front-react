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
        <Route
          path="/"
          element={<Navigate to="/pages/register.html" replace />}
        />

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

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

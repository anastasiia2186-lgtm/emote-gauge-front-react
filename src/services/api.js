const API_URL = "http://localhost:5010/api";
// const API_URL = "https://emoti-gauge-back.onrender.com/api";

class API {
  constructor() {
    this.baseURL = API_URL;
  }

  // Отримання токена
  getToken() {
    return localStorage.getItem("token");
  }

  // Базовий fetch з автентифікацією
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Щось пішло не так");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.fetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.fetch("/auth/me");
  }

  async verifyEmail(token) {
    return this.fetch(`/auth/verify-email/${token}`, {
      method: "PUT",
    });
  }

  async resendVerification(email) {
    return this.fetch("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email) {
    return this.fetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return this.fetch(`/auth/reset-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  }

  // Survey endpoints
  async createSurvey(surveyData) {
    return this.fetch("/surveys", {
      method: "POST",
      body: JSON.stringify(surveyData),
    });
  }

  async getSurveys() {
    return this.fetch("/surveys");
  }

  async getSurvey(id) {
    return this.fetch(`/surveys/${id}`);
  }

  async updateSurvey(id, surveyData) {
    return this.fetch(`/surveys/${id}`, {
      method: "PUT",
      body: JSON.stringify(surveyData),
    });
  }

  async deleteSurvey(id) {
    return this.fetch(`/surveys/${id}`, {
      method: "DELETE",
    });
  }

  async regenerateLink(id) {
    return this.fetch(`/surveys/${id}/regenerate-link`, {
      method: "POST",
    });
  }

  async getSurveyStats(id) {
    return this.fetch(`/surveys/${id}/stats`);
  }

  async getSurveyAnalytics(id) {
    return this.fetch(`/surveys/${id}/analytics`);
  }

  // Public endpoints
  async getPublicSurvey(uniqueLink) {
    return this.fetch(`/public/survey/${uniqueLink}`);
  }

  async submitResponse(uniqueLink, responseData) {
    return this.fetch(`/public/survey/${uniqueLink}/submit`, {
      method: "POST",
      body: JSON.stringify(responseData),
    });
  }

  async getSurveyResults(uniqueLink) {
    return this.fetch(`/public/survey/${uniqueLink}/results`);
  }

  // Upload endpoints
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/upload/avatar`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message); // TODO обробити помилку
    }

    return response.json();
  }

  async deleteAvatar() {
    return this.fetch("/upload/avatar", {
      method: "DELETE",
    });
  }

  async uploadSurveyCover(surveyId, file) {
    const formData = new FormData();
    formData.append("cover", file);

    const token = this.getToken();
    const response = await fetch(
      `${this.baseURL}/upload/survey/${surveyId}/cover`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message); // TODO обробити помилку
    }

    return response.json();
  }

  async deleteSurveyCover(surveyId) {
    return this.fetch(`/upload/survey/${surveyId}/cover`, {
      method: "DELETE",
    });
  }
}

// Export single instance
const api = new API();

export default api;

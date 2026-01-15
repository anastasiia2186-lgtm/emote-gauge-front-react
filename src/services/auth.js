const auth = {
  // Зберегти токен та користувача
  login(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  // Видалити токен та користувача
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/login.html";
  },

  // Отримати токен
  getToken() {
    return localStorage.getItem("token");
  },

  // Отримати користувача
  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Перевірити чи користувач залогінений
  isAuthenticated() {
    return !!this.getToken();
  },

  // Перевірити верифікацію email
  isEmailVerified() {
    const user = this.getUser();
    return user?.isVerified || false;
  },

  // Middleware для захищених сторінок
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "/pages/login.html";
      return false;
    }
    return true;
  },

  // Middleware для гостьових сторінок
  requireGuest() {
    if (this.isAuthenticated()) {
      window.location.href = "/pages/dashboard.html";
      return false;
    }
    return true;
  },
};

export default auth;

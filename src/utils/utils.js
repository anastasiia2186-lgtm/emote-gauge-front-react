const utils = {
  // Показати toast повідомлення
  showToast(message, type = "success") {
    // Можна використати Alpine.js store або простий alert
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  // Форматування дати
  formatDate(date) {
    return new Date(date).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Валідація email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Копіювання в буфер обміну
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast("Скопійовано!");
    } catch (error) {
      console.error("Copy failed:", error);
      this.showToast("Помилка копіювання", "error");
    }
  },

  // Debounce функція
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

export default utils;

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import auth from "../services/auth";
import utils from "../utils/utils";

const CreateSurveyPage = () => {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState({
    title: "",
    description: "",
    questions: [],
    settings: {
      allowAnonymous: true,
      oneResponsePerUser: false,
      showResults: false,
      closeDate: null,
    },
  });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    if (!auth.requireAuth()) return;
    loadDraft();
  }, []);

  const saveDraft = () => {
    localStorage.setItem("survey_draft", JSON.stringify(survey));
    utils.showToast("Чернетку збережено");
  };

  const loadDraft = () => {
    const draft = localStorage.getItem("survey_draft");
    if (draft) {
      try {
        setSurvey(JSON.parse(draft));
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("survey_draft");
  };

  const addQuestion = () => {
    setSurvey((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          questionType: "text",
          options: [""],
          required: false,
          order: prev.questions.length,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (window.confirm("Видалити це питання?")) {
      setSurvey((prev) => ({
        ...prev,
        questions: prev.questions
          .filter((_, i) => i !== index)
          .map((q, i) => ({ ...q, order: i })),
      }));
    }
  };

  const updateQuestion = (index, field, value) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleQuestionTypeChange = (index, newType) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      const question = newQuestions[index];
      question.questionType = newType;

      if (["radio", "checkbox"].includes(newType)) {
        if (!question.options || question.options.length === 0) {
          question.options = ["Варіант 1", "Варіант 2"];
        }
      } else {
        question.options = [];
      }

      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options.push("");
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options[optionIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const moveItem = (from, to) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions];
      const [movedItem] = newQuestions.splice(from, 1);
      newQuestions.splice(to, 0, movedItem);
      return {
        ...prev,
        questions: newQuestions.map((q, i) => ({ ...q, order: i })),
      };
    });
    setDragging(to);
  };

  const handleCoverImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      utils.showToast("Файл занадто великий (макс. 10MB)", "error");
      return;
    }

    setCoverImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  const validateForm = () => {
    if (!survey.title.trim()) {
      utils.showToast("Введіть назву опитування", "error");
      return false;
    }

    if (survey.questions.length === 0) {
      utils.showToast("Додайте хоча б одне питання", "error");
      return false;
    }

    for (let i = 0; i < survey.questions.length; i++) {
      const q = survey.questions[i];

      if (!q.questionText.trim()) {
        utils.showToast(`Введіть текст для питання ${i + 1}`, "error");
        return false;
      }

      if (["radio", "checkbox"].includes(q.questionType)) {
        const validOptions = q.options.filter((opt) => opt.trim());

        if (validOptions.length < 2) {
          utils.showToast(
            `Питання ${i + 1}: додайте мінімум 2 варіанти`,
            "error"
          );
          return false;
        }

        q.options = validOptions;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const surveyData = await api.createSurvey(survey);
      const surveyId = surveyData.data._id;

      utils.showToast("Опитування створено!");

      if (coverImageFile) {
        try {
          await api.uploadSurveyCover(surveyId, coverImageFile);
        } catch (error) {
          console.error("Cover upload failed:", error);
        }
      }

      clearDraft();

      setTimeout(() => {
        navigate(`/survey-detail?id=${surveyId}`);
      }, 1500);
    } catch (error) {
      utils.showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/pages/dashboard.html"
                className="text-xl font-bold text-gray-800"
              >
                📊 Survey App
              </Link>
              <span className="ml-4 text-gray-400">|</span>
              <span className="ml-4 text-gray-600">Створення опитування</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={saveDraft}
                className="text-gray-600 hover:text-gray-900"
              >
                💾 Зберегти чернетку
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Основна інформація
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Назва опитування *
              </label>
              <input
                type="text"
                value={survey.title}
                onChange={(e) =>
                  setSurvey({ ...survey, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Наприклад: Опитування задоволеності клієнтів"
                required
                maxLength="200"
              />
              <p className="text-sm text-gray-500 mt-1">
                {survey.title.length}/200 символів
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Опис (опціонально)
              </label>
              <textarea
                value={survey.description}
                onChange={(e) =>
                  setSurvey({ ...survey, description: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Короткий опис вашого опитування..."
                maxLength="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                {survey.description.length}/1000 символів
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Обкладинка (опціонально)
              </label>

              {!coverImagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <label className="mt-2 inline-block cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-semibold">
                      Завантажити зображення
                    </span>
                    <input
                      type="file"
                      onChange={handleCoverImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, GIF до 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Питання</h2>

            {survey.questions.length > 0 && (
              <div className="space-y-4">
                {survey.questions.map((question, index) => (
                  <div
                    key={index}
                    className={`bg-gray-50 rounded-lg p-6 border-2 border-gray-200 transition-all hover:shadow-md ${
                      dragging === index ? "opacity-50 border-blue-400" : ""
                    }`}
                    draggable
                    onDragStart={() => setDragging(index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragging !== index) moveItem(dragging, index);
                    }}
                    onDragEnd={() => setDragging(null)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
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
                              d="M4 8h16M4 16h16"
                            />
                          </svg>
                        </button>
                        <span className="font-bold text-gray-700">
                          Питання {index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700"
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

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Текст питання *
                      </label>
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestion(index, "questionText", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Введіть ваше питання..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Тип питання *
                        </label>
                        <select
                          value={question.questionType}
                          onChange={(e) =>
                            handleQuestionTypeChange(index, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Коротка відповідь</option>
                          <option value="textarea">Довга відповідь</option>
                          <option value="radio">Один варіант</option>
                          <option value="checkbox">Кілька варіантів</option>
                          <option value="rating">Рейтинг (1-5)</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "required",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            Обов'язкове питання
                          </span>
                        </label>
                      </div>
                    </div>

                    {["radio", "checkbox"].includes(question.questionType) && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Варіанти відповідей *
                        </label>
                        <div className="space-y-2 mb-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={option}
                                onChange={(e) =>
                                  updateOption(index, optIndex, e.target.value)
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={`Варіант ${optIndex + 1}`}
                              />
                              {question.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optIndex)}
                                  className="text-red-600"
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center space-x-1"
                        >
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Додати варіант</span>
                        </button>
                      </div>
                    )}

                    {question.questionType === "rating" && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Прев'ю:</p>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="w-8 h-8 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {survey.questions.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <p className="mt-2 text-gray-600">Немає питань</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + Додати перше питання
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 mt-4"
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
              <span>Додати питання</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Налаштування
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Дата закриття (опціонально)
                </label>
                <input
                  type="datetime-local"
                  value={survey.settings.closeDate || ""}
                  onChange={(e) =>
                    setSurvey({
                      ...survey,
                      settings: {
                        ...survey.settings,
                        closeDate: e.target.value,
                      },
                    })
                  }
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={survey.settings.allowAnonymous}
                  onChange={(e) =>
                    setSurvey({
                      ...survey,
                      settings: {
                        ...survey.settings,
                        allowAnonymous: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-700">
                    Дозволити анонімні відповіді
                  </p>
                  <p className="text-sm text-gray-500">
                    Користувачі можуть проходити без реєстрації
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={survey.settings.oneResponsePerUser}
                  onChange={(e) =>
                    setSurvey({
                      ...survey,
                      settings: {
                        ...survey.settings,
                        oneResponsePerUser: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-700">
                    Одна відповідь на користувача
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={survey.settings.showResults}
                  onChange={(e) =>
                    setSurvey({
                      ...survey,
                      settings: {
                        ...survey.settings,
                        showResults: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-700">
                    Показувати результати
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/pages/dashboard.html"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition"
            >
              Скасувати
            </Link>
            <button
              type="submit"
              disabled={loading || survey.questions.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
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
              )}
              <span>{loading ? "Створення..." : "Створити опитування"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateSurveyPage;

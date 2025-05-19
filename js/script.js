document.addEventListener("DOMContentLoaded", function () {
  // DOM элементы
  const timeSlotsContainer = document.getElementById("time-slots");
  const bookingModal = document.getElementById("booking-modal");
  const closeBtn = document.querySelector(".close");
  const bookingForm = document.getElementById("booking-form");
  const selectedSlotIdInput = document.getElementById("selected-slot-id");
  const weekDaysContainer = document.getElementById("week-days");
  const prevWeekBtn = document.getElementById("prev-week");
  const nextWeekBtn = document.getElementById("next-week");
  const mastersContainer = document.getElementById("master-select");
  const selectedTimeDisplay = document.getElementById("selected-time-display");
  const serviceSelect = document.getElementById("service-select");
  const categorySelect = document.getElementById("category-select");

  // Состояние приложения
  let currentWeekStart = getStartOfWeek(new Date());
  let selectedDate = new Date();
  let selectedMasterId = null;
  let isLoading = false;
  let masters = [];
  let categories = [];
  let services = [];

  // Вспомогательные функции
  function showAlert(message, type = "info") {
    const alertBox = document.createElement("div");
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, 3000);
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function formatDayDate(date) {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const months = [
      "янв",
      "фев",
      "мар",
      "апр",
      "мая",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ];
    return `${
      days[date.getDay()]
    }, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // Функции работы с данными
  async function loadCategories() {
    try {
      const response = await fetch("php/get_categories.php");
      const data = await response.json();

      if (data.success) {
        categories = data.categories;
        renderCategorySelect();
      } else {
        throw new Error(data.message || "Ошибка загрузки категорий");
      }
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
      showAlert("Не удалось загрузить список категорий", "error");
    }
  }

  async function loadMasters(categoryId = null) {
    try {
      let url = "php/get_masters.php";
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        masters = data.masters;
        renderMasterSelect();
      } else {
        throw new Error(data.message || "Ошибка загрузки мастеров");
      }
    } catch (error) {
      console.error("Ошибка загрузки мастеров:", error);
      showAlert("Не удалось загрузить список мастеров", "error");
    }
  }

  async function loadServices(categoryId) {
    try {
      const response = await fetch(
        `php/get_services.php?category_id=${categoryId}`
      );
      const data = await response.json();

      if (data.success) {
        services = data.services;
        renderServiceSelect();
      } else {
        throw new Error(data.message || "Ошибка загрузки услуг");
      }
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
      showAlert("Не удалось загрузить список услуг", "error");
    }
  }

  async function loadAvailableSlots(date) {
    if (!selectedMasterId) {
      timeSlotsContainer.innerHTML =
        "<p class='info-message'>Сначала выберите мастера</p>";
      return;
    }

    try {
      isLoading = true;
      timeSlotsContainer.innerHTML =
        "<div class='loading-spinner'></div><p class='loading-message'>Загрузка расписания...</p>";

      const response = await fetch(
        `php/get_available_slots.php?date=${date}&master_id=${selectedMasterId}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Ошибка сервера");
      }

      renderTimeSlots(data.slots);
    } catch (error) {
      console.error("Ошибка:", error);
      timeSlotsContainer.innerHTML = `<p class='error-message'>Ошибка: ${error.message}</p>`;
    } finally {
      isLoading = false;
    }
  }

  // Функции отрисовки
  function renderTimeSlots(slots) {
    timeSlotsContainer.innerHTML = "";

    if (slots.length === 0) {
      timeSlotsContainer.innerHTML =
        "<p class='info-message'>Нет доступных слотов на выбранную дату</p>";
      return;
    }

    slots.forEach((slot) => {
      const slotElement = document.createElement("div");
      slotElement.className = slot.is_booked ? "time-slot booked" : "time-slot";
      slotElement.textContent = slot.slot_time;
      slotElement.title = slot.is_booked
        ? "Это время уже занято"
        : "Нажмите для записи";

      if (!slot.is_booked) {
        slotElement.addEventListener("click", () => {
          openBookingModal(slot.id, slot.slot_time);
        });
      }

      timeSlotsContainer.appendChild(slotElement);
    });
  }

  function renderWeekDays() {
    weekDaysContainer.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);

      const dayElement = document.createElement("div");
      dayElement.className = "day-tab";
      if (date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add("active");
      }

      if (isPastDate(date)) {
        dayElement.classList.add("past-date");
      }

      dayElement.textContent = formatDayDate(date);
      dayElement.dataset.date = formatDate(date);

      if (!isPastDate(date)) {
        dayElement.addEventListener("click", function () {
          selectedDate = date;
          document.querySelectorAll(".day-tab").forEach((tab) => {
            tab.classList.remove("active");
          });
          this.classList.add("active");
          if (selectedMasterId) {
            loadAvailableSlots(this.dataset.date);
          }
        });
      }

      weekDaysContainer.appendChild(dayElement);
    }
  }

  function renderCategorySelect() {
    categorySelect.innerHTML = '<option value="">Выберите категорию</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }

  function renderMasterSelect() {
    mastersContainer.innerHTML = '<option value="">Выберите мастера</option>';

    masters.forEach((master) => {
      const option = document.createElement("option");
      option.value = master.id;
      option.textContent = `${master.name} (${master.specialization})`;
      mastersContainer.appendChild(option);
    });
  }

  function renderServiceSelect() {
    serviceSelect.innerHTML = '<option value="">Выберите услугу</option>';

    services.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = `${service.name} (${service.price} руб.)`;
      serviceSelect.appendChild(option);
    });
  }

  // Функции работы с UI
  function openBookingModal(slotId, slotTime) {
    selectedSlotIdInput.value = slotId;
    selectedTimeDisplay.textContent = `Выбранное время: ${slotTime}`;
    bookingForm.reset();
    bookingModal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    bookingModal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  function updateWeekView() {
    renderWeekDays();
    selectedDate = new Date(currentWeekStart);
    if (selectedMasterId) {
      loadAvailableSlots(formatDate(selectedDate));
    }
  }

  // Валидация формы
  function validateForm(formData) {
    if (!formData.name || formData.name.length < 2) {
      showAlert("Имя должно содержать минимум 2 символа", "error");
      return false;
    }

    if (!formData.phone || !/^[\d\+][\d\s\-\(\)]{7,}$/.test(formData.phone)) {
      showAlert("Введите корректный номер телефона", "error");
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("Введите корректный email", "error");
      return false;
    }

    if (!formData.service_id) {
      showAlert("Пожалуйста, выберите услугу", "error");
      return false;
    }

    return true;
  }

  // Обработчики событий
  function setupEventListeners() {
    prevWeekBtn.addEventListener("click", () => {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      updateWeekView();
    });

    nextWeekBtn.addEventListener("click", () => {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      updateWeekView();
    });

    closeBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (event) => {
      if (event.target === bookingModal) {
        closeModal();
      }
    });

    categorySelect.addEventListener("change", (e) => {
      const categoryId = e.target.value;
      if (categoryId) {
        loadMasters(categoryId);
        loadServices(categoryId);
        document.getElementById("master-booking-section").style.display =
          "none";
      }
    });

    mastersContainer.addEventListener("change", (e) => {
      selectedMasterId = e.target.value;
      if (selectedMasterId) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        document.getElementById("master-name").textContent =
          selectedOption.text.split(" (")[0];
        document.getElementById("master-booking-section").style.display =
          "block";
        loadAvailableSlots(formatDate(selectedDate));
      }
    });

    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!selectedMasterId) {
        showAlert("Пожалуйста, выберите мастера", "error");
        return;
      }

      const formData = {
        slot_id: selectedSlotIdInput.value,
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        master_id: selectedMasterId,
        service_id: serviceSelect.value,
      };

      if (!validateForm(formData)) return;

      try {
        const response = await fetch("php/book_slot.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Невалидный JSON ответ:", text);
          throw new Error("Ошибка сервера: неверный формат ответа");
        }

        if (!data.success) {
          throw new Error(data.message || "Ошибка при бронировании");
        }

        showAlert(
          `Вы успешно записаны на ${data.slot_date} в ${data.slot_time} к мастеру ${data.master_name}`,
          "success"
        );
        closeModal();
        loadAvailableSlots(formatDate(selectedDate));
      } catch (error) {
        console.error("Ошибка бронирования:", error);
        showAlert(`Ошибка бронирования: ${error.message}`, "error");
      }
    });
  }

  // Инициализация приложения
  async function init() {
    renderWeekDays();
    await loadCategories();
    setupEventListeners();
  }

  // Запуск приложения
  init();
});

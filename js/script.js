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
  const mastersContainer = document.querySelector(".masters-grid");
  const selectedTimeDisplay = document.getElementById("selected-time-display");

  // Состояние приложения
  let currentWeekStart = getStartOfWeek(new Date());
  let selectedDate = new Date();
  let selectedMasterId = null;
  let isLoading = false;
  let masters = [];

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

  // Функции работы с данными
  async function loadMasters() {
    try {
      const response = await fetch("php/get_masters.php");
      const data = await response.json();

      if (data.success) {
        masters = data.masters;
        renderMasters();
      } else {
        throw new Error(data.message || "Ошибка загрузки мастеров");
      }
    } catch (error) {
      console.error("Ошибка загрузки мастеров:", error);
      showAlert("Не удалось загрузить список мастеров", "error");
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
      console.log(data.slots);
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

      dayElement.textContent = formatDayDate(date);
      dayElement.dataset.date = formatDate(date);

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

      weekDaysContainer.appendChild(dayElement);
    }
  }

  function renderMasters() {
    mastersContainer.innerHTML = "";

    if (masters.length === 0) {
      mastersContainer.innerHTML =
        "<p class='info-message'>Мастера не найдены</p>";
      return;
    }

    masters.forEach((master) => {
      const masterCard = document.createElement("div");
      masterCard.className = "master-card";
      masterCard.dataset.masterId = master.id;

      // Проверяем и форматируем рейтинг
      let rating = parseFloat(master.rating);
      if (isNaN(rating)) {
        rating = 0; // Значение по умолчанию, если рейтинг не число
      }
      const ratingFixed = rating.toFixed ? rating.toFixed(1) : rating;

      // Проверяем и устанавливаем фото мастера
      const masterPhoto = master.photo || "images/default-master.jpg";

      masterCard.innerHTML = `
      <img src="${masterPhoto}" alt="${
        master.name || "Мастер"
      }" class="master-photo">
      <div class="master-info">
        <h3>${master.name || "Имя не указано"}</h3>
        <p class="specialization">${
          master.specialization || "Специализация не указана"
        }</p>
        <p class="experience">Опыт: ${master.experience || "0"} лет</p>
        <div class="rating">
          <span class="stars">${"★".repeat(Math.floor(rating))}${"☆".repeat(
        5 - Math.floor(rating)
      )}</span>
          <span class="rating-value">${ratingFixed}</span>
        </div>
      </div>
    `;

      mastersContainer.appendChild(masterCard);
    });

    setupMasterSelection();
  }

  // Функции работы с UI
  function setupMasterSelection() {
    document.querySelectorAll(".master-card").forEach((card) => {
      card.addEventListener("click", function () {
        selectMaster(this);
      });
    });
  }

  function selectMaster(card) {
    document.querySelectorAll(".master-card").forEach((c) => {
      c.classList.remove("selected");
    });

    card.classList.add("selected");
    selectedMasterId = card.dataset.masterId;

    // Получаем имя мастера из карточки
    const masterName = card.querySelector("h3").textContent;
    document.getElementById("master-name").textContent = masterName;

    // Показываем секцию записи
    document.getElementById("master-booking-section").style.display = "block";

    // Прокручиваем к секции записи
    document
      .getElementById("master-booking-section")
      .scrollIntoView({ behavior: "smooth" });

    loadAvailableSlots(formatDate(selectedDate));
  }

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

        // Проверяем, что ответ действительно JSON
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
    await loadMasters();
    setupEventListeners();
  }

  // Запуск приложения
  init();
});

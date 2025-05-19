document.addEventListener("DOMContentLoaded", function () {
  const masterSelect = document.getElementById("master-select");
  const dateFilter = document.getElementById("date-filter");
  const refreshBtn = document.getElementById("refresh-btn");
  const bookingsBody = document.getElementById("bookings-body");
  const noBookingsMsg = document.getElementById("no-bookings");

  // Устанавливаем сегодняшнюю дату по умолчанию
  dateFilter.valueAsDate = new Date();

  // Загружаем мастеров
  loadMasters();

  // Загружаем записи
  loadBookings();

  // Обработчики событий
  masterSelect.addEventListener("change", loadBookings);
  dateFilter.addEventListener("change", loadBookings);
  refreshBtn.addEventListener("click", loadBookings);

  // Функция загрузки мастеров
  async function loadMasters() {
    try {
      const response = await fetch("../php/get_masters.php");
      const data = await response.json();

      if (data.success) {
        data.masters.forEach((master) => {
          const option = document.createElement("option");
          option.value = master.id;
          option.textContent = `${master.name} (${master.specialization})`;
          masterSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки мастеров:", error);
    }
  }

  // Функция загрузки записей
  async function loadBookings() {
    try {
      const masterId = masterSelect.value;
      const date = dateFilter.value;

      let url = "../php/master_pages/get_bookings.php";
      const params = new URLSearchParams();

      if (masterId) params.append("master_id", masterId);
      if (date) params.append("date", date);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      bookingsBody.innerHTML = "";

      if (data.success && data.bookings.length > 0) {
        noBookingsMsg.style.display = "none";

        data.bookings.forEach((booking) => {
          const row = document.createElement("tr");

          row.innerHTML = `
                                <td>${booking.slot_date}</td>
                                <td>${booking.slot_time}</td>
                                <td>${booking.master_name}</td>
                                <td>${booking.booked_by_name}</td>
                                <td>${booking.booked_by_phone}</td>
                                <td>${booking.service_name || "Не указана"}</td>
                            `;

          bookingsBody.appendChild(row);
        });
      } else {
        noBookingsMsg.style.display = "block";
      }
    } catch (error) {
      console.error("Ошибка загрузки записей:", error);
    }
  }
});

(() => {
  const API_BASE = "http://127.0.0.1:8000";

  let selectedDate = "";
  let selectedStart = "";
  let selectedEnd = "";

  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  let currentLang = "pt";

  const translations = {
    pt: {
      weekdays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      noDate: "Nenhuma data selecionada.",
      noSlot: "Nenhum horário selecionado.",
      noBooking: "Nenhuma reserva criada ainda.",
      noCancel: "Nenhum cancelamento enviado ainda.",
      noSlots: "Nenhum horário disponível para esta data.",
      loadingSlots: "Carregando horários disponíveis...",
      loadSlotsError: "Não foi possível carregar os horários disponíveis.",
      selectSlotFirst: "Selecione primeiro um horário disponível.",
      fillNameEmail: "Preencha nome e email.",
      creatingBooking: "Criando reserva...",
      bookingFailed: "Falha ao criar reserva.",
      bookingSuccess: "Reserva criada com sucesso.",
      tokenDemo: (email) => `Nesta demo, o token de cancelamento é exibido na tela. O próximo passo é enviá-lo automaticamente para ${email}.`,
      copySuccess: "Token copiado com sucesso.",
      copyFail: "Não foi possível copiar automaticamente. Copie manualmente.",
      noTokenToCopy: "Nenhum token disponível para copiar.",
      enterCancelToken: "Digite um token de cancelamento.",
      cancelling: "Cancelando appointment...",
      cancelFailed: "Falha ao cancelar appointment.",
      cancelSuccess: "Appointment cancelado com sucesso.",
      cancelPlaceholder: "Cole o token de cancelamento aqui"
    },
    en: {
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      noDate: "No date selected yet.",
      noSlot: "No slot selected yet.",
      noBooking: "No booking created yet.",
      noCancel: "No cancellation submitted yet.",
      noSlots: "No available slots found for this date.",
      loadingSlots: "Loading available slots...",
      loadSlotsError: "Could not load available slots.",
      selectSlotFirst: "Please select an available slot first.",
      fillNameEmail: "Please fill in name and email.",
      creatingBooking: "Creating booking...",
      bookingFailed: "Booking failed.",
      bookingSuccess: "Booking created successfully.",
      tokenDemo: (email) => `For this demo, the cancellation token is shown on screen. The next step is to send it automatically to ${email}.`,
      copySuccess: "Token copied successfully.",
      copyFail: "Could not copy automatically. Please copy it manually.",
      noTokenToCopy: "No token available to copy.",
      enterCancelToken: "Please enter a cancel token.",
      cancelling: "Cancelling appointment...",
      cancelFailed: "Cancellation failed.",
      cancelSuccess: "Appointment cancelled successfully.",
      cancelPlaceholder: "Paste the cancel token here"
    }
  };

  function t(key) {
    return translations[currentLang][key];
  }

  function detectLanguage() {
    const saved =
      localStorage.getItem("siteLanguage") ||
      localStorage.getItem("preferredLanguage") ||
      localStorage.getItem("language") ||
      document.documentElement.lang ||
      "pt";

    currentLang = saved.startsWith("en") ? "en" : "pt";
  }

  function saveLanguage(lang) {
    localStorage.setItem("siteLanguage", lang);
    localStorage.setItem("preferredLanguage", lang);
    localStorage.setItem("language", lang);
  }

  function formatDate(year, month, day) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  function applyLanguage() {
    document.querySelectorAll("[data-pt][data-en]").forEach((el) => {
      el.textContent = currentLang === "pt" ? el.dataset.pt : el.dataset.en;
    });

    const langToggle = document.getElementById("langToggle");
    if (langToggle) langToggle.textContent = currentLang === "pt" ? "EN" : "PT";

    const selectedDateText = document.getElementById("selectedDateText");
    const selectedSlotText = document.getElementById("selectedSlotText");
    const bookStatusMessage = document.getElementById("bookStatusMessage");
    const cancelStatusMessage = document.getElementById("cancelStatusMessage");
    const bookingSuccessBanner = document.getElementById("bookingSuccessBanner");
    const cancelSuccessBanner = document.getElementById("cancelSuccessBanner");
    const cancelToken = document.getElementById("cancelToken");

    if (selectedDateText) selectedDateText.textContent = selectedDate || t("noDate");

    if (selectedSlotText) {
      selectedSlotText.textContent =
        selectedStart && selectedEnd
          ? `${selectedDate} | ${selectedStart} - ${selectedEnd}`
          : t("noSlot");
    }

    if (bookStatusMessage && !bookStatusMessage.dataset.hasContent) {
      bookStatusMessage.textContent = t("noBooking");
    }

    if (cancelStatusMessage && !cancelStatusMessage.dataset.hasContent) {
      cancelStatusMessage.textContent = t("noCancel");
    }

    if (bookingSuccessBanner) bookingSuccessBanner.textContent = t("bookingSuccess");
    if (cancelSuccessBanner) cancelSuccessBanner.textContent = t("cancelSuccess");
    if (cancelToken) cancelToken.placeholder = t("cancelPlaceholder");

    document.querySelectorAll("#calendarWeekdays span").forEach((el, index) => {
      el.textContent = translations[currentLang].weekdays[index];
    });

    renderCalendar();
  }

  function renderCalendar() {
    const monthLabel = document.getElementById("calendarMonthLabel");
    const calendarGrid = document.getElementById("calendarGrid");

    if (!monthLabel || !calendarGrid) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const locale = currentLang === "pt" ? "pt-BR" : "en-US";
    const monthName = firstDay.toLocaleString(locale, { month: "long" });

    monthLabel.textContent =
      `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${currentYear}`;

    calendarGrid.innerHTML = "";

    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement("div");
      empty.className = "scheduler-day empty";
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scheduler-day";
      btn.textContent = day;

      const dateStr = formatDate(currentYear, currentMonth, day);

      if (
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      ) {
        btn.classList.add("today");
      }

      if (selectedDate === dateStr) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => selectDate(dateStr));
      calendarGrid.appendChild(btn);
    }
  }

  function changeMonth(direction) {
    currentMonth += direction;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }

    renderCalendar();
  }

  async function selectDate(date) {
    selectedDate = date;
    selectedStart = "";
    selectedEnd = "";

    document.getElementById("selectedDateText").textContent = date;
    document.getElementById("selectedSlotText").textContent = t("noSlot");
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";

    document.querySelectorAll(".scheduler-slot-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    await loadSlots();
    renderCalendar();
  }

  async function loadSlots() {
    const slotsContainer = document.getElementById("slotsContainer");
    const slotsResult = document.getElementById("slotsResult");
    const slotsResultBox = document.getElementById("slotsResultBox");

    if (!selectedDate || !slotsContainer) return;

    slotsContainer.innerHTML = `<div class="scheduler-small">${t("loadingSlots")}</div>`;

    if (slotsResult) slotsResult.textContent = "";
    if (slotsResultBox) slotsResultBox.style.display = "none";

    try {
      const response = await fetch(`${API_BASE}/available-slots?date=${selectedDate}`);
      const data = await response.json();

      slotsContainer.innerHTML = "";

      if (!response.ok) {
        if (slotsResult) slotsResult.textContent = data.detail || t("loadSlotsError");
        if (slotsResultBox) slotsResultBox.style.display = "block";
        return;
      }

      if (!data.available_slots || data.available_slots.length === 0) {
        slotsContainer.innerHTML = `<div class="scheduler-small">${data.message || t("noSlots")}</div>`;
        return;
      }

      data.available_slots.forEach((slot) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scheduler-slot-btn";
        btn.textContent = `${slot.start} - ${slot.end}`;

        btn.addEventListener("click", () => selectSlot(slot.start, slot.end, btn));
        slotsContainer.appendChild(btn);
      });
    } catch (error) {
      slotsContainer.innerHTML = "";
      if (slotsResult) slotsResult.textContent = `Error loading slots: ${error.message || error}`;
      if (slotsResultBox) slotsResultBox.style.display = "block";
    }
  }

  function selectSlot(start, end, buttonEl) {
    selectedStart = start;
    selectedEnd = end;

    document.getElementById("startTime").value = start;
    document.getElementById("endTime").value = end;
    document.getElementById("selectedSlotText").textContent = `${selectedDate} | ${start} - ${end}`;

    document.querySelectorAll(".scheduler-slot-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    buttonEl.classList.add("active");
  }

  async function bookAppointment() {
    const statusMessage = document.getElementById("bookStatusMessage");
    const successPanel = document.getElementById("bookingSuccessPanel");
    const generatedCancelToken = document.getElementById("generatedCancelToken");
    const emailFeedback = document.getElementById("emailFeedback");
    const copyFeedback = document.getElementById("copyFeedback");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    statusMessage.dataset.hasContent = "true";
    successPanel.style.display = "none";
    generatedCancelToken.value = "";
    emailFeedback.textContent = "";
    copyFeedback.textContent = "";

    if (!selectedDate || !selectedStart || !selectedEnd) {
      statusMessage.innerHTML = `<div class="scheduler-error-banner">${t("selectSlotFirst")}</div>`;
      return;
    }

    if (!name || !email) {
      statusMessage.innerHTML = `<div class="scheduler-error-banner">${t("fillNameEmail")}</div>`;
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("appointment_date", selectedDate);
    formData.append("start_time", selectedStart);
    formData.append("end_time", selectedEnd);

    statusMessage.textContent = t("creatingBooking");

    try {
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        statusMessage.innerHTML = `<div class="scheduler-error-banner">${data.detail || t("bookingFailed")}</div>`;
        successPanel.style.display = "none";
        return;
      }

      statusMessage.textContent = "";
      successPanel.style.display = "block";

      if (data.cancel_token) {
        generatedCancelToken.value = data.cancel_token;
        document.getElementById("cancelToken").value = data.cancel_token;
      }

      emailFeedback.textContent = t("tokenDemo")(email);

      document.getElementById("name").value = "";
      document.getElementById("email").value = "";
      document.getElementById("startTime").value = "";
      document.getElementById("endTime").value = "";
      document.getElementById("selectedSlotText").textContent = t("noSlot");

      selectedStart = "";
      selectedEnd = "";

      document.querySelectorAll(".scheduler-slot-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      await loadSlots();
    } catch (error) {
      statusMessage.innerHTML = `<div class="scheduler-error-banner">Booking error: ${error.message || error}</div>`;
      successPanel.style.display = "none";
    }
  }

  async function copyCancelToken() {
    const tokenInput = document.getElementById("generatedCancelToken");
    const copyFeedback = document.getElementById("copyFeedback");

    if (!tokenInput.value) {
      copyFeedback.textContent = t("noTokenToCopy");
      return;
    }

    try {
      await navigator.clipboard.writeText(tokenInput.value);
      copyFeedback.textContent = t("copySuccess");
    } catch {
      copyFeedback.textContent = t("copyFail");
    }
  }

  async function cancelAppointment() {
    const cancelStatusMessage = document.getElementById("cancelStatusMessage");
    const cancelSuccessPanel = document.getElementById("cancelSuccessPanel");
    const cancelTokenInput = document.getElementById("cancelToken");

    cancelStatusMessage.dataset.hasContent = "true";
    cancelSuccessPanel.style.display = "none";
    cancelStatusMessage.textContent = "";

    const cancelToken = cancelTokenInput.value.trim();

    if (!cancelToken) {
      cancelStatusMessage.innerHTML = `<div class="scheduler-error-banner">${t("enterCancelToken")}</div>`;
      return;
    }

    const formData = new FormData();
    formData.append("cancel_token", cancelToken);

    cancelStatusMessage.textContent = t("cancelling");

    try {
      const response = await fetch(`${API_BASE}/cancel`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        cancelStatusMessage.innerHTML = `<div class="scheduler-error-banner">${data.detail || t("cancelFailed")}</div>`;
        cancelSuccessPanel.style.display = "none";
        return;
      }

      cancelStatusMessage.textContent = "";
      cancelSuccessPanel.style.display = "block";

      cancelTokenInput.value = "";
      document.getElementById("generatedCancelToken").value = "";
      document.getElementById("bookingSuccessPanel").style.display = "none";

      const bookStatusMessage = document.getElementById("bookStatusMessage");
      bookStatusMessage.dataset.hasContent = "";
      bookStatusMessage.textContent = t("noBooking");

      document.getElementById("emailFeedback").textContent = "";
      document.getElementById("copyFeedback").textContent = "";

      if (selectedDate) {
        await loadSlots();
      }
    } catch (error) {
      cancelSuccessPanel.style.display = "none";
      cancelStatusMessage.innerHTML = `<div class="scheduler-error-banner">Cancellation error: ${error.message || error}</div>`;
    }
  }

  function setupEvents() {
    document.getElementById("prevMonthBtn")?.addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonthBtn")?.addEventListener("click", () => changeMonth(1));
    document.getElementById("bookBtn")?.addEventListener("click", bookAppointment);
    document.getElementById("cancelBtn")?.addEventListener("click", cancelAppointment);
    document.getElementById("copyTokenBtn")?.addEventListener("click", copyCancelToken);

    document.getElementById("langToggle")?.addEventListener("click", () => {
      currentLang = currentLang === "pt" ? "en" : "pt";
      saveLanguage(currentLang);
      applyLanguage();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    detectLanguage();
    setupEvents();
    applyLanguage();
    renderCalendar();
  });
})();
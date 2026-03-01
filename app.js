const employees = [];
let dayHistory = [];
let showAllReport = false;
let selectedHistoryDate = null;
const WORKDAY_CUTOFF_HOUR = 4;

const STORAGE_KEYS = {
  employees: "workcalculator_employees_v1",
  history: "workcalculator_day_history_v1",
};

const employeeForm = document.getElementById("employeeForm");
const historyQuickOpen = document.getElementById("historyQuickOpen");
const menuToggle = document.getElementById("menuToggle");
const managerPanel = document.getElementById("managerPanel");
const employeesList = document.getElementById("employeesList");
const managerEmployeesList = document.getElementById("managerEmployeesList");
const calculateAllBtn = document.getElementById("calculateAll");
const toggleAllBtn = document.getElementById("toggleAll");
const allReport = document.getElementById("allReport");
const allReportClose = document.getElementById("allReportClose");
const allReportContent = document.getElementById("allReportContent");
const historyDateInput = document.getElementById("historyDate");
const saveDayBtn = document.getElementById("saveDay");
const historySelect = document.getElementById("historySelect");
const historySelectTrigger = document.getElementById("historySelectTrigger");
const historySelectMenu = document.getElementById("historySelectMenu");
const historyModal = document.getElementById("historyModal");
const historyModalClose = document.getElementById("historyModalClose");
const historyModalTitle = document.getElementById("historyModalTitle");
const historyModalBody = document.getElementById("historyModalBody");

function getTodayDate() {
  const now = new Date();
  const workdayDate = new Date(now);

  if (now.getHours() < WORKDAY_CUTOFF_HOUR) {
    workdayDate.setDate(workdayDate.getDate() - 1);
  }

  const year = workdayDate.getFullYear();
  const month = String(workdayDate.getMonth() + 1).padStart(2, "0");
  const day = String(workdayDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveEmployeesToStorage() {
  localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees));
}

function saveHistoryToStorage() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(dayHistory));
}

function loadStateFromStorage() {
  const employeesRaw = localStorage.getItem(STORAGE_KEYS.employees);
  const historyRaw = localStorage.getItem(STORAGE_KEYS.history);

  try {
    const parsedEmployees = employeesRaw ? JSON.parse(employeesRaw) : [];
    if (Array.isArray(parsedEmployees)) {
      employees.push(...parsedEmployees);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEYS.employees);
  }

  try {
    const parsedHistory = historyRaw ? JSON.parse(historyRaw) : [];
    if (Array.isArray(parsedHistory)) {
      dayHistory = parsedHistory;
    }
  } catch {
    dayHistory = [];
    localStorage.removeItem(STORAGE_KEYS.history);
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function calcHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;

  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) {
    end += 24 * 60;
  }
  const minutes = end - start;
  return minutes > 0 ? minutes / 60 : 0;
}

function calculateEmployee(employee) {
  const hours = calcHours(employee.startTime, employee.endTime);
  const hourlyRate = toNumber(employee.hourlyRate);
  const orderRate = toNumber(employee.orderRate);
  const orders = toNumber(employee.orders);

  const hoursPay = hours * hourlyRate;
  const ordersPay = orders > 0 ? orders * orderRate : 0;
  const total = hoursPay + ordersPay;

  return {
    hours,
    hoursPay,
    orders,
    ordersPay,
    total,
  };
}

function formatMoney(value) {
  return `${value.toFixed(2)} zł`;
}

function createEmployee(data) {
  return {
    id: Date.now() + Math.random(),
    name: data.name,
    hourlyRate: data.hourlyRate,
    orderRate: data.orderRate,
    startTime: data.startTime,
    endTime: data.endTime,
    orders: data.orders,
    lastResult: null,
  };
}

function updateEmployeeField(id, field, value) {
  const employee = employees.find((item) => item.id === id);
  if (!employee) return;
  employee[field] = value;
  if (employee.lastResult) {
    employee.lastResult = calculateEmployee(employee);
  }
  saveEmployeesToStorage();
  syncCurrentDayHistory();
}

function deleteEmployee(id) {
  const index = employees.findIndex((item) => item.id === id);
  if (index === -1) return;
  employees.splice(index, 1);
  saveEmployeesToStorage();
  syncCurrentDayHistory();
  renderEmployees();
  renderManagerEmployees();
  if (showAllReport) {
    renderAllReport();
  }
}

function calculateOne(id) {
  const employee = employees.find((item) => item.id === id);
  if (!employee) return;
  employee.lastResult = calculateEmployee(employee);
  saveEmployeesToStorage();
  syncCurrentDayHistory();
  renderEmployees();
  if (showAllReport) {
    renderAllReport();
  }
}

function createDaySnapshot(date) {
  const snapshotEmployees = employees.map((employee) => {
    const result = calculateEmployee(employee);
    return {
      id: employee.id,
      name: employee.name,
      hourlyRate: employee.hourlyRate,
      orderRate: employee.orderRate,
      startTime: employee.startTime,
      endTime: employee.endTime,
      orders: employee.orders,
      result,
    };
  });

  const grandTotal = snapshotEmployees.reduce(
    (sum, item) => sum + item.result.total,
    0,
  );

  return {
    date,
    employees: snapshotEmployees,
    grandTotal,
    savedAt: new Date().toISOString(),
  };
}

function sortHistoryByDateDesc() {
  dayHistory.sort((a, b) => b.date.localeCompare(a.date));
}

function closeHistoryMenu() {
  historySelectMenu.classList.add("hidden");
}

function updateHistoryTriggerText() {
  if (!selectedHistoryDate) {
    historySelectTrigger.textContent = "Wybierz dzień";
    return;
  }

  historySelectTrigger.textContent = selectedHistoryDate;
}

function renderHistorySelectOptions() {
  if (dayHistory.length === 0) {
    historySelectMenu.innerHTML =
      '<div class="history-option">Historia jest pusta</div>';
    historySelectTrigger.textContent = "Wybierz dzień";
    return;
  }

  historySelectMenu.innerHTML = dayHistory
    .map(
      (entry) => `
      <div class="history-option ${
        selectedHistoryDate === entry.date ? "active" : ""
      }" data-history-date="${entry.date}">
        ${entry.date}
      </div>
    `,
    )
    .join("");

  updateHistoryTriggerText();
}

function closeHistoryModal() {
  historyModal.classList.add("hidden");
}

function openHistoryModal(day) {
  const rows = day.employees
    .map(
      (employee) => `
      <div class="report-row">
        <strong>${employee.name}</strong><br />
        Godziny: ${employee.result.hours.toFixed(2)} × ${toNumber(employee.hourlyRate).toFixed(2)} = ${formatMoney(employee.result.hoursPay)}<br />
        Zamówienia: ${toNumber(employee.result.orders)} × ${toNumber(employee.orderRate).toFixed(2)} = ${formatMoney(employee.result.ordersPay)}<br />
        Razem: <strong>${formatMoney(employee.result.total)}</strong>
      </div>
    `,
    )
    .join("");

  historyModalTitle.textContent = `Statystyka za ${day.date}`;
  historyModalBody.innerHTML = `${rows || "<p>W tym dniu nie było pracowników.</p>"}<div class="total">Łączna wypłata za dzień: ${formatMoney(day.grandTotal)}</div>`;
  historyModal.classList.remove("hidden");
}

function openHistoryByDate(date) {
  const day = dayHistory.find((item) => item.date === date);
  if (!day) return;

  selectedHistoryDate = date;
  updateHistoryTriggerText();
  renderHistorySelectOptions();
  openHistoryModal(day);
}

function saveCurrentDayToHistory() {
  if (employees.length === 0) {
    historyModalTitle.textContent = "Statystyka dnia";
    historyModalBody.innerHTML =
      "<p>Nie można zapisać dnia: dodaj co najmniej jednego pracownika.</p>";
    historyModal.classList.remove("hidden");
    return;
  }

  const date = historyDateInput.value || getTodayDate();
  const snapshot = createDaySnapshot(date);
  const existingIndex = dayHistory.findIndex((item) => item.date === date);

  if (existingIndex >= 0) {
    dayHistory[existingIndex] = snapshot;
  } else {
    dayHistory.push(snapshot);
  }

  selectedHistoryDate = date;
  sortHistoryByDateDesc();
  saveHistoryToStorage();
  renderHistorySelectOptions();
  openHistoryByDate(date);
}

function syncCurrentDayHistory() {
  if (employees.length === 0) return;

  const date = historyDateInput.value || getTodayDate();
  const snapshot = createDaySnapshot(date);
  const existingIndex = dayHistory.findIndex((item) => item.date === date);

  if (existingIndex >= 0) {
    dayHistory[existingIndex] = snapshot;
  } else {
    dayHistory.push(snapshot);
  }

  if (!selectedHistoryDate) {
    selectedHistoryDate = date;
  }

  sortHistoryByDateDesc();
  saveHistoryToStorage();
  renderHistorySelectOptions();
}

function renderEmployees() {
  if (employees.length === 0) {
    employeesList.innerHTML = "<p>Brak pracowników.</p>";
    return;
  }

  employeesList.innerHTML = employees
    .map((employee) => {
      const result = employee.lastResult;
      return `
        <article class="employee">
          <h3 class="employee__title">${employee.name}</h3>
          <p class="employee__meta">Stawka: ${toNumber(employee.hourlyRate).toFixed(2)} zł/godz., ${toNumber(employee.orderRate).toFixed(2)} zł/zamówienie</p>
          <div class="employee__grid">
            <label>
              Początek
              <input type="time" value="${employee.startTime || ""}" data-id="${employee.id}" data-field="startTime" />
            </label>
            <label>
              Koniec
              <input type="time" value="${employee.endTime || ""}" data-id="${employee.id}" data-field="endTime" />
            </label>
            <label>
              Zamówienia
              <input type="number" min="0" step="1" value="${employee.orders || ""}" data-id="${employee.id}" data-field="orders" />
            </label>
          </div>
          <div class="employee__actions">
            <button class="btn btn-primary" data-action="calc" data-id="${employee.id}">Oblicz pracownika</button>
          </div>
          ${
            result
              ? `<div class="employee__result">
                  Godziny: ${result.hours.toFixed(2)}<br />
                  Za godziny: ${formatMoney(result.hoursPay)}<br />
                  Za zamówienia: ${formatMoney(result.ordersPay)}<br />
                  Razem: <strong>${formatMoney(result.total)}</strong>
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderManagerEmployees() {
  if (employees.length === 0) {
    managerEmployeesList.innerHTML = "<p>Brak pracowników.</p>";
    return;
  }

  managerEmployeesList.innerHTML = employees
    .map(
      (employee) => `
      <article class="employee">
        <h3 class="employee__title">${employee.name}</h3>
        <div class="employee__grid">
          <label>
            Imię
            <input type="text" value="${employee.name || ""}" data-id="${employee.id}" data-field="name" />
          </label>
          <label>
            Stawka/godz. (zł)
            <input type="number" min="0" step="0.01" value="${employee.hourlyRate || ""}" data-id="${employee.id}" data-field="hourlyRate" />
          </label>
          <label>
            Stawka/zamówienie (zł)
            <input type="number" min="0" step="0.01" value="${employee.orderRate || ""}" data-id="${employee.id}" data-field="orderRate" />
          </label>
        </div>
        <div class="employee__actions">
          <button class="btn btn-danger btn-icon" data-action="delete" data-id="${employee.id}" aria-label="Usuń pracownika">
            <span class="btn-icon__svg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="8" r="4"></circle>
                <path d="M1 20c0-3.5 3-6 7-6"></path>
                <path d="M19.8 18.2l1.2.7"></path>
                <path d="M17 19.8v1.4"></path>
                <path d="M14.2 18.2l-1.2.7"></path>
                <path d="M14.2 15.8l-1.2-.7"></path>
                <path d="M17 14.2v-1.4"></path>
                <path d="M19.8 15.8l1.2-.7"></path>
                <path d="M14.5 14.5l5 5"></path>
              </svg>
            </span>
            <span>Usuń</span>
          </button>
        </div>
      </article>
    `,
    )
    .join("");
}

function renderAllReport() {
  if (!showAllReport) return;

  if (employees.length === 0) {
    allReportContent.innerHTML = "<p>Brak danych do raportu.</p>";
    return;
  }

  let grandTotal = 0;
  const rows = employees.map((employee) => {
    const result = calculateEmployee(employee);
    grandTotal += result.total;

    return `
      <div class="report-row">
        <strong>${employee.name}</strong><br />
        Godziny: ${result.hours.toFixed(2)} × ${toNumber(employee.hourlyRate).toFixed(2)} = ${formatMoney(result.hoursPay)}<br />
        Zamówienia: ${result.orders} × ${toNumber(employee.orderRate).toFixed(2)} = ${formatMoney(result.ordersPay)}<br />
        Razem: <strong>${formatMoney(result.total)}</strong>
      </div>
    `;
  });

  allReportContent.innerHTML = `${rows.join("")}<div class="total">Łączna wypłata: ${formatMoney(grandTotal)}</div>`;
}

function closeAllReportModal() {
  showAllReport = false;
  allReport.classList.add("hidden");
  toggleAllBtn.textContent = "Pokaż wszystkich kurierów";
}

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    hourlyRate: document.getElementById("hourlyRate").value,
    orderRate: document.getElementById("orderRate").value,
    startTime: "",
    endTime: "",
    orders: "",
  };

  if (!data.name) return;

  employees.push(createEmployee(data));
  saveEmployeesToStorage();
  syncCurrentDayHistory();
  employeeForm.reset();
  renderEmployees();
  renderManagerEmployees();
  if (showAllReport) {
    renderAllReport();
  }
});

employeesList.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const id = Number(target.dataset.id);
  const field = target.dataset.field;
  if (!id || !field) return;

  updateEmployeeField(id, field, target.value);
});

managerEmployeesList.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const id = Number(target.dataset.id);
  const field = target.dataset.field;
  if (!id || !field) return;

  updateEmployeeField(id, field, target.value);

  if (field === "name" || field === "hourlyRate" || field === "orderRate") {
    renderEmployees();
    if (showAllReport) {
      renderAllReport();
    }
  }
});

employeesList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button[data-action][data-id]");
  if (!(button instanceof HTMLButtonElement)) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (!id || !action) return;

  if (action === "calc") {
    calculateOne(id);
    return;
  }

  if (action === "delete") {
    deleteEmployee(id);
  }
});

managerEmployeesList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button[data-action][data-id]");
  if (!(button instanceof HTMLButtonElement)) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (!id || !action) return;

  if (action === "delete") {
    deleteEmployee(id);
  }
});

menuToggle.addEventListener("click", () => {
  const isHidden = managerPanel.classList.toggle("hidden");
  menuToggle.setAttribute("aria-expanded", String(!isHidden));
});

calculateAllBtn.addEventListener("click", () => {
  employees.forEach((employee) => {
    employee.lastResult = calculateEmployee(employee);
  });
  saveEmployeesToStorage();
  syncCurrentDayHistory();
  renderEmployees();

  if (!showAllReport) {
    showAllReport = true;
    allReport.classList.remove("hidden");
    toggleAllBtn.textContent = "Ukryj wszystkich kurierów";
  }

  renderAllReport();
});

toggleAllBtn.addEventListener("click", () => {
  showAllReport = !showAllReport;
  allReport.classList.toggle("hidden", !showAllReport);
  toggleAllBtn.textContent = showAllReport
    ? "Ukryj wszystkich kurierów"
    : "Pokaż wszystkich kurierów";

  if (showAllReport) {
    renderAllReport();
  }
});

allReport.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.matches('[data-close-all-report="true"]')) {
    closeAllReportModal();
  }
});

allReportClose.addEventListener("click", () => {
  closeAllReportModal();
});

saveDayBtn.addEventListener("click", () => {
  saveCurrentDayToHistory();
});

historySelectTrigger.addEventListener("click", () => {
  historySelectMenu.classList.toggle("hidden");
});

historySelectMenu.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const option = target.closest(".history-option[data-history-date]");
  if (!(option instanceof HTMLDivElement)) return;

  const date = option.dataset.historyDate;
  if (!date) return;

  closeHistoryMenu();
  openHistoryByDate(date);
});

historyModal.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.matches('[data-close-modal="true"]')) {
    closeHistoryModal();
  }
});

historyModalClose.addEventListener("click", () => {
  closeHistoryModal();
});

historyQuickOpen.addEventListener("click", () => {
  if (dayHistory.length === 0) {
    historyModalTitle.textContent = "Statystyka dnia";
    historyModalBody.innerHTML = "<p>Historia jest pusta.</p>";
    historyModal.classList.remove("hidden");
    return;
  }

  const dateToOpen = selectedHistoryDate || dayHistory[0].date;
  openHistoryByDate(dateToOpen);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;

  if (!historySelect.contains(target)) {
    closeHistoryMenu();
  }
});

historyDateInput.value = getTodayDate();
loadStateFromStorage();
sortHistoryByDateDesc();
if (dayHistory.length > 0) {
  selectedHistoryDate = dayHistory[0].date;
}
renderEmployees();
renderManagerEmployees();
renderHistorySelectOptions();

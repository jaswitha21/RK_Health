/**
 * RK Health – Web Client Application Logic
 */

// Application State
let state = {
  appointments: [],
  medications: [],
  summaries: [],
  reports: [],
  reminderLogs: [],
  stats: {},
  currentPatient: "Apex Miller",
  activeSection: "dashboard"
};

// Chart.js global reference
let dashboardChart = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  console.log("Initializing RK Health System...");
  
  // Setup Mock Badge status
  const modeBadge = document.getElementById("mode-badge");
  const modeBadgeText = document.getElementById("mode-badge-text");
  if (config.MOCK_MODE) {
    modeBadge.className = "mode-badge";
    modeBadgeText.textContent = "Offline Mock Mode";
  } else {
    modeBadge.className = "mode-badge live";
    modeBadgeText.textContent = "Live Cloud Mode";
  }

  // Set up Event Listeners
  setupNavigation();
  setupPatientSelector();
  setupModals();
  setupForms();
  setupSearchFilters();

  // Initial Data Fetch
  loadAllData();
}

/* ==========================================
   NAVIGATION & UI ROUTING
   ========================================== */
function setupNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Update Active Navigation Item
      menuItems.forEach(mi => mi.classList.remove("active"));
      item.classList.add("active");
      
      // Toggle Active Section
      const targetSection = item.getAttribute("data-section");
      switchSection(targetSection);
    });
  });
}

function switchSection(sectionId) {
  state.activeSection = sectionId;
  
  // Hide all sections
  const sections = document.querySelectorAll(".page-section");
  sections.forEach(sec => sec.classList.remove("active"));
  
  // Show target section
  const activeSec = document.getElementById(`${sectionId}-section`);
  if (activeSec) {
    activeSec.classList.add("active");
  }
  
  // Update Header Title
  const pageTitle = document.getElementById("header-page-title");
  pageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace("-", " ");
  
  // Refresh section-specific calculations
  if (sectionId === "dashboard") {
    renderDashboard();
  } else if (sectionId === "appointments") {
    renderAppointmentsList();
  } else if (sectionId === "medications") {
    renderMedicationsGrid();
  } else if (sectionId === "ai-summaries") {
    initAISummaryWorkspace();
  } else if (sectionId === "health-logs") {
    renderHealthLogs();
  } else if (sectionId === "reports") {
    initReportsWorkspace();
  }
}

/* ==========================================
   PATIENT SELECTOR & CONTEXT
   ========================================== */
function setupPatientSelector() {
  const patientSelect = document.getElementById("global-patient-select");
  patientSelect.value = state.currentPatient;
  
  patientSelect.addEventListener("change", (e) => {
    state.currentPatient = e.target.value;
    
    // Update User Profile Avatar/Label
    const avatarLetters = document.getElementById("avatar-letters");
    const nameLabel = document.getElementById("user-display-name");
    
    if (state.currentPatient === "All Patients") {
      avatarLetters.textContent = "AP";
      nameLabel.textContent = "All Patients Portal";
    } else {
      const parts = state.currentPatient.split(" ");
      avatarLetters.textContent = parts.map(p => p[0]).join("").toUpperCase();
      nameLabel.textContent = state.currentPatient;
    }
    
    showToast(`Patient context switched to: ${state.currentPatient}`, "info");
    
    // Refresh current view
    switchSection(state.activeSection);
  });
}

// Populate Patient Dropdowns based on unique patient names in records
function refreshPatientDropdowns() {
  // Extract unique patient names from appointments & medications
  const patientsSet = new Set(["Apex Miller"]); // Always include default
  state.appointments.forEach(a => { if (a.PatientName) patientsSet.add(a.PatientName); });
  state.medications.forEach(m => { if (m.PatientName) patientsSet.add(m.PatientName); });
  
  const patientsArray = Array.from(patientsSet);
  
  // Global Select
  const globalSelect = document.getElementById("global-patient-select");
  const currentVal = globalSelect.value;
  globalSelect.innerHTML = "";
  patientsArray.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    globalSelect.appendChild(opt);
  });
  // Add All Patients option
  const optAll = document.createElement("option");
  optAll.value = "All Patients";
  optAll.textContent = "All Patients";
  globalSelect.appendChild(optAll);
  
  if (patientsArray.includes(currentVal) || currentVal === "All Patients") {
    globalSelect.value = currentVal;
  } else {
    globalSelect.value = "Apex Miller";
    state.currentPatient = "Apex Miller";
  }
  
  // Reports Select
  const reportSelect = document.getElementById("report-patient-select");
  if (reportSelect) {
    reportSelect.innerHTML = "";
    patientsArray.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      reportSelect.appendChild(opt);
    });
  }
}

/* ==========================================
   DATA OPERATIONS LAYER (MOCK VS CLOUD)
   ========================================== */
async function loadAllData() {
  showLoader();
  try {
    if (config.MOCK_MODE) {
      loadLocalStorageData();
    } else {
      const url = `${config.API_ENDPOINT}?action=getAllData`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        state.appointments = data.appointments || [];
        state.medications = data.medications || [];
        state.summaries = data.summaries || [];
        state.reports = data.reports || [];
        state.reminderLogs = data.reminderLogs || [];
        state.stats = data.stats || {};
      } else {
        throw new Error(data.message || "Failed to query live dataset.");
      }
    }
    
    // Refresh all views
    refreshPatientDropdowns();
    renderDashboard();
    showToast("Health records synchronized successfully.", "success");
  } catch (error) {
    console.error("Sync Error: ", error);
    showToast(`Sync Failed: ${error.message}. Defaulting to Offline Mode.`, "error");
    // Force Offline Fallback
    config.MOCK_MODE = true;
    loadLocalStorageData();
    refreshPatientDropdowns();
    renderDashboard();
  } finally {
    hideLoader();
  }
}

function loadLocalStorageData() {
  let localData = localStorage.getItem("RK_HEALTH_DB");
  if (!localData) {
    // Write demo baseline
    localStorage.setItem("RK_HEALTH_DB", JSON.stringify(config.DEMO_DATA));
    localData = JSON.stringify(config.DEMO_DATA);
  }
  
  const parsed = JSON.parse(localData);
  state.appointments = parsed.appointments || [];
  state.medications = parsed.medications || [];
  state.summaries = parsed.summaries || [];
  state.reports = parsed.reports || [];
  state.reminderLogs = parsed.reminderLogs || [];
  
  recalculateMockStats();
}

function saveLocalStorageData() {
  const db = {
    appointments: state.appointments,
    medications: state.medications,
    summaries: state.summaries,
    reports: state.reports,
    reminderLogs: state.reminderLogs
  };
  localStorage.setItem("RK_HEALTH_DB", JSON.stringify(db));
  recalculateMockStats();
}

function recalculateMockStats() {
  const todayStr = getTodayString(new Date());
  const patient = state.currentPatient;
  
  // Filter sets by patient if not "All Patients"
  const filterByPatient = (arr) => {
    if (patient === "All Patients") return arr;
    return arr.filter(item => item.PatientName && item.PatientName.toLowerCase() === patient.toLowerCase());
  };
  
  const filteredAppts = filterByPatient(state.appointments);
  const filteredMeds = filterByPatient(state.medications);
  const filteredSums = filterByPatient(state.summaries);
  const filteredReps = filterByPatient(state.reports);
  const filteredLogs = filterByPatient(state.reminderLogs);
  
  const upcomingCount = filteredAppts.filter(a => a.Date >= todayStr).length;
  const activeMedsCount = filteredMeds.filter(m => m.Status === "Active").length;
  
  let compliance = 100;
  if (filteredMeds.length > 0) {
    const activeOrCompleted = filteredMeds.filter(m => m.Status === "Active" || m.Status === "Completed").length;
    compliance = Math.round((activeOrCompleted / filteredMeds.length) * 100);
  }
  
  state.stats = {
    totalAppointments: filteredAppts.length,
    upcomingAppointments: upcomingCount,
    activeReminders: activeMedsCount,
    totalSummaries: filteredSums.length,
    totalReports: filteredReps.length,
    complianceScore: compliance,
    smsStatus: filteredLogs.length > 0 && filteredLogs.some(l => l.Status === "Failed") ? "Warning" : "Healthy"
  };
}

/* ==========================================
   WRITE ACTION SERVICE (POST CONTROLLER)
   ========================================== */
async function performWriteAction(action, payload) {
  showLoader();
  try {
    if (config.MOCK_MODE) {
      // Execute local storage mock updates
      executeMockWrite(action, payload);
      saveLocalStorageData();
      renderDashboard();
      hideLoader();
      return { success: true, message: "Records updated in local database." };
    } else {
      const url = `${config.API_ENDPOINT}?action=${action}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        await loadAllData(); // Reload stats and lists
        return data;
      } else {
        throw new Error(data.message || "Cloud write operation failed.");
      }
    }
  } catch (err) {
    console.error("Write Action Error: ", err);
    showToast(`Operation Failed: ${err.message}`, "error");
    return { success: false, message: err.message };
  } finally {
    hideLoader();
  }
}

function executeMockWrite(action, payload) {
  const uuid = generateUUID();
  const timestamp = new Date().toISOString();
  
  if (action === "addAppointment") {
    const appt = {
      AppointmentID: uuid,
      PatientName: payload.patientName,
      DoctorName: payload.doctorName,
      Title: payload.title,
      Hospital: payload.hospital,
      Date: payload.date,
      Time: payload.time,
      Phone: payload.phone || "",
      Notes: payload.notes || "",
      CreatedAt: timestamp
    };
    state.appointments.push(appt);
    
    // Auto mock appointment SMS
    if (appt.Phone) {
      const msg = `Hi ${appt.PatientName}, your appointment with ${appt.DoctorName} is confirmed for ${appt.Date} at ${appt.Time} at ${appt.Hospital}.`;
      state.reminderLogs.push({
        ReminderID: generateUUID(),
        PatientName: appt.PatientName,
        Message: msg,
        Status: "Sent",
        Timestamp: timestamp
      });
    }
    showToast("Appointment scheduled successfully.", "success");
    
  } else if (action === "updateAppointment") {
    const idx = state.appointments.findIndex(a => a.AppointmentID === payload.appointmentId);
    if (idx !== -1) {
      state.appointments[idx] = {
        ...state.appointments[idx],
        PatientName: payload.patientName,
        DoctorName: payload.doctorName,
        Title: payload.title,
        Hospital: payload.hospital,
        Date: payload.date,
        Time: payload.time,
        Phone: payload.phone || "",
        Notes: payload.notes || ""
      };
      showToast("Appointment changes saved.", "success");
    }
    
  } else if (action === "deleteAppointment") {
    state.appointments = state.appointments.filter(a => a.AppointmentID !== payload.appointmentId);
    showToast("Appointment cancelled and deleted.", "info");
    
  } else if (action === "addMedication") {
    const med = {
      MedicationID: uuid,
      PatientName: payload.patientName,
      MedicineName: payload.medicineName,
      Dosage: payload.dosage,
      Frequency: payload.frequency,
      Timing: payload.timing,
      StartDate: payload.startDate,
      EndDate: payload.endDate,
      Phone: payload.phone || "",
      Instructions: payload.instructions || "Take as directed.",
      Status: "Active",
      CreatedAt: timestamp
    };
    state.medications.push(med);
    
    if (med.Phone) {
      const msg = `Hi ${med.PatientName}, new medication added: ${med.MedicineName} (${med.Dosage}). Timing: ${med.Timing}. Instructions: ${med.Instructions}`;
      state.reminderLogs.push({
        ReminderID: generateUUID(),
        PatientName: med.PatientName,
        Message: msg,
        Status: "Sent",
        Timestamp: timestamp
      });
    }
    showToast("Medication prescription logged.", "success");
    
  } else if (action === "updateMedication") {
    const idx = state.medications.findIndex(m => m.MedicationID === payload.medicationId);
    if (idx !== -1) {
      state.medications[idx] = {
        ...state.medications[idx],
        PatientName: payload.patientName,
        MedicineName: payload.medicineName,
        Dosage: payload.dosage,
        Frequency: payload.frequency,
        Timing: payload.timing,
        StartDate: payload.startDate,
        EndDate: payload.endDate,
        Phone: payload.phone || "",
        Instructions: payload.instructions || "Take as directed.",
        Status: payload.status || "Active"
      };
      showToast("Medication schedule updated.", "success");
    }
    
  } else if (action === "deleteMedication") {
    state.medications = state.medications.filter(m => m.MedicationID !== payload.medicationId);
    showToast("Medication schedule deleted.", "info");
    
  } else if (action === "sendSMS") {
    state.reminderLogs.push({
      ReminderID: uuid,
      PatientName: payload.patientName || "Apex Miller",
      Message: payload.messageBody,
      Status: "Sent",
      Timestamp: timestamp
    });
    showToast("SMS Notification Queued for Delivery.", "success");
    
  } else if (action === "generateSummary") {
    // Formulate a clean llama mock summary
    const summaryText = {
      overview: `Patient ${payload.patientName} was evaluated for symptoms described as "${payload.appointmentNotes || "routine follow-up"}". The review suggests standard parameters.`,
      findings: `Clinical evaluation notes show: "${payload.doctorNotes || "General physical parameters are stable"}". Blood pressure is healthy, and lungs are clear.`,
      guidance: `Review of active prescriptions: ${payload.medicationDetails || "follow default directions"}. Dosages must be consumed with water at specific schedule marks.`,
      actions: `Increase physical output (walking 20 mins daily), maintain log metrics, and follow up in standard time.`,
      notes: `Monitor for severe fatigue, dizziness, or shortness of breath. Contact emergency services if critical signs manifest.`
    };
    
    state.summaries.push({
      SummaryID: uuid,
      PatientName: payload.patientName,
      Summary: JSON.stringify(summaryText),
      GeneratedDate: timestamp
    });
    showToast("AI medical narrative successfully compiled.", "success");
  } else if (action === "generateReport") {
    const rep = {
      ReportID: uuid,
      PatientName: payload.patientName,
      ReportData: JSON.stringify({
        appointmentsCount: state.appointments.filter(a => a.PatientName.toLowerCase() === payload.patientName.toLowerCase()).length,
        medicationsCount: state.medications.filter(m => m.PatientName.toLowerCase() === payload.patientName.toLowerCase()).length,
        medicationsList: state.medications.filter(m => m.PatientName.toLowerCase() === payload.patientName.toLowerCase())
      }),
      CreatedDate: timestamp
    };
    state.reports.push(rep);
    showToast("Health snapshot saved in database.", "success");
  }
}

/* ==========================================
   RENDERER 1: DASHBOARD
   ========================================== */
function renderDashboard() {
  if (config.MOCK_MODE) {
    recalculateMockStats();
  }
  
  const stats = state.stats;
  
  // Update Numeric Indicators
  document.getElementById("stat-total-appointments").textContent = stats.totalAppointments || 0;
  document.getElementById("stat-upcoming-appointments").textContent = stats.upcomingAppointments || 0;
  document.getElementById("stat-active-medications").textContent = stats.activeReminders || 0;
  document.getElementById("stat-ai-summaries").textContent = stats.totalSummaries || 0;
  
  // Update Compliance dial widget
  const complianceScore = stats.complianceScore !== undefined ? stats.complianceScore : 100;
  const dial = document.getElementById("compliance-gauge-dial");
  const pctText = document.getElementById("compliance-percentage-text");
  dial.style.setProperty("--percent", complianceScore);
  pctText.textContent = `${complianceScore}%`;
  
  // Render Dashboard Table (Next Scheduled Appointments)
  const apptTbody = document.getElementById("dashboard-appointments-tbody");
  apptTbody.innerHTML = "";
  
  const todayStr = getTodayString(new Date());
  
  // Filter active appointments
  const displayAppts = state.appointments
    .filter(a => {
      const matchPatient = (state.currentPatient === "All Patients" || (a.PatientName && a.PatientName.toLowerCase() === state.currentPatient.toLowerCase()));
      return matchPatient && a.Date >= todayStr;
    })
    .sort((a, b) => a.Date.localeCompare(b.Date) || a.Time.localeCompare(b.Time))
    .slice(0, 3);
    
  if (displayAppts.length === 0) {
    apptTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No upcoming appointments scheduled.</td></tr>`;
  } else {
    displayAppts.forEach(appt => {
      const tr = document.createElement("tr");
      
      const calendarUrl = buildGoogleCalendarLink(appt);
      
      tr.innerHTML = `
        <td>
          <div style="font-weight:600; color:var(--text-main);">${appt.DoctorName}</div>
          <div style="font-size:11px; color:var(--text-muted);">${appt.Title}</div>
        </td>
        <td>${appt.Hospital || "Main Clinic"}</td>
        <td>
          <div style="font-weight:500;">${formatDate(appt.Date)}</div>
          <div style="font-size:11px; color:var(--text-muted);">${appt.Time}</div>
        </td>
        <td style="font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${appt.Notes}">${appt.Notes || "—"}</td>
        <td>
          <a href="${calendarUrl}" target="_blank" class="btn btn-secondary btn-icon" title="Add to Google Calendar" style="color: var(--primary);">
            <i class="fa-solid fa-calendar-plus"></i>
          </a>
        </td>
      `;
      apptTbody.appendChild(tr);
    });
  }
  
  // Render SMS logs activity feed
  const logsFeed = document.getElementById("dashboard-sms-logs-feed");
  logsFeed.innerHTML = "";
  
  const displayLogs = state.reminderLogs
    .filter(l => state.currentPatient === "All Patients" || (l.PatientName && l.PatientName.toLowerCase() === state.currentPatient.toLowerCase()))
    .sort((a, b) => b.Timestamp.localeCompare(a.Timestamp))
    .slice(0, 5);
    
  if (displayLogs.length === 0) {
    logsFeed.innerHTML = `<p style="text-align:center; padding: 20px 0; color:var(--text-muted); font-size:12px;">No reminder notifications logged.</p>`;
  } else {
    displayLogs.forEach(log => {
      const item = document.createElement("div");
      item.className = `activity-item ${log.Status && log.Status.toLowerCase().includes("failed") ? "failed" : "success"}`;
      
      item.innerHTML = `
        <div class="activity-marker"></div>
        <div class="activity-content">
          <div class="activity-message">${log.Message}</div>
          <div class="activity-time">${formatTimeAgo(log.Timestamp)} &bull; Status: <strong style="color:${log.Status === "Failed" ? "var(--danger)" : "var(--accent)"}">${log.Status}</strong></div>
        </div>
      `;
      logsFeed.appendChild(item);
    });
  }
  
  // Draw / Update Chart.js
  drawDashboardChart();
}

function drawDashboardChart() {
  const ctx = document.getElementById("dashboardChart").getContext("2d");
  
  if (dashboardChart) {
    dashboardChart.destroy();
  }
  
  // Calculate appointments by doctor for distribution visualization
  const apptCounts = {};
  const dataSet = state.appointments.filter(a => state.currentPatient === "All Patients" || (a.PatientName && a.PatientName.toLowerCase() === state.currentPatient.toLowerCase()));
  
  dataSet.forEach(a => {
    apptCounts[a.DoctorName] = (apptCounts[a.DoctorName] || 0) + 1;
  });
  
  const labels = Object.keys(apptCounts);
  const data = Object.values(apptCounts);
  
  if (labels.length === 0) {
    labels.push("No scheduled clinic visits");
    data.push(0);
  }
  
  dashboardChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Visits Count',
        data: data,
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.5)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/* ==========================================
   RENDERER 2: APPOINTMENTS LIST
   ========================================== */
function renderAppointmentsList() {
  const tbody = document.getElementById("appointments-list-tbody");
  tbody.innerHTML = "";
  
  const searchTerm = document.getElementById("appt-search-input").value.toLowerCase();
  const dateFilter = document.getElementById("appt-date-filter").value;
  
  const filtered = state.appointments
    .filter(a => {
      // Patient context filter
      if (state.currentPatient !== "All Patients" && a.PatientName.toLowerCase() !== state.currentPatient.toLowerCase()) {
        return false;
      }
      
      // Date filter
      if (dateFilter && a.Date !== dateFilter) {
        return false;
      }
      
      // Search text matches (Patient name, doctor, title, hospital or notes)
      const matchesSearch = 
        a.PatientName.toLowerCase().includes(searchTerm) ||
        a.DoctorName.toLowerCase().includes(searchTerm) ||
        a.Title.toLowerCase().includes(searchTerm) ||
        a.Hospital.toLowerCase().includes(searchTerm) ||
        a.Notes.toLowerCase().includes(searchTerm);
        
      return matchesSearch;
    })
    .sort((a, b) => a.Date.localeCompare(b.Date) || a.Time.localeCompare(b.Time));
    
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color:var(--text-muted);">No matching appointments found.</td></tr>`;
    return;
  }
  
  filtered.forEach(appt => {
    const tr = document.createElement("tr");
    const calendarUrl = buildGoogleCalendarLink(appt);
    
    tr.innerHTML = `
      <td style="font-weight:600; color:var(--primary);">${appt.PatientName}</td>
      <td>${appt.DoctorName}</td>
      <td>${appt.Title}</td>
      <td>${appt.Hospital || "—"}</td>
      <td>
        <div>${formatDate(appt.Date)}</div>
        <div style="font-size:12px; color:var(--text-muted);">${appt.Time}</div>
      </td>
      <td>${appt.Phone || "—"}</td>
      <td>
        <a href="${calendarUrl}" target="_blank" class="btn btn-secondary btn-icon" title="Add to Google Calendar" style="color:var(--primary)">
          <i class="fa-solid fa-calendar-plus"></i>
        </a>
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-icon edit-appt-btn" data-id="${appt.AppointmentID}" title="Edit Appointment" style="color:var(--secondary)">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-icon delete-appt-btn" data-id="${appt.AppointmentID}" title="Delete Appointment" style="color:var(--danger)">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Attach event listeners to newly rendered items
  document.querySelectorAll(".edit-appt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openAppointmentModal(id);
    });
  });
  
  document.querySelectorAll(".delete-appt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      confirmDeleteAppointment(id);
    });
  });
}

function confirmDeleteAppointment(id) {
  if (confirm("Are you sure you want to cancel and delete this appointment? This action will remove the record permanently.")) {
    performWriteAction("deleteAppointment", { appointmentId: id });
  }
}

/* ==========================================
   RENDERER 3: MEDICATIONS GRID
   ========================================== */
function renderMedicationsGrid() {
  const grid = document.getElementById("medications-cards-grid");
  grid.innerHTML = "";
  
  const searchTerm = document.getElementById("meds-search-input").value.toLowerCase();
  const statusFilter = document.getElementById("meds-status-filter").value;
  
  const filtered = state.medications.filter(med => {
    if (state.currentPatient !== "All Patients" && med.PatientName.toLowerCase() !== state.currentPatient.toLowerCase()) {
      return false;
    }
    
    if (statusFilter !== "All" && med.Status !== statusFilter) {
      return false;
    }
    
    const matchesSearch = 
      med.PatientName.toLowerCase().includes(searchTerm) ||
      med.MedicineName.toLowerCase().includes(searchTerm) ||
      med.Dosage.toLowerCase().includes(searchTerm) ||
      med.Instructions.toLowerCase().includes(searchTerm);
      
    return matchesSearch;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted);">No medication prescriptions match your filters.</div>`;
    return;
  }
  
  filtered.forEach(med => {
    const card = document.createElement("div");
    card.className = "medication-card";
    
    let statusClass = "badge-success";
    if (med.Status === "Paused") statusClass = "badge-warning";
    if (med.Status === "Completed") statusClass = "badge-primary";
    
    card.innerHTML = `
      <div>
        <div class="medication-card-header">
          <div>
            <div class="medication-name">${med.MedicineName}</div>
            <div class="medication-dosage">${med.Dosage}</div>
          </div>
          <span class="badge ${statusClass}">${med.Status}</span>
        </div>
        
        <div class="medication-details">
          <div class="med-detail-item">
            <i class="fa-solid fa-hospital-user"></i>
            <div><span class="label">Patient:</span> ${med.PatientName}</div>
          </div>
          <div class="med-detail-item">
            <i class="fa-solid fa-clock"></i>
            <div><span class="label">Timing:</span> ${med.Timing}</div>
          </div>
          <div class="med-detail-item">
            <i class="fa-solid fa-arrows-spin"></i>
            <div><span class="label">Frequency:</span> ${med.Frequency}</div>
          </div>
          <div class="med-detail-item">
            <i class="fa-solid fa-calendar-days"></i>
            <div><span class="label">Duration:</span> ${formatDate(med.StartDate)} to ${formatDate(med.EndDate)}</div>
          </div>
          <div class="med-detail-item">
            <i class="fa-solid fa-info-circle"></i>
            <div><span class="label">Directions:</span> ${med.Instructions}</div>
          </div>
        </div>
      </div>
      
      <div class="medication-actions">
        <button class="btn btn-secondary btn-icon send-reminder-btn" data-id="${med.MedicationID}" title="Trigger SMS Reminder" style="color:var(--accent)">
          <i class="fa-solid fa-paper-plane"></i> SMS
        </button>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-icon edit-med-btn" data-id="${med.MedicationID}" title="Edit Prescription" style="color:var(--secondary)">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-icon delete-med-btn" data-id="${med.MedicationID}" title="Delete Prescription" style="color:var(--danger)">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Attach Action Listeners
  document.querySelectorAll(".send-reminder-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      triggerManualSMSReminder(id);
    });
  });
  
  document.querySelectorAll(".edit-med-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openMedicationModal(id);
    });
  });
  
  document.querySelectorAll(".delete-med-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      confirmDeleteMedication(id);
    });
  });
}

function confirmDeleteMedication(id) {
  if (confirm("Are you sure you want to delete this medication schedule?")) {
    performWriteAction("deleteMedication", { medicationId: id });
  }
}

async function triggerManualSMSReminder(medId) {
  const med = state.medications.find(m => m.MedicationID === medId);
  if (!med) return;
  
  if (!med.Phone) {
    showToast("No phone number configured for this reminder. Please edit the prescription.", "error");
    return;
  }
  
  const smsBody = `Hi ${med.PatientName}, medication reminder: ${med.MedicineName} (${med.Dosage}) is scheduled for ${med.Timing}. Instructions: ${med.Instructions}`;
  
  const result = await performWriteAction("sendSMS", {
    phone: med.Phone,
    messageBody: smsBody,
    patientName: med.PatientName
  });
  
  if (result.success) {
    showToast(`SMS Reminder Sent to ${med.PatientName} (${med.Phone})`, "success");
  }
}

/* ==========================================
   RENDERER 4: AI SUMMARY WORKSPACE
   ========================================== */
function initAISummaryWorkspace() {
  const patientInput = document.getElementById("ai-patient-name");
  
  // Lock summary to currently selected patient
  if (state.currentPatient === "All Patients") {
    patientInput.value = "Apex Miller"; // Default
  } else {
    patientInput.value = state.currentPatient;
  }
  
  // Load existing summary if we have one for this patient
  const matchingSummary = state.summaries
    .filter(s => s.PatientName.toLowerCase() === patientInput.value.toLowerCase())
    .sort((a, b) => b.GeneratedDate.localeCompare(a.GeneratedDate))[0];
    
  if (matchingSummary) {
    renderSummaryOutput(JSON.parse(matchingSummary.Summary));
  } else {
    resetSummaryOutput();
  }
}

function renderSummaryOutput(summaryObj) {
  const container = document.getElementById("ai-summary-output-body");
  container.innerHTML = `
    <div class="ai-block">
      <div class="ai-block-title"><i class="fa-solid fa-notes-medical"></i> Visit Overview</div>
      <div class="ai-block-content">${summaryObj.overview}</div>
    </div>
    
    <div class="ai-block findings">
      <div class="ai-block-title"><i class="fa-solid fa-stethoscope"></i> Key Findings & Diagnostics</div>
      <div class="ai-block-content">${summaryObj.findings}</div>
    </div>
    
    <div class="ai-block guidance">
      <div class="ai-block-title"><i class="fa-solid fa-pills"></i> Medication Guidance</div>
      <div class="ai-block-content">${summaryObj.guidance}</div>
    </div>
    
    <div class="ai-block actions">
      <div class="ai-block-title"><i class="fa-solid fa-person-running"></i> Follow-Up Actions & Lifestyle</div>
      <div class="ai-block-content">${summaryObj.actions}</div>
    </div>
    
    <div class="ai-block notes">
      <div class="ai-block-title"><i class="fa-solid fa-triangle-exclamation"></i> Critical Notes & Alerts</div>
      <div class="ai-block-content">${summaryObj.notes}</div>
    </div>
  `;
}

function resetSummaryOutput() {
  const container = document.getElementById("ai-summary-output-body");
  container.innerHTML = `
    <div class="ai-placeholder">
      <i class="fa-solid fa-file-invoice-dollar"></i>
      <p style="font-weight:600;">No AI Summary Loaded</p>
      <p style="font-size: 13px;">Fill out the clinical notes form and press generate to request a clean, patient-friendly summary powered by llama-3.3-70b-versatile.</p>
    </div>
  `;
}

/* ==========================================
   RENDERER 5: AUDIT LOGS
   ========================================== */
function renderHealthLogs() {
  const tbody = document.getElementById("logs-list-tbody");
  tbody.innerHTML = "";
  
  const search = document.getElementById("logs-search-input").value.toLowerCase();
  const filterType = document.getElementById("logs-type-filter").value;
  
  // Combine all items to create audit trail logs list
  let combinedLogs = [];
  
  if (filterType === "All" || filterType === "Appointments") {
    state.appointments.forEach(a => {
      combinedLogs.push({
        id: a.AppointmentID,
        sheet: "Appointments",
        message: `Consultation schedule added: Dr. ${a.DoctorName} / Title: ${a.Title}`,
        status: "Active",
        time: a.CreatedAt || a.Date + "T00:00:00.000Z"
      });
    });
  }
  
  if (filterType === "All" || filterType === "Medications") {
    state.medications.forEach(m => {
      combinedLogs.push({
        id: m.MedicationID,
        sheet: "Medications",
        message: `Prescription logged: ${m.MedicineName} (${m.Dosage}) / Frequency: ${m.Frequency}`,
        status: m.Status,
        time: m.CreatedAt || m.StartDate + "T00:00:00.000Z"
      });
    });
  }
  
  if (filterType === "All" || filterType === "Summaries") {
    state.summaries.forEach(s => {
      combinedLogs.push({
        id: s.SummaryID,
        sheet: "Summaries",
        message: `AI Clinical Summary compiled for patient ${s.PatientName}`,
        status: "Completed",
        time: s.GeneratedDate
      });
    });
  }
  
  if (filterType === "All" || filterType === "SMS") {
    state.reminderLogs.forEach(l => {
      combinedLogs.push({
        id: l.ReminderID,
        sheet: "SMS Gateway Logs",
        message: `SMS Sent to: ${l.PatientName}. Message: "${l.Message}"`,
        status: l.Status,
        time: l.Timestamp
      });
    });
  }
  
  // Sort logs by time desc
  combinedLogs.sort((a, b) => b.time.localeCompare(a.time));
  
  // Filter by search query
  const filtered = combinedLogs.filter(log => {
    return log.id.toLowerCase().includes(search) ||
           log.sheet.toLowerCase().includes(search) ||
           log.message.toLowerCase().includes(search) ||
           log.status.toLowerCase().includes(search);
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color:var(--text-muted);">No records found.</td></tr>`;
    return;
  }
  
  filtered.forEach(log => {
    const tr = document.createElement("tr");
    
    let statusClass = "badge-success";
    if (log.status === "Failed" || log.status === "Paused") statusClass = "badge-warning";
    if (log.status === "Completed") statusClass = "badge-primary";
    
    tr.innerHTML = `
      <td style="font-family:monospace; font-size:12px;">${log.id.substring(0, 8)}...</td>
      <td><span style="font-weight:600; color:var(--text-muted);">${log.sheet}</span></td>
      <td>${log.message}</td>
      <td><span class="badge ${statusClass}">${log.status}</span></td>
      <td style="font-size:12px;">${formatDate(log.time.split("T")[0])} ${log.time.includes("T") ? log.time.split("T")[1].substring(0, 5) : ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================
   RENDERER 6: COMPREHENSIVE REPORTS
   ========================================== */
function initReportsWorkspace() {
  const patientSelect = document.getElementById("report-patient-select");
  
  // Sync selected options
  refreshPatientDropdowns();
  
  if (state.currentPatient !== "All Patients") {
    patientSelect.value = state.currentPatient;
  }
  
  compileReportSnapshot();
}

function compileReportSnapshot() {
  const patient = document.getElementById("report-patient-select").value;
  
  // Filter patient details
  const appts = state.appointments.filter(a => a.PatientName.toLowerCase() === patient.toLowerCase());
  const meds = state.medications.filter(m => m.PatientName.toLowerCase() === patient.toLowerCase());
  const summaries = state.summaries.filter(s => s.PatientName.toLowerCase() === patient.toLowerCase());
  
  // Calculate Compliance score
  let compliance = 100;
  if (meds.length > 0) {
    const activeOrCompleted = meds.filter(m => m.Status === "Active" || m.Status === "Completed").length;
    compliance = Math.round((activeOrCompleted / meds.length) * 100);
  }
  
  // Update Printable sheet details
  document.getElementById("report-ref-id").textContent = `#REP-${Math.floor(100000 + Math.random() * 900000)}`;
  document.getElementById("report-compiled-date").textContent = formatDate(getTodayString(new Date()));
  document.getElementById("report-patient-name").textContent = patient;
  document.getElementById("report-patient-compliance").textContent = `${compliance}%`;
  
  const matchingPhone = meds[0]?.Phone || appts[0]?.Phone || "Not Configured";
  document.getElementById("report-patient-phone").textContent = matchingPhone;
  
  // Load AI Narrative Summary
  const summaryBox = document.getElementById("report-ai-summary-block");
  if (summaries.length > 0) {
    const latest = JSON.parse(summaries.sort((a,b) => b.GeneratedDate.localeCompare(a.GeneratedDate))[0].Summary);
    summaryBox.innerHTML = `
      <p><strong>Overview:</strong> ${latest.overview}</p>
      <p style="margin-top:8px;"><strong>Key Findings:</strong> ${latest.findings}</p>
      <p style="margin-top:8px;"><strong>Treatment Prescription Plan:</strong> ${latest.guidance}</p>
      <p style="margin-top:8px;"><strong>Recommended Actions:</strong> ${latest.actions}</p>
    `;
  } else {
    summaryBox.textContent = "No AI summary compiled for this patient yet. Use the 'AI Summaries' workspace tab to compile notes.";
  }
  
  // Render report tables
  const reportMedsTbody = document.getElementById("report-meds-tbody");
  reportMedsTbody.innerHTML = "";
  if (meds.length === 0) {
    reportMedsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No prescription history on file.</td></tr>`;
  } else {
    meds.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${m.MedicineName}</strong></td>
        <td>${m.Dosage}</td>
        <td>${m.Frequency}</td>
        <td>${m.Timing}</td>
        <td>${m.Instructions}</td>
        <td><span style="font-weight:600;">${m.Status}</span></td>
      `;
      reportMedsTbody.appendChild(tr);
    });
  }
  
  const reportApptsTbody = document.getElementById("report-appts-tbody");
  reportApptsTbody.innerHTML = "";
  if (appts.length === 0) {
    reportApptsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">No scheduled visits logged.</td></tr>`;
  } else {
    appts.forEach(a => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(a.Date)} at ${a.Time}</td>
        <td>Dr. ${a.DoctorName}</td>
        <td>${a.Hospital}</td>
        <td>${a.Notes || "—"}</td>
      `;
      reportApptsTbody.appendChild(tr);
    });
  }
}

/* ==========================================
   MODAL SYSTEMS & SUBMITS
   ========================================== */
function setupModals() {
  const apptModal = document.getElementById("appointment-modal");
  const medModal = document.getElementById("medication-modal");
  
  // Close triggers
  document.getElementById("appt-modal-close-btn").addEventListener("click", () => apptModal.classList.remove("active"));
  document.getElementById("appt-modal-cancel-btn").addEventListener("click", () => apptModal.classList.remove("active"));
  
  document.getElementById("med-modal-close-btn").addEventListener("click", () => medModal.classList.remove("active"));
  document.getElementById("med-modal-cancel-btn").addEventListener("click", () => medModal.classList.remove("active"));
  
  // Open Add buttons
  document.getElementById("open-add-appt-modal-btn").addEventListener("click", () => openAppointmentModal());
  document.getElementById("quick-add-appt-btn").addEventListener("click", () => openAppointmentModal());
  document.getElementById("open-add-med-modal-btn").addEventListener("click", () => openMedicationModal());
}

function openAppointmentModal(editId = null) {
  const modal = document.getElementById("appointment-modal");
  const title = document.getElementById("appt-modal-title");
  
  // Reset fields
  document.getElementById("appt-form").reset();
  document.getElementById("appt-field-id").value = "";
  
  // Restrict appointment date selection to future/today
  document.getElementById("appt-field-date").min = getTodayString(new Date());
  
  // Populate Patient name context if possible
  if (state.currentPatient !== "All Patients") {
    document.getElementById("appt-field-patient").value = state.currentPatient;
  }
  
  if (editId) {
    title.textContent = "Edit Scheduled Appointment";
    const appt = state.appointments.find(a => a.AppointmentID === editId);
    if (appt) {
      document.getElementById("appt-field-id").value = appt.AppointmentID;
      document.getElementById("appt-field-patient").value = appt.PatientName;
      document.getElementById("appt-field-doctor").value = appt.DoctorName;
      document.getElementById("appt-field-title").value = appt.Title;
      document.getElementById("appt-field-hospital").value = appt.Hospital;
      document.getElementById("appt-field-date").value = appt.Date;
      document.getElementById("appt-field-time").value = appt.Time;
      document.getElementById("appt-field-phone").value = appt.Phone || "";
      document.getElementById("appt-field-notes").value = appt.Notes || "";
    }
  } else {
    title.textContent = "Schedule Doctor Appointment";
  }
  
  modal.classList.add("active");
}

function openMedicationModal(editId = null) {
  const modal = document.getElementById("medication-modal");
  const title = document.getElementById("med-modal-title");
  
  document.getElementById("med-form").reset();
  document.getElementById("med-field-id").value = "";
  
  if (state.currentPatient !== "All Patients") {
    document.getElementById("med-field-patient").value = state.currentPatient;
  }
  
  // Default date ranges to today
  document.getElementById("med-field-start").value = getTodayString(new Date());
  
  if (editId) {
    title.textContent = "Modify Medication Schedule";
    const med = state.medications.find(m => m.MedicationID === editId);
    if (med) {
      document.getElementById("med-field-id").value = med.MedicationID;
      document.getElementById("med-field-patient").value = med.PatientName;
      document.getElementById("med-field-name").value = med.MedicineName;
      document.getElementById("med-field-dosage").value = med.Dosage;
      document.getElementById("med-field-frequency").value = med.Frequency;
      document.getElementById("med-field-timing").value = med.Timing;
      document.getElementById("med-field-start").value = med.StartDate;
      document.getElementById("med-field-end").value = med.EndDate;
      document.getElementById("med-field-phone").value = med.Phone || "";
      document.getElementById("med-field-status").value = med.Status;
      document.getElementById("med-field-instructions").value = med.Instructions || "";
    }
  } else {
    title.textContent = "Create Medication Prescription";
  }
  
  modal.classList.add("active");
}

function setupForms() {
  // Appointment Form Submit
  const apptForm = document.getElementById("appt-form");
  apptForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("appt-field-id").value;
    const phone = document.getElementById("appt-field-phone").value.trim();
    
    // Client-side phone format validation (+123456789)
    if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
      alert("Invalid Phone number format. Use international E.164 (e.g. +15550199)");
      return;
    }
    
    const payload = {
      patientName: document.getElementById("appt-field-patient").value.trim(),
      doctorName: document.getElementById("appt-field-doctor").value.trim(),
      title: document.getElementById("appt-field-title").value.trim(),
      hospital: document.getElementById("appt-field-hospital").value.trim(),
      date: document.getElementById("appt-field-date").value,
      time: document.getElementById("appt-field-time").value,
      phone: phone,
      notes: document.getElementById("appt-field-notes").value.trim()
    };
    
    let action = "addAppointment";
    if (id) {
      action = "updateAppointment";
      payload.appointmentId = id;
    }
    
    const res = await performWriteAction(action, payload);
    if (res.success) {
      document.getElementById("appointment-modal").classList.remove("active");
      if (state.activeSection === "appointments") {
        renderAppointmentsList();
      }
    }
  });

  // Medication Form Submit
  const medForm = document.getElementById("med-form");
  medForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("med-field-id").value;
    const phone = document.getElementById("med-field-phone").value.trim();
    
    if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
      alert("Invalid Phone format. Use E.164 international format (e.g. +15550199)");
      return;
    }
    
    const payload = {
      patientName: document.getElementById("med-field-patient").value.trim(),
      medicineName: document.getElementById("med-field-name").value.trim(),
      dosage: document.getElementById("med-field-dosage").value.trim(),
      frequency: document.getElementById("med-field-frequency").value,
      timing: document.getElementById("med-field-timing").value.trim(),
      startDate: document.getElementById("med-field-start").value,
      endDate: document.getElementById("med-field-end").value,
      phone: phone,
      status: document.getElementById("med-field-status").value,
      instructions: document.getElementById("med-field-instructions").value.trim()
    };
    
    let action = "addMedication";
    if (id) {
      action = "updateMedication";
      payload.medicationId = id;
    }
    
    const res = await performWriteAction(action, payload);
    if (res.success) {
      document.getElementById("medication-modal").classList.remove("active");
      if (state.activeSection === "medications") {
        renderMedicationsGrid();
      }
    }
  });
  
  // AI Generator Form Submit
  const aiForm = document.getElementById("ai-generator-form");
  aiForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const patientName = document.getElementById("ai-patient-name").value;
    const apptNotes = document.getElementById("ai-appt-notes").value.trim();
    const docNotes = document.getElementById("ai-doctor-notes").value.trim();
    const medDetails = document.getElementById("ai-meds-notes").value.trim();
    
    if (!apptNotes && !docNotes && !medDetails) {
      showToast("Please provide at least some visit notes or prescriptions to summarize.", "warning");
      return;
    }
    
    // Show AI generating loader overlay
    const loader = document.getElementById("ai-summary-loader");
    loader.style.display = "flex";
    
    const payload = {
      patientName: patientName,
      appointmentNotes: apptNotes,
      doctorNotes: docNotes,
      medicationDetails: medDetails
    };
    
    // Mock simulation delay to simulate Groq API response
    if (config.MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    const res = await performWriteAction("generateSummary", payload);
    loader.style.display = "none";
    
    if (res.success) {
      // Reload UI summaries state
      if (config.MOCK_MODE) {
        const latest = state.summaries[state.summaries.length - 1];
        renderSummaryOutput(JSON.parse(latest.Summary));
      } else {
        // Find newly compiled summary in state
        const matching = state.summaries
          .filter(s => s.PatientName.toLowerCase() === patientName.toLowerCase())
          .sort((a,b) => b.GeneratedDate.localeCompare(a.GeneratedDate))[0];
        if (matching) {
          renderSummaryOutput(JSON.parse(matching.Summary));
        }
      }
    }
  });
  
  // Report Generation Button
  const compileBtn = document.getElementById("compile-report-btn");
  if (compileBtn) {
    compileBtn.addEventListener("click", async () => {
      const patient = document.getElementById("report-patient-select").value;
      
      // Save snapshot of current report in DB
      await performWriteAction("generateReport", { patientName: patient });
      compileReportSnapshot();
    });
  }
}

function setupSearchFilters() {
  // Appointments Search/Filter
  document.getElementById("appt-search-input").addEventListener("input", renderAppointmentsList);
  document.getElementById("appt-date-filter").addEventListener("change", renderAppointmentsList);
  document.getElementById("clear-appt-filters-btn").addEventListener("click", () => {
    document.getElementById("appt-search-input").value = "";
    document.getElementById("appt-date-filter").value = "";
    renderAppointmentsList();
  });
  
  // Medications Search/Filter
  document.getElementById("meds-search-input").addEventListener("input", renderMedicationsGrid);
  document.getElementById("meds-status-filter").addEventListener("change", renderMedicationsGrid);
  
  // Logs search/filter
  document.getElementById("logs-search-input").addEventListener("input", renderHealthLogs);
  document.getElementById("logs-type-filter").addEventListener("change", renderHealthLogs);
}

/* ==========================================
   UI UTILITY HELPERS
   ========================================== */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-wrapper");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-exclamation";
  if (type === "info") icon = "fa-circle-info";
  if (type === "warning") icon = "fa-triangle-exclamation";
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  // Trigger transition
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function showLoader() {
  // Standard global loader if wanted, otherwise silent
}

function hideLoader() {
  // Remove loader if loaded
}

// Generate dynamic add-to-calendar link
function buildGoogleCalendarLink(appt) {
  const title = encodeURIComponent(appt.Title || "Doctor Appointment");
  const desc = encodeURIComponent(`Consultation with Dr. ${appt.DoctorName}.\nHospital: ${appt.Hospital}\nNotes: ${appt.Notes || ''}`);
  const location = encodeURIComponent(appt.Hospital || "Clinic");
  
  // Parse Dates
  const dateCompact = appt.Date.replace(/-/g, ""); // YYYYMMDD
  const timeCompact = appt.Time.replace(/:/g, ""); // HHMM
  const startStamp = `${dateCompact}T${timeCompact}00`;
  
  // Calculate End timestamp (assume 30 mins session duration)
  let hrs = parseInt(appt.Time.split(":")[0]);
  let mins = parseInt(appt.Time.split(":")[1]) + 30;
  if (mins >= 60) {
    hrs += 1;
    mins -= 60;
  }
  const endHrs = hrs < 10 ? `0${hrs}` : hrs;
  const endMins = mins < 10 ? `0${mins}` : mins;
  const endStamp = `${dateCompact}T${endHrs}${endMins}00`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStamp}/${endStamp}&details=${desc}&location=${location}`;
}

// Date formatter helpers
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getTodayString(d) {
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

function formatTimeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return formatDate(isoString.split("T")[0]);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

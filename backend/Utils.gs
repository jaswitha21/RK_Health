/**
 * Utilities & Helper Functions for RK Health Backend
 */

/**
 * Validates the core inputs of an appointment.
 * @param {Object} data Appointment data object.
 * @return {string|null} Error message, or null if valid.
 */
function validateAppointment(data) {
  if (!data.patientName || data.patientName.trim().length === 0) {
    return "Patient Name is required.";
  }
  if (!data.doctorName || data.doctorName.trim().length === 0) {
    return "Doctor Name is required.";
  }
  if (!data.date || !data.time) {
    return "Appointment Date and Time are required.";
  }
  if (data.phone && !isValidPhone(data.phone)) {
    return "Invalid phone number format. Must be international E.164 format (e.g. +1234567890).";
  }

  // Validate appointment date is not in the past (based on date part)
  var todayStr = getTodayString();
  if (data.date < todayStr) {
    return "Appointment date cannot be in the past.";
  }
  return null;
}

/**
 * Validates the core inputs of a medication reminder.
 * @param {Object} data Medication data object.
 * @return {string|null} Error message, or null if valid.
 */
function validateMedication(data) {
  if (!data.patientName || data.patientName.trim().length === 0) {
    return "Patient Name is required.";
  }
  if (!data.medicineName || data.medicineName.trim().length === 0) {
    return "Medicine Name is required.";
  }
  if (!data.dosage || data.dosage.trim().length === 0) {
    return "Dosage is required (e.g. 500mg, 1 tablet).";
  }
  if (!data.frequency || data.frequency.trim().length === 0) {
    return "Frequency is required (e.g. Daily, Twice Daily).";
  }
  if (!data.timing || data.timing.trim().length === 0) {
    return "Timing is required (e.g. 08:00 AM).";
  }
  if (!data.startDate || !data.endDate) {
    return "Start and End dates are required.";
  }
  if (data.startDate > data.endDate) {
    return "Start date cannot be after the end date.";
  }
  if (data.phone && !isValidPhone(data.phone)) {
    return "Invalid phone number format. Must be international E.164 format (e.g. +1234567890).";
  }
  return null;
}

/**
 * Validates phone numbers using standard international format check (E.164).
 * @param {string} phone
 * @return {boolean}
 */
function isValidPhone(phone) {
  var phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Sanitizes input to prevent basic HTML injection / XSS.
 * @param {string} input String to sanitize.
 * @return {string} Sanitized string.
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates a clean ISO String for date timestamps.
 * @return {string}
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Gets local date string as YYYY-MM-DD
 * @return {string}
 */
function getTodayString() {
  var d = new Date();
  var month = '' + (d.getMonth() + 1);
  var day = '' + d.getDate();
  var year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * Generate a dynamic Google Calendar Add link.
 * @param {Object} appt Appointment object
 * @return {string}
 */
function generateGoogleCalendarUrl(appt) {
  var title = encodeURIComponent(appt.Title || "Doctor Appointment");
  var details = encodeURIComponent("Doctor: " + appt.DoctorName + "\nNotes: " + (appt.Notes || ""));
  var location = encodeURIComponent(appt.Hospital || "Clinic");
  
  // Format Date and Time: YYYYMMDDTHHMMSS
  var dateStr = appt.Date.replace(/-/g, ""); // YYYYMMDD
  var timeStr = appt.Time.replace(/:/g, ""); // HHMM
  
  var startDateTime = dateStr + "T" + timeStr + "00";
  // Add 30 minutes duration for default end time
  var hours = parseInt(appt.Time.split(":")[0], 10);
  var mins = parseInt(appt.Time.split(":")[1], 10) + 30;
  if (mins >= 60) {
    hours += 1;
    mins -= 60;
  }
  var endHours = hours < 10 ? "0" + hours : "" + hours;
  var endMins = mins < 10 ? "0" + mins : "" + mins;
  var endDateTime = dateStr + "T" + endHours + endMins + "00";

  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + 
         "&dates=" + startDateTime + "/" + endDateTime + 
         "&details=" + details + 
         "&location=" + location;
}

/**
 * One-time setup script to initialize Google Sheets database.
 * Sets up sheets and configures header rows.
 */
function runOnce() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var ssId = scriptProperties.getProperty("SPREADSHEET_ID");
  
  if (!ssId) {
    throw new Error("SPREADSHEET_ID property is missing from Script Properties. Please define it in project settings.");
  }
  
  var ss = SpreadsheetApp.openById(ssId);
  
  var sheetsLayout = {
    "Appointments": ["AppointmentID", "PatientName", "DoctorName", "Title", "Hospital", "Date", "Time", "Phone", "Notes", "CreatedAt"],
    "Medications": ["MedicationID", "PatientName", "MedicineName", "Dosage", "Frequency", "Timing", "StartDate", "EndDate", "Phone", "Instructions", "Status", "CreatedAt"],
    "Summaries": ["SummaryID", "PatientName", "Summary", "GeneratedDate"],
    "Reports": ["ReportID", "PatientName", "ReportData", "CreatedDate"],
    "ReminderLogs": ["ReminderID", "PatientName", "Message", "Status", "Timestamp"]
  };
  
  for (var name in sheetsLayout) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    
    // Setup header row if empty
    if (sheet.getLastRow() === 0) {
      var headers = sheetsLayout[name];
      sheet.appendRow(headers);
      
      // Formatting headers
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setFontWeight("bold");
      range.setBackground("#2563EB");
      range.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
  }
  
  Logger.log("Google Sheets Database Tables Initialized Successfully.");
}

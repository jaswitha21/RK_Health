/**
 * RK Health – AI Smart Patient Appointment & Medication Reminder System
 * Backend Router and Web App Endpoints (Code.gs)
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  var action = e.parameter.action;
  var response = { success: false, message: "Invalid GET Action." };
  
  try {
    if (action === "getAllData") {
      response = {
        success: true,
        appointments: readSheetData("Appointments"),
        medications: readSheetData("Medications"),
        summaries: readSheetData("Summaries"),
        reports: readSheetData("Reports"),
        reminderLogs: readSheetData("ReminderLogs"),
        stats: compileDashboardStats()
      };
    } else if (action === "getAppointments") {
      response = { success: true, appointments: readSheetData("Appointments") };
    } else if (action === "getMedications") {
      response = { success: true, medications: readSheetData("Medications") };
    } else if (action === "getSummaries") {
      response = { success: true, summaries: readSheetData("Summaries") };
    } else if (action === "getReports") {
      response = { success: true, reports: readSheetData("Reports") };
    } else if (action === "getReminderLogs") {
      response = { success: true, reminderLogs: readSheetData("ReminderLogs") };
    } else if (action === "getStats") {
      response = { success: true, stats: compileDashboardStats() };
    }
  } catch (err) {
    response = { success: false, message: "Error: " + err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  var action = e.parameter.action;
  var response = { success: false, message: "Invalid POST Action." };
  
  try {
    var postData = JSON.parse(e.postData.contents);
    
    // Sanitize basic text strings
    for (var key in postData) {
      if (typeof postData[key] === 'string') {
        postData[key] = sanitizeInput(postData[key]);
      }
    }
    
    if (action === "addAppointment") {
      var validationError = validateAppointment(postData);
      if (validationError) {
        response = { success: false, message: validationError };
      } else {
        var apptObj = {
          "AppointmentID": Utilities.getUuid(),
          "PatientName": postData.patientName,
          "DoctorName": postData.doctorName,
          "Title": postData.title || "Routine Visit",
          "Hospital": postData.hospital || "Main Clinic",
          "Date": postData.date,
          "Time": postData.time,
          "Phone": postData.phone || "",
          "Notes": postData.notes || "",
          "CreatedAt": getTimestamp()
        };
        writeRowData("Appointments", apptObj);
        
        // Auto-send SMS reminder if contact number provided
        if (apptObj.Phone) {
          var smsBody = "Hi " + apptObj.PatientName + ", your appointment with " + apptObj.DoctorName + 
                        " is confirmed on " + apptObj.Date + " at " + apptObj.Time + " at " + apptObj.Hospital + ".";
          sendSMSMessage(apptObj.Phone, smsBody, apptObj.PatientName);
        }
        
        response = { success: true, message: "Appointment added successfully.", appointment: apptObj };
      }
      
    } else if (action === "updateAppointment") {
      var validationError = validateAppointment(postData);
      if (validationError) {
        response = { success: false, message: validationError };
      } else {
        var isUpdated = updateRowData("Appointments", "AppointmentID", postData.appointmentId, {
          "PatientName": postData.patientName,
          "DoctorName": postData.doctorName,
          "Title": postData.title,
          "Hospital": postData.hospital,
          "Date": postData.date,
          "Time": postData.time,
          "Phone": postData.phone,
          "Notes": postData.notes
        });
        
        if (isUpdated) {
          response = { success: true, message: "Appointment updated successfully." };
        } else {
          response = { success: false, message: "Appointment ID not found." };
        }
      }
      
    } else if (action === "deleteAppointment") {
      var isDeleted = deleteRowData("Appointments", "AppointmentID", postData.appointmentId);
      if (isDeleted) {
        response = { success: true, message: "Appointment deleted successfully." };
      } else {
        response = { success: false, message: "Appointment ID not found." };
      }
      
    } else if (action === "addMedication") {
      var validationError = validateMedication(postData);
      if (validationError) {
        response = { success: false, message: validationError };
      } else {
        var medObj = {
          "MedicationID": Utilities.getUuid(),
          "PatientName": postData.patientName,
          "MedicineName": postData.medicineName,
          "Dosage": postData.dosage,
          "Frequency": postData.frequency,
          "Timing": postData.timing,
          "StartDate": postData.startDate,
          "EndDate": postData.endDate,
          "Phone": postData.phone || "",
          "Instructions": postData.instructions || "Take as directed.",
          "Status": "Active",
          "CreatedAt": getTimestamp()
        };
        writeRowData("Medications", medObj);
        
        // Auto-send confirmation SMS
        if (medObj.Phone) {
          var smsBody = "Hi " + medObj.PatientName + ", new medication added: " + medObj.MedicineName + 
                        " (" + medObj.Dosage + "). Timing: " + medObj.Timing + ". Instructions: " + medObj.Instructions;
          sendSMSMessage(medObj.Phone, smsBody, medObj.PatientName);
        }
        
        response = { success: true, message: "Medication schedule created.", medication: medObj };
      }
      
    } else if (action === "updateMedication") {
      var validationError = validateMedication(postData);
      if (validationError) {
        response = { success: false, message: validationError };
      } else {
        var isUpdated = updateRowData("Medications", "MedicationID", postData.medicationId, {
          "PatientName": postData.patientName,
          "MedicineName": postData.medicineName,
          "Dosage": postData.dosage,
          "Frequency": postData.frequency,
          "Timing": postData.timing,
          "StartDate": postData.startDate,
          "EndDate": postData.endDate,
          "Phone": postData.phone,
          "Instructions": postData.instructions,
          "Status": postData.status || "Active"
        });
        
        if (isUpdated) {
          response = { success: true, message: "Medication updated successfully." };
        } else {
          response = { success: false, message: "Medication ID not found." };
        }
      }
      
    } else if (action === "deleteMedication") {
      var isDeleted = deleteRowData("Medications", "MedicationID", postData.medicationId);
      if (isDeleted) {
        response = { success: true, message: "Medication entry deleted." };
      } else {
        response = { success: false, message: "Medication ID not found." };
      }
      
    } else if (action === "generateSummary") {
      if (!postData.patientName) {
        response = { success: false, message: "Patient Name is required to generate AI Summary." };
      } else {
        var aiSummary = generateAISummary(postData);
        var summaryObj = {
          "SummaryID": Utilities.getUuid(),
          "PatientName": postData.patientName,
          "Summary": JSON.stringify(aiSummary),
          "GeneratedDate": getTimestamp()
        };
        writeRowData("Summaries", summaryObj);
        response = { success: true, message: "AI summary generated.", summary: summaryObj };
      }
      
    } else if (action === "sendSMS") {
      if (!postData.phone || !postData.messageBody) {
        response = { success: false, message: "Phone number and Message Body are required." };
      } else {
        var smsResult = sendSMSMessage(postData.phone, postData.messageBody, postData.patientName);
        response = smsResult;
      }
      
    } else if (action === "generateReport") {
      if (!postData.patientName) {
        response = { success: false, message: "Patient Name is required." };
      } else {
        var patientName = postData.patientName;
        
        // Compile all patient context
        var appointments = readSheetData("Appointments").filter(function(a) { return a.PatientName.toLowerCase() === patientName.toLowerCase(); });
        var medications = readSheetData("Medications").filter(function(m) { return m.PatientName.toLowerCase() === patientName.toLowerCase(); });
        var summaries = readSheetData("Summaries").filter(function(s) { return s.PatientName.toLowerCase() === patientName.toLowerCase(); });
        
        var reportDataObj = {
          appointmentsCount: appointments.length,
          medicationsCount: medications.length,
          latestAppointments: appointments.slice(-5),
          medicationsList: medications,
          latestSummaries: summaries.slice(-3)
        };
        
        var reportObj = {
          "ReportID": Utilities.getUuid(),
          "PatientName": patientName,
          "ReportData": JSON.stringify(reportDataObj),
          "CreatedDate": getTimestamp()
        };
        
        writeRowData("Reports", reportObj);
        response = { success: true, message: "Report generated successfully.", report: reportObj };
      }
    }
  } catch (err) {
    response = { success: false, message: "Server Error: " + err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

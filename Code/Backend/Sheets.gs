/**
 * Database Layer for RK Health (Google Sheets CRUD)
 */

/**
 * Gets Spreadsheet instance using ID from project properties.
 */
function getSpreadsheet() {
  var ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) {
    throw new Error("SPREADSHEET_ID script property is missing. Please define it in project settings.");
  }
  return SpreadsheetApp.openById(ssId);
}

/**
 * Helper to convert sheet rows into JSON array of objects.
 * Uses headers (row 1) as property keys.
 */
function readSheetData(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // Only header or empty
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var hasValue = false;
    for (var j = 0; j < headers.length; j++) {
      var cellVal = row[j];
      // Format dates nicely
      if (cellVal instanceof Date) {
        cellVal = cellVal.toISOString();
      }
      obj[headers[j]] = cellVal;
      if (cellVal !== "") {
        hasValue = true;
      }
    }
    if (hasValue) {
      result.push(obj);
    }
  }
  return result;
}

/**
 * Helper to append a row of data based on column headers.
 */
function writeRowData(sheetName, dataObject) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' not found.");
  }
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var newRow = [];
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var val = dataObject[key];
    newRow.push(val !== undefined ? val : "");
  }
  
  sheet.appendRow(newRow);
  return dataObject;
}

/**
 * Generic update operation. Finds row by key column matching value, updates other fields.
 */
function updateRowData(sheetName, keyColumnName, keyValue, updatedFields) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var keyColIndex = headers.indexOf(keyColumnName);
  if (keyColIndex === -1) {
    throw new Error("Primary key column '" + keyColumnName + "' not found in sheet headers.");
  }
  
  var keysRange = sheet.getRange(2, keyColIndex + 1, lastRow - 1, 1);
  var keyValues = keysRange.getValues();
  
  for (var i = 0; i < keyValues.length; i++) {
    if (keyValues[i][0].toString() === keyValue.toString()) {
      var rowIndex = i + 2; // 1-based, plus 1 header row
      var rowRange = sheet.getRange(rowIndex, 1, 1, lastCol);
      var currentRowValues = rowRange.getValues()[0];
      
      var newValues = [];
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        if (updatedFields[key] !== undefined) {
          newValues.push(updatedFields[key]);
        } else {
          newValues.push(currentRowValues[j]);
        }
      }
      
      rowRange.setValues([newValues]);
      return true;
    }
  }
  return false;
}

/**
 * Generic delete operation. Finds row by key column matching value, removes row.
 */
function deleteRowData(sheetName, keyColumnName, keyValue) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var keyColIndex = headers.indexOf(keyColumnName);
  if (keyColIndex === -1) return false;
  
  var keysRange = sheet.getRange(2, keyColIndex + 1, lastRow - 1, 1);
  var keyValues = keysRange.getValues();
  
  for (var i = 0; i < keyValues.length; i++) {
    if (keyValues[i][0].toString() === keyValue.toString()) {
      var rowIndex = i + 2;
      sheet.deleteRow(rowIndex);
      return true;
    }
  }
  return false;
}

/**
 * Compiles dashboard analytics and global stats.
 */
function compileDashboardStats() {
  var appointments = readSheetData("Appointments");
  var medications = readSheetData("Medications");
  var summaries = readSheetData("Summaries");
  var reports = readSheetData("Reports");
  var logs = readSheetData("ReminderLogs");
  
  var todayStr = getTodayString();
  
  // Calculate upcoming appointments
  var upcoming = appointments.filter(function(appt) {
    return appt.Date >= todayStr;
  }).length;
  
  // Calculate active medications
  var activeMeds = medications.filter(function(med) {
    return med.Status === "Active";
  }).length;
  
  // Compliance Score calculation (based on active medications ratio or default baseline)
  var compliance = 100;
  if (medications.length > 0) {
    var activeOrCompleted = medications.filter(function(med) {
      return med.Status === "Active" || med.Status === "Completed";
    }).length;
    compliance = Math.round((activeOrCompleted / medications.length) * 100);
  }
  
  // SMS Gateway Status check (failed logs percentage)
  var smsStatus = "Healthy";
  if (logs.length > 0) {
    var failedSMS = logs.filter(function(log) {
      return log.Status === "Failed";
    }).length;
    var failureRate = failedSMS / logs.length;
    if (failureRate > 0.3) {
      smsStatus = "Degraded";
    } else if (failureRate > 0.1) {
      smsStatus = "Warning";
    }
  }
  
  return {
    totalAppointments: appointments.length,
    upcomingAppointments: upcoming,
    activeReminders: activeMeds,
    totalSummaries: summaries.length,
    totalReports: reports.length,
    complianceScore: compliance,
    smsStatus: smsStatus
  };
}

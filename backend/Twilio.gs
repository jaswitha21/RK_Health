/**
 * Twilio SMS Gateway Integration Layer for RK Health
 */

/**
 * Sends an SMS message using Twilio's API and logs the outcome.
 * @param {string} toPhone The patient's E.164 phone number.
 * @param {string} messageBody The body content of the text message.
 * @param {string} patientName The name of the patient.
 * @return {Object} Status object of the delivery.
 */
function sendSMSMessage(toPhone, messageBody, patientName) {
  var props = PropertiesService.getScriptProperties();
  var accountSid = props.getProperty("TWILIO_ACCOUNT_SID");
  var authToken = props.getProperty("TWILIO_AUTH_TOKEN");
  var twilioNumber = props.getProperty("TWILIO_NUMBER");
  
  var status = "Sent";
  var logMessage = messageBody;
  
  // If credentials are not set, log and proceed with Mock SMS status so the user can test the UI flow.
  if (!accountSid || !authToken || !twilioNumber) {
    Logger.log("Twilio credentials are not set. Mocking SMS transmission to " + toPhone);
    status = "Sent (Mock Mode)";
    
    // Log to Google Sheet ReminderLogs
    writeRowData("ReminderLogs", {
      "ReminderID": Utilities.getUuid(),
      "PatientName": patientName || "Unknown",
      "Message": logMessage,
      "Status": "Sent",
      "Timestamp": getTimestamp()
    });
    
    return {
      success: true,
      message: "Twilio credentials missing. SMS logged in database.",
      status: "mock_sent"
    };
  }

  var url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
  
  var payload = {
    "To": toPhone,
    "From": twilioNumber,
    "Body": messageBody
  };
  
  var options = {
    "method": "post",
    "headers": {
      "Authorization": "Basic " + Utilities.base64Encode(accountSid + ":" + authToken)
    },
    "payload": payload,
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (responseCode === 200 || responseCode === 201) {
      var json = JSON.parse(responseText);
      status = "Sent";
      Logger.log("Twilio SMS sent successfully. SID: " + json.sid);
    } else {
      status = "Failed";
      Logger.log("Twilio SMS failed with code " + responseCode + ": " + responseText);
    }
  } catch (error) {
    status = "Failed";
    Logger.log("Exception in Twilio SMS transmission: " + error.toString());
  }
  
  // Log to Google Sheet ReminderLogs
  writeRowData("ReminderLogs", {
    "ReminderID": Utilities.getUuid(),
    "PatientName": patientName || "Unknown",
    "Message": logMessage,
    "Status": status,
    "Timestamp": getTimestamp()
  });
  
  return {
    success: (status === "Sent"),
    message: status === "Sent" ? "SMS sent successfully." : "SMS failed. Check Apps Script logs.",
    status: status.toLowerCase()
  };
}

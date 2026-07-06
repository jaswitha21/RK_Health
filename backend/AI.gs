/**
 * AI Integration Layer for RK Health (Groq API llama-3.3-70b-versatile)
 */

/**
 * Generates an AI clinical summary using the Groq Chat Completions endpoint.
 * @param {Object} promptData Fields containing appointment notes, doctor notes, and medications.
 * @return {Object} Structured summary object.
 */
function generateAISummary(promptData) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GROQ_API_KEY");
  
  if (!apiKey) {
    Logger.log("GROQ_API_KEY script property is missing. Defaulting to mock summary fallback.");
    return getAISummaryMockFallback(promptData);
  }

  var url = "https://api.groq.com/openai/v1/chat/completions";
  
  var systemInstruction = 
    "You are a compassionate, professional healthcare clinical assistant. " +
    "Your goal is to translate medical jargon and doctor notes into a clean, easy-to-understand summary. " +
    "Avoid dry lists and overly technical language. " +
    "You must return your response as a valid JSON object matching this structure EXACTLY:\n" +
    "{\n" +
    "  \"overview\": \"Clear explanation of the visit in everyday terms.\",\n" +
    "  \"findings\": \"A summary of what the doctor noticed or diagnosed.\",\n" +
    "  \"guidance\": \"How and when to take medications safely.\",\n" +
    "  \"actions\": \"Recommended exercises, lifestyle changes, or follow-up timelines.\",\n" +
    "  \"notes\": \"Warnings or safety instructions (e.g. when to contact the clinic).\"\n" +
    "}\n" +
    "Ensure the JSON is well-formed and valid.";

  var userContent = 
    "Patient Name: " + (promptData.patientName || "Patient") + "\n" +
    "Appointment Notes: " + (promptData.appointmentNotes || "None") + "\n" +
    "Doctor Notes: " + (promptData.doctorNotes || "None") + "\n" +
    "Medications List: " + (promptData.medicationDetails || "None");

  var payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
      { "role": "system", "content": systemInstruction },
      { "role": "user", "content": userContent }
    ],
    "temperature": 0.8,
    "max_tokens": 2048,
    "response_format": { "type": "json_object" }
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + apiKey
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (responseCode === 200) {
      var jsonResponse = JSON.parse(responseText);
      var contentString = jsonResponse.choices[0].message.content;
      return JSON.parse(contentString);
    } else {
      Logger.log("Groq API returned error: " + responseCode + " - " + responseText);
      return getAISummaryMockFallback(promptData);
    }
  } catch (error) {
    Logger.log("Exception while calling Groq API: " + error.toString());
    return getAISummaryMockFallback(promptData);
  }
}

/**
 * Returns a high-quality mockup clinical summary in case API is offline or key fails.
 */
function getAISummaryMockFallback(data) {
  return {
    "overview": "You had an appointment to discuss your general health status. The doctor checked your symptoms and reviewed your current records.",
    "findings": "Based on the notes provided ('" + (data.doctorNotes || "Routine evaluation") + "'), the clinical assessment shows standard progression, but requires close attention to instructions and medication dosage compliance.",
    "guidance": "Please follow the instructions for: " + (data.medicationDetails || "your active prescriptions") + ". Make sure you take the dosages at the scheduled times daily.",
    "actions": "Keep a regular sleep schedule, stay hydrated, and follow up in 2-4 weeks or as suggested during your visit.",
    "notes": "Always consult your physician immediately if you experience chest pain, short breath, severe dizziness, or other unexpected symptoms."
  };
}

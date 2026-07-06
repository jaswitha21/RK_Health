# Google Apps Script Web App API Documentation

This document describes the REST API endpoints and data payloads for the **RK Health** Google Apps Script backend.

Google Apps Script web apps receive all request traffic through two standard functions: `doGet(e)` and `doPost(e)`. The operations are multiplexed via the `action` URL query parameter.

---

## Base URL
When deployed, the base URL will resemble:
`https://script.google.com/macros/s/AKfycb.../exec`

---

## 1. GET Operations (`doGet`)
All queries are sent as HTTP `GET` requests with `action` parameters.

### 1.1 Get All Data
Fetches appointments, medications, summaries, reports, and global stats.
* **URL**: `?action=getAllData`
* **Response**:
```json
{
  "success": true,
  "appointments": [...],
  "medications": [...],
  "summaries": [...],
  "reports": [...],
  "stats": {
    "totalAppointments": 12,
    "upcomingAppointments": 3,
    "activeReminders": 5,
    "totalSummaries": 4,
    "totalReports": 2,
    "complianceScore": 85,
    "smsStatus": "Healthy"
  }
}
```

### 1.2 Get Individual Components
* **URL**: `?action=getAppointments`
* **URL**: `?action=getMedications`
* **URL**: `?action=getSummaries`
* **URL**: `?action=getReports`
* **URL**: `?action=getReminderLogs`

---

## 2. POST Operations (`doPost`)
All writes, updates, deletions, and third-party action triggers are submitted via HTTP `POST` with the appropriate `action` query parameter. The body of the request must be a valid JSON string.

### 2.1 Appointments

#### Add Appointment
* **URL**: `?action=addAppointment`
* **Payload**:
```json
{
  "patientName": "John Doe",
  "doctorName": "Dr. Sarah Smith",
  "title": "Cardiology Checkup",
  "hospital": "City Heart Center",
  "date": "2026-07-20",
  "time": "14:30",
  "phone": "+12345678901",
  "notes": "Discuss blood pressure reading"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Appointment created successfully.",
  "appointment": { "AppointmentID": "uuid-...", "PatientName": "John Doe", ... }
}
```

#### Update Appointment
* **URL**: `?action=updateAppointment`
* **Payload**: Includes full object including `appointmentId`.
* **Response**:
```json
{
  "success": true,
  "message": "Appointment updated successfully."
}
```

#### Delete Appointment
* **URL**: `?action=deleteAppointment`
* **Payload**:
```json
{
  "appointmentId": "uuid-..."
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Appointment deleted successfully."
}
```

---

### 2.2 Medications

#### Add Medication
* **URL**: `?action=addMedication`
* **Payload**:
```json
{
  "patientName": "John Doe",
  "medicineName": "Lisinopril",
  "dosage": "10mg",
  "frequency": "Daily",
  "timing": "08:00 AM",
  "startDate": "2026-07-06",
  "endDate": "2026-10-06",
  "phone": "+12345678901",
  "instructions": "Take daily on empty stomach"
}
```

#### Update Medication
* **URL**: `?action=updateMedication`
* **Payload**: Includes full object including `medicationId`.

#### Delete Medication
* **URL**: `?action=deleteMedication`
* **Payload**: `{ "medicationId": "uuid-..." }`

---

### 2.3 AI Health Summary Generator
Generates a patient-friendly summary based on appointment data and notes.
* **URL**: `?action=generateSummary`
* **Payload**:
```json
{
  "patientName": "John Doe",
  "appointmentNotes": "Patient has light hypertension. Discussed daily exercise and low salt diet.",
  "doctorNotes": "BP 135/85. Start Lisinopril 10mg once daily.",
  "medicationDetails": "Lisinopril 10mg, Daily at 08:00 AM"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "AI summary generated.",
  "summary": {
    "SummaryID": "uuid-...",
    "PatientName": "John Doe",
    "Summary": {
      "overview": "You recently completed a cardiology checkup...",
      "findings": "Your blood pressure is slightly elevated at 135/85.",
      "guidance": "Start Lisinopril 10mg daily in the morning.",
      "actions": "Limit salt intake, do light physical activity, check BP weekly.",
      "notes": "Contact clinic if you experience dizziness or dry cough."
    },
    "GeneratedDate": "2026-07-06T19:30:00.000Z"
  }
}
```

---

### 2.4 Twilio SMS Reminder
Sends an on-demand SMS reminder for a medication or appointment.
* **URL**: `?action=sendSMS`
* **Payload**:
```json
{
  "type": "medication", // or "appointment"
  "recipientName": "John Doe",
  "phone": "+12345678901",
  "medicineName": "Lisinopril",
  "dosage": "10mg",
  "timing": "08:00 AM",
  "instructions": "Take daily on empty stomach"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "SMS notification sent.",
  "status": "queued"
}
```

---

### 2.5 Generate Health Report
Creates a snapshot of health statistics for print and download.
* **URL**: `?action=generateReport`
* **Payload**:
```json
{
  "patientName": "John Doe"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Health report compiled successfully.",
  "report": {
    "ReportID": "uuid-...",
    "PatientName": "John Doe",
    "ReportData": { ... },
    "CreatedDate": "2026-07-06T19:35:00.000Z"
  }
}
```

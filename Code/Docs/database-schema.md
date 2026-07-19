# Google Sheets Database Schema

This document details the layout, data types, and structural definitions of the Google Sheets tables used in **RK Health**.

The database resides in a single Google Sheet with multiple sheets (tabs).

---

## 1. Appointments Sheet
Stores doctor consultation events, schedules, and visit notes.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| **AppointmentID** | String (UUID) | Primary Key. Unique identifier generated at creation. |
| **PatientName** | String | Name of the patient. Required. |
| **DoctorName** | String | Name of the doctor. Required. |
| **Title** | String | Subject or reason for the appointment. |
| **Hospital** | String | Clinic, hospital, or virtual room location. |
| **Date** | String (YYYY-MM-DD)| Scheduled date of the appointment. |
| **Time** | String (HH:MM) | Scheduled time of the appointment. |
| **Phone** | String | Patient phone number (E.164 international format). |
| **Notes** | String | Initial patient notes, symptoms, or visit instructions. |
| **CreatedAt** | String (ISO 8601)| Creation date-time. |

---

## 2. Medications Sheet
Tracks prescription information, timing details, active schedule tracking, and adherence metadata.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| **MedicationID** | String (UUID) | Primary Key. Unique identifier generated at creation. |
| **PatientName** | String | Name of the patient. Required. |
| **MedicineName** | String | Commercial or generic drug name. Required. |
| **Dosage** | String | Amount of medication to take (e.g., "500mg", "1 tablet"). |
| **Frequency** | String | Repeat interval (e.g., "Daily", "Twice Daily", "Weekly"). |
| **Timing** | String | Hour slots or conditions (e.g., "08:00", "After breakfast"). |
| **StartDate** | String (YYYY-MM-DD)| Start date of prescription. |
| **EndDate** | String (YYYY-MM-DD)| Stop date of prescription. |
| **Phone** | String | Patient phone number to send SMS notifications to. |
| **Instructions** | String | Custom usage instructions (e.g., "Take with plenty of water"). |
| **Status** | String | `Active`, `Paused`, or `Completed`. |
| **CreatedAt** | String (ISO 8601)| Creation date-time. |

---

## 3. Summaries Sheet
Caches generated AI medical summaries from visit reports and logs.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| **SummaryID** | String (UUID) | Primary Key. Unique identifier. |
| **PatientName** | String | Name of the patient. Required. |
| **Summary** | String (JSON Text) | Detailed clinical overview parsed into structured JSON format. |
| **GeneratedDate**| String (ISO 8601)| Generation date-time. |

---

## 4. Reports Sheet
Holds comprehensive health status outputs generated manually or automatically.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| **ReportID** | String (UUID) | Primary Key. Unique identifier. |
| **PatientName** | String | Name of the patient. Required. |
| **ReportData** | String (JSON Text) | Snapshot of patient stats, appointment counts, medication list, and compliance score. |
| **CreatedDate** | String (ISO 8601)| Creation timestamp. |

---

## 5. ReminderLogs Sheet
Audit trail for Twilio SMS reminders.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| **ReminderID** | String (UUID) | Primary Key. Unique identifier. |
| **PatientName** | String | Name of the patient. Required. |
| **Message** | String | Complete text of SMS message sent. |
| **Status** | String | `Sent` or `Failed`. |
| **Timestamp** | String (ISO 8601)| Log timestamp. |

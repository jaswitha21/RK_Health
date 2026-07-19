/**
 * RK Health – Web Client Configuration
 */
const config = {
  // Toggle this to true to run fully offline using browser LocalStorage mock database.
  // Toggle to false and paste your deployed Apps Script Web App URL below to go live.
  MOCK_MODE: true,
  
  // Google Apps Script Web App Endpoint URL
  API_ENDPOINT: "https://script.google.com/macros/s/AKfycbzzMockURL-PleaseReplaceThisWithYourDeployedUrl/exec",
  
  // App branding configuration
  APP_NAME: "RK Health",
  APP_TITLE: "RK Health – AI Smart Patient Appointment & Medication Reminder System",
  
  // Default values for initial demonstration
  DEMO_DATA: {
    appointments: [
      {
        AppointmentID: "demo-appt-1",
        PatientName: "Apex Miller",
        DoctorName: "Dr. Clara Mercer",
        Title: "Post-op Followup Checkup",
        Hospital: "St. Jude Heart Hospital",
        Date: "2026-07-15",
        Time: "10:30",
        Phone: "+15550199",
        Notes: "Feeling much better, moderate chest tension in mornings. Check heart rate patterns.",
        CreatedAt: "2026-07-06T12:00:00.000Z"
      },
      {
        AppointmentID: "demo-appt-2",
        PatientName: "Apex Miller",
        DoctorName: "Dr. James Lee",
        Title: "Orthopedic consultation",
        Hospital: "Mercy Orthopedic Care",
        Date: "2026-07-22",
        Time: "14:15",
        Phone: "+15550199",
        Notes: "Knee stiffness when climbing stairs. Discuss physical therapy progress.",
        CreatedAt: "2026-07-06T12:30:00.000Z"
      }
    ],
    medications: [
      {
        MedicationID: "demo-med-1",
        PatientName: "Apex Miller",
        MedicineName: "Lisinopril",
        Dosage: "10mg",
        Frequency: "Daily",
        Timing: "08:00 AM",
        StartDate: "2026-07-06",
        EndDate: "2026-10-06",
        Phone: "+15550199",
        Instructions: "Take daily on an empty stomach with a full glass of water.",
        Status: "Active",
        CreatedAt: "2026-07-06T12:10:00.000Z"
      },
      {
        MedicationID: "demo-med-2",
        PatientName: "Apex Miller",
        MedicineName: "Atorvastatin",
        Dosage: "20mg",
        Frequency: "Daily",
        Timing: "09:00 PM",
        StartDate: "2026-07-06",
        EndDate: "2026-09-06",
        Phone: "+15550199",
        Instructions: "Take in the evening. Limit grapefruit juice intake.",
        Status: "Active",
        CreatedAt: "2026-07-06T12:15:00.000Z"
      },
      {
        MedicationID: "demo-med-3",
        PatientName: "Apex Miller",
        MedicineName: "Amoxicillin",
        Dosage: "500mg",
        Frequency: "Three times daily",
        Timing: "08:00 AM, 02:00 PM, 08:00 PM",
        StartDate: "2026-06-25",
        EndDate: "2026-07-05",
        Phone: "+15550199",
        Instructions: "Complete full 10-day course. Take with meals.",
        Status: "Completed",
        CreatedAt: "2026-06-25T08:00:00.000Z"
      }
    ],
    summaries: [
      {
        SummaryID: "demo-sum-1",
        PatientName: "Apex Miller",
        Summary: JSON.stringify({
          overview: "You completed your recovery checkup following surgery. The clinical team notes positive recovery, but advised active monitoring of minor symptoms.",
          findings: "Your incision has healed perfectly. Your blood pressure has stabilized at 122/80 since starting the new medication regimen.",
          guidance: "Continue Lisinopril 10mg once daily in the morning. Avoid skipping doses even if feeling completely well.",
          actions: "Resume light walking routines (15-20 minutes daily). Schedule orthopedic session in two weeks.",
          notes: "Please call immediately if your chest tension returns or if you develop unexpected swelling."
        }),
        GeneratedDate: "2026-07-06T13:00:00.000Z"
      }
    ],
    reports: [],
    reminderLogs: [
      {
        ReminderID: "demo-log-1",
        PatientName: "Apex Miller",
        Message: "Hi Apex Miller, medication reminder: Lisinopril (10mg) is scheduled for 08:00 AM. Instructions: Take daily on empty stomach.",
        Status: "Sent",
        Timestamp: "2026-07-06T08:00:10.000Z"
      },
      {
        ReminderID: "demo-log-2",
        PatientName: "Apex Miller",
        Message: "Hi Apex Miller, your appointment with Dr. Clara Mercer is confirmed for 2026-07-15 at 10:30 at St. Jude Heart Hospital.",
        Status: "Sent",
        Timestamp: "2026-07-06T12:00:15.000Z"
      }
    ]
  }
};

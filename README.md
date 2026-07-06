# RK Health – AI Smart Patient Appointment & Medication Reminder System

**RK Health** is a production-quality, serverless healthcare management dashboard that empowers patients to manage doctor appointments, track medication adherence, get automated SMS notifications, and read AI-powered clinical visit summaries translated into simple, everyday language.

The application leverages a responsive modern single-page dashboard architecture connected securely to a Google Apps Script Web App backend backed by Google Sheets.

---

## Key System Features

1. **Healthcare Dashboard**: Core metrics displaying total visits, upcoming schedules, active medication tracking, compliance scores (adherence gauge), and live SMS delivery audit status.
2. **Appointment Scheduler**: Complete CRUD operations, date filters, patient name search, and automatic link generators to schedule events in one click via **Google Calendar**.
3. **Medication Prescription Tracker**: Custom prescription logs detailing dosage strength, frequency, timings, start/end dates, and treatment status. Features active card lists, complete compliance tracking, and immediate SMS triggers.
4. **AI-Powered Health Narrative**: Integrates with the **Groq AI API** (`llama-3.3-70b-versatile` model) to convert complex doctor findings and clinical jargon into clear, comforting, patient-friendly overviews.
5. **Audited Logging**: Aggregated event logs showing all database modifications and message receipts.
6. **Consolidated Medical Reports**: Compiles a patient's entire medical record (schedules, prescriptions, compliance metrics, and latest AI reviews) into a clean, printable PDF sheet layout.
7. **Automated SMS reminders**: Integrates with the **Twilio SMS Gateway** to deliver appointment alerts and medication instructions.

---

## Technology Stack

- **Frontend Client**: HTML5, Vanilla CSS3, Vanilla ES6+ Javascript, Font Awesome Icons, Poppins Google Font, Chart.js CDN.
- **Backend API**: Google Apps Script Web App.
- **Cloud Database**: Google Sheets.
- **AI Service**: Groq API (`llama-3.3-70b-versatile`).
- **SMS Gateway**: Twilio API.
- **Calendar Engine**: Google Calendar Event URI.

---

## File Directory Layout

```text
RK-Health/
├── index.html           # Main Single Page Application structure
├── style.css            # Custom responsive healthcare stylesheet & print CSS
├── script.js            # Client-side routing, local cache database, and fetch calls
├── config.js            # Configuration settings (API endpoint and Mock Mode switcher)
├── README.md            # Master project guide
│
├── backend/
│   ├── Code.gs          # Entry points (doGet/doPost) and request routing
│   ├── Sheets.gs        # Google Sheets database CRUD operations
│   ├── AI.gs            # Groq API Llama summary fetch client
│   ├── Twilio.gs        # Twilio API SMS dispatch helper
│   └── Utils.gs         # Validation, UUIDs, and Sheet initializations
│
└── docs/
    ├── architecture.md        # System architecture detailing data streams
    ├── database-schema.md     # Google Sheets database column specs
    ├── api-documentation.md   # Apps Script Web API specifications
    └── deployment-guide.md    # Deployment and Project Settings setup guide
```

---

## Getting Started & Configuration

For full setup, database initialization, API settings, and live server deployment:
1. Open the [Deployment Guide](file:///docs/deployment-guide.md) to initialize the Google Sheet database.
2. Update the [config.js](file:///config.js) configuration file to connect your live Apps Script Web App URL.
3. Review the [System Architecture](file:///docs/architecture.md) for data flow specifications.
4. Review [API Documentation](file:///docs/api-documentation.md) for custom endpoint payloads.

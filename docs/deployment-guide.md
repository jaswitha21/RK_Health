# RK Health Deployment Guide

This guide provides instructions to deploy and configure the **RK Health** application components.

---

## 1. Database Setup (Google Sheets)

1. Create a new Google Spreadsheet in Google Drive.
2. Note the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_HERE]/edit`
3. You do not need to create sheets/columns manually. The backend code contains a `runOnce()` method that will automatically create the required tabs (`Appointments`, `Medications`, `Summaries`, `Reports`, `ReminderLogs`) and write the appropriate headers.

---

## 2. Backend Setup (Google Apps Script)

1. In your Google Spreadsheet, click on **Extensions** → **Apps Script**.
2. Delete any existing code in the editor.
3. Create the following files matching the files in the `backend/` directory:
   - `Code.gs`
   - `Sheets.gs`
   - `AI.gs`
   - `Twilio.gs`
   - `Utils.gs`
4. Copy the respective contents from the repository `backend/` directory into these files.

### 2.1 Configuring Environment Keys
To prevent exposing credentials in code, write them into the Apps Script **Script Properties**:
1. In the Apps Script sidebar, click the gear icon (**Project Settings**).
2. Scroll down to the **Script Properties** section.
3. Click **Add script property** for each of these keys:
   - `SPREADSHEET_ID`: The ID of your Google Sheet.
   - `GROQ_API_KEY`: Your Groq API key (e.g., `gsk_...`).
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID.
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token.
   - `TWILIO_NUMBER`: Your Twilio virtual phone number (e.g., `+1234567890`).

### 2.2 Initialize the Database
1. Go back to the **Editor** in Apps Script.
2. Select the `runOnce` function from the dropdown menu in the toolbar.
3. Click **Run**.
4. The script will request permissions to access your Spreadsheet and perform external API requests. Grant these permissions.
5. Once complete, check your Google Sheet. You should see all 5 tabs initialized with correct columns.

### 2.3 Deploy the Web App
1. Click **Deploy** → **New deployment** in the top right corner.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `RK Health Web App Backend v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (required to let the frontend send anonymous fetch requests).
4. Click **Deploy**.
5. Copy the **Web App URL** generated. It will look like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## 3. Frontend Configuration & Deployment

### 3.1 Edit Config
1. Open the project folder and edit `config.js`.
2. Locate the line setting `API_ENDPOINT`:
   ```javascript
   const config = {
     MOCK_MODE: false, // Set to false to connect to the live backend
     API_ENDPOINT: "https://script.google.com/macros/s/AKfycb.../exec"
   };
   ```
3. Paste your Apps Script Web App URL into `API_ENDPOINT`.

### 3.2 Testing Locally
1. Start a local server (e.g., using VS Code Live Server or python `python -m http.server`).
2. Verify you can add, view, update, and delete entries, generate summaries, and trigger SMS text messages.

### 3.3 Deploying to GitHub Pages
1. Push the files `index.html`, `style.css`, `script.js`, `config.js`, and directories `docs/` and `assets/` to a GitHub repository.
2. On GitHub, go to your repository **Settings** → **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` or `master` branch and the `/ (root)` folder.
5. Click **Save**.
6. After a few minutes, your site will be live at:
   `https://[username].github.io/[repository-name]/`

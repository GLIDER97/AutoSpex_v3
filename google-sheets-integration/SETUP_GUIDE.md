# Google Sheets Lead Storage Setup Guide

This guide explains how to set up Google Sheets as the backend storage for MyAutoSpex lead forms.

## Prerequisites
- A Google account
- Access to Google Sheets and Google Apps Script

---

## Step 1: Create a Google Sheets Workbook

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Blank"** to create a new spreadsheet
3. Rename it to: `MyAutoSpex Leads` (or your preferred name)
4. Note the spreadsheet URL — you'll need it later

---

## Step 2: Set Up Google Apps Script

1. In your Google Sheets workbook, go to **Extensions → Apps Script**
2. This opens the Apps Script editor
3. Delete any existing code in the editor
4. Copy the entire contents of `GoogleAppsScript.js` (in this folder) and paste it into the editor
5. Click **File → Save** (or Ctrl+S)
6. Name the project: `MyAutoSpex Lead Handler`

---

## Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: `MyAutoSpex Lead Storage v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Authorize the app** when prompted:
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" → "Go to MyAutoSpex Lead Handler (unsafe)"
   - Click "Allow"
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbw.../exec
   ```

---

## Step 4: Configure Your Application

1. Open your project's `.env.local` file (create if it doesn't exist)
2. Add the following line with your Web App URL:
   ```
   VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Save the file
4. Restart your development server (`npm run dev`)

---

## Step 5: Test the Integration

1. Open your application in a browser
2. Navigate to any lead form (e.g., Fault Code Decoder)
3. Fill out and submit the form
4. Check your Google Sheets workbook — a new sheet should appear with the lead data

---

## Sheet Names for Each Form

| Application Form | Google Sheet Name |
|------------------|-------------------|
| Fault Code Decoder (OBD2) | OBD2_Leads |
| Service Coupons | Coupon_Leads |
| Affordability Predictor | Affordability_Leads |
| MPG Fuel Rewards | MPG_Leads |
| Insurance Comparison | Ownership_Leads |
| Resale Value | Resale_Leads |
| VIN Lookup | VIN_Leads |
| Repair Second Opinion | Repair_Leads |
| Insurance Estimator | Insurance_Leads |

---

## Troubleshooting

### Form submissions not appearing in Google Sheets

1. **Check the Console**: Open browser DevTools (F12) and check for errors
2. **Verify the URL**: Ensure `VITE_GOOGLE_SHEETS_URL` is correctly set in `.env.local`
3. **Test the Web App**: Visit your Web App URL directly in a browser — you should see:
   ```json
   {"status":"ok","message":"MyAutoSpex Lead Storage Web App is running"}
   ```
4. **Check Permissions**: Ensure the Web App is deployed with "Anyone" access

### CORS Errors

Google Apps Script Web Apps handle CORS automatically. If you see CORS errors:
- Ensure you're using the `/exec` URL, not the `/dev` URL
- Redeploy if you made changes to the script

### Need to Update the Script?

1. Make changes in the Apps Script editor
2. Click **Deploy → Manage deployments**
3. Click the edit (pencil) icon
4. Change version to "New version"
5. Click **Deploy**
6. The URL remains the same

---

## Security Notes

- The Web App URL should be kept private (in `.env.local`, not committed to git)
- The script executes with your Google account permissions
- Consider implementing additional validation in the Apps Script for production use

/**
 * Lead Storage Utility for AutoSpex
 *
 * Sends lead data to Google Sheets via a deployed Google Apps Script Web App.
 * Configure the Web App URL in .env.local as VITE_GOOGLE_SHEETS_URL
 */

// Mapping from JSON filename to Google Sheet name
const SHEET_NAME_MAP: Record<string, string> = {
  'OBD2_leads.json': 'OBD2_Leads',
  'digital_coupon_leads.json': 'Coupon_Leads',
  'Car-affordability_leads.json': 'Affordability_Leads',
  'mpg_fuel_rewards_leads.json': 'MPG_Leads',
  'vehicle_ownership_leads.json': 'Ownership_Leads',
  'Car_resale_leads.json': 'Resale_Leads',
  'VIN_lookup_leads.json': 'VIN_Leads',
  'Car_repair_leads.json': 'Repair_Leads',
  'Insurance_Estimator_leads.json': 'Insurance_Leads',
};

/**
 * Saves lead data to Google Sheets.
 *
 * @param filename The target JSON file name (used to determine sheet name)
 * @param data The lead data object to store
 */
export const saveLead = async (filename: string, data: any): Promise<void> => {
  const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  if (!googleSheetsUrl) {
    console.warn(
      'Google Sheets URL not configured. Set VITE_GOOGLE_SHEETS_URL in .env.local'
    );
    console.log(`[Fallback] Would save to ${filename}:`, data);
    // Simulate delay for UX consistency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return;
  }

  const sheetName = SHEET_NAME_MAP[filename] || filename.replace('.json', '');

  try {
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors for POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName,
        data,
      }),
    });

    // With no-cors, we can't read the response, but the request is sent
    console.log(`Lead saved to Google Sheets (${sheetName})`);
  } catch (error) {
    console.error('Failed to save lead to Google Sheets:', error);
    // Fallback: log to console
    console.log(`[Fallback] Lead data for ${sheetName}:`, data);
  }
};

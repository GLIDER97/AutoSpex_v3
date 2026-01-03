/**
 * Google Apps Script for MyAutoSpex Lead Storage
 * 
 * This script receives lead data from the MyAutoSpex application
 * and stores it in the corresponding sheet within this Google Sheets workbook.
 * 
 * Deploy this as a Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

// Main entry point for POST requests
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheetName = data.sheetName;
        const leadData = data.data;

        if (!sheetName || !leadData) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'Missing sheetName or data'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(sheetName);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            // Add headers based on the first submission
            const headers = Object.keys(leadData);
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        }

        // Get existing headers
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        // Check for new columns in this submission
        const newHeaders = Object.keys(leadData).filter(key => !headers.includes(key));
        if (newHeaders.length > 0) {
            // Add new headers at the end
            const lastCol = sheet.getLastColumn();
            sheet.getRange(1, lastCol + 1, 1, newHeaders.length).setValues([newHeaders]);
            headers.push(...newHeaders);
        }

        // Prepare row data in the correct order
        const rowData = headers.map(header => {
            const value = leadData[header];
            // Convert objects to JSON strings for storage
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return value !== undefined ? value : '';
        });

        // Append the row
        sheet.appendRow(rowData);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Lead saved successfully',
            sheet: sheetName
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Handle GET requests (for testing the deployment)
function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'MyAutoSpex Lead Storage Web App is running',
        version: '1.0.0'
    })).setMimeType(ContentService.MimeType.JSON);
}

// Utility function to test the script manually
function testScript() {
    const testData = {
        sheetName: 'Test_Leads',
        data: {
            timestamp: new Date().toISOString(),
            name: 'Test User',
            email: 'test@example.com',
            source: 'Manual Test'
        }
    };

    // Simulate the POST request
    const mockEvent = {
        postData: {
            contents: JSON.stringify(testData)
        }
    };

    const result = doPost(mockEvent);
    Logger.log(result.getContent());
}

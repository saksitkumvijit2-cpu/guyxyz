# เชื่อมต่อฐานข้อมูลกับ Google Sheets

ทำตามขั้นตอนต่อไปนี้เพื่อเชื่อมต่อแอปพลิเคชันของคุณกับ Google Sheets เป็นฐานข้อมูล

## ขั้นตอนที่ 1: สร้าง Google Sheet

1.  ไปที่ [sheets.google.com](https://sheets.google.com) และสร้าง Spreadsheet ใหม่
2.  ตั้งชื่อ Spreadsheet ของคุณ (เช่น "ระบบจัดการข้อมูล DB")
3.  สร้างชีต (แท็บ) ใหม่ 2 ชีตที่ด้านล่าง:
    *   เปลี่ยนชื่อชีตแรกเป็น `employers`
    *   เปลี่ยนชื่อชีตที่สองเป็น `cases`
    *   **สำคัญ:** ชื่อชีตต้องเป็นตัวพิมพ์เล็กและตรงตามนี้ทุกประการ

## ขั้นตอนที่ 2: สร้างและใส่โค้ด Apps Script

1.  ใน Google Sheet ของคุณ, ไปที่เมนู `ส่วนขยาย (Extensions)` > `Apps Script`
2.  หน้าต่างแก้ไขสคริปต์จะเปิดขึ้นมาในแท็บใหม่ ลบโค้ดทั้งหมดที่มีอยู่ในไฟล์ `Code.gs`
3.  คัดลอกโค้ดทั้งหมดด้านล่างนี้และวางลงในไฟล์ `Code.gs` ที่ว่างเปล่า

```javascript
// Google Apps Script for "ระบบจัดการข้อมูล"

const EMPLOYERS_SHEET_NAME = 'employers';
const CASES_SHEET_NAME = 'cases';

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'getEmployers') {
      const employersSheet = sheet.getSheetByName(EMPLOYERS_SHEET_NAME);
      if (!employersSheet) throw new Error(`Sheet "${EMPLOYERS_SHEET_NAME}" not found.`);
      // Data is stored as a JSON string in cell A1 for simplicity
      const data = employersSheet.getRange("A1").getValue();
      const employers = data ? JSON.parse(data) : [];
      return ContentService.createTextOutput(JSON.stringify(employers)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getCases') {
      const casesSheet = sheet.getSheetByName(CASES_SHEET_NAME);
      if (!casesSheet) throw new Error(`Sheet "${CASES_SHEET_NAME}" not found.`);
      // Data is stored as a JSON string in cell A1
      const data = casesSheet.getRange("A1").getValue();
      const cases = data ? JSON.parse(data) : [];
      return ContentService.createTextOutput(JSON.stringify(cases)).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Invalid action for GET request.");

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload;

    if (action === 'saveEmployers') {
      const employersSheet = sheet.getSheetByName(EMPLOYERS_SHEET_NAME);
      if (!employersSheet) throw new Error(`Sheet "${EMPLOYERS_SHEET_NAME}" not found.`);
      // Save the entire array as a JSON string in cell A1
      employersSheet.getRange("A1").setValue(JSON.stringify(payload, null, 2)); // Using null, 2 for pretty printing in the cell
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Employers saved.' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'saveCases') {
      const casesSheet = sheet.getSheetByName(CASES_SHEET_NAME);
      if (!casesSheet) throw new Error(`Sheet "${CASES_SHEET_NAME}" not found.`);
      // Save the entire array as a JSON string in cell A1
      casesSheet.getRange("A1").setValue(JSON.stringify(payload, null, 2));
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Cases saved.' })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Invalid action for POST request.");

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4.  บันทึกโปรเจกต์สคริปต์โดยคลิกที่ไอคอนรูปแผ่นดิสก์ หรือกด `Ctrl + S`.

## ขั้นตอนที่ 3: Deploy สคริปต์เป็น Web App

1.  ที่ด้านบนขวาของหน้าแก้ไขสคริปต์ คลิกที่ปุ่ม **"ทำให้ใช้งานได้ (Deploy)"** และเลือก **"การทำให้ใช้งานได้รายการใหม่ (New deployment)"**.
2.  คลิกที่ไอคอนรูปเฟือง (⚙️) ข้างๆ "เลือกประเภท" และเลือก **"เว็บแอป (Web app)"**.
3.  ในการตั้งค่า:
    *   **คำอธิบาย (Description):** (ไม่บังคับ) ใส่คำอธิบาย เช่น `API for Worker Management App`.
    *   **เรียกใช้งานเป็น (Execute as):** เลือก **"ฉัน (Me)"**.
    *   **ผู้ที่มีสิทธิ์เข้าถึง (Who has access):** เลือก **"ทุกคน (Anyone)"**.
        *   **หมายเหตุ:** การตั้งค่าเป็น "ทุกคน" หมายความว่าใครก็ตามที่มีลิงก์จะสามารถเข้าถึงข้อมูลในชีตของคุณได้ นี่เป็นวิธีที่ง่ายที่สุด แต่หากข้อมูลของคุณเป็นความลับ ควรพิจารณาเรื่องความปลอดภัยเพิ่มเติม
4.  คลิก **"ทำให้ใช้งานได้ (Deploy)"**.
5.  **ให้สิทธิ์การเข้าถึง (Authorize access):**
    *   Google จะขอให้คุณให้สิทธิ์สคริปต์ในการเข้าถึงชีตของคุณ คลิก **"ให้สิทธิ์เข้าถึง (Authorize access)"**.
    *   เลือกบัญชี Google ของคุณ
    *   คุณอาจเห็นหน้าจอ "Google hasn't verified this app" นี่เป็นเรื่องปกติ คลิกที่ **"ขั้นสูง (Advanced)"** จากนั้นคลิกที่ **"ไปที่ [ชื่อโปรเจกต์ของคุณ] (ไม่ปลอดภัย) (Go to ... (unsafe))"**.
    *   คลิก **"อนุญาต (Allow)"** ในหน้าจอถัดไป

## ขั้นตอนที่ 4: นำ URL ไปใช้งาน

1.  หลังจาก Deploy สำเร็จ คุณจะได้รับ **"URL ของเว็บแอป (Web app URL)"**. **คัดลอก URL นี้**.
2.  กลับมาที่โค้ดของแอปพลิเคชันของคุณ เปิดไฟล์ `services/apiService.ts`.
3.  ค้นหาบรรทัดนี้:
    ```typescript
    const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_GOES_HERE';
    ```
4.  **วาง URL ที่คุณคัดลอกมา** แทนที่ `YOUR_GOOGLE_APPS_SCRIPT_URL_GOES_HERE`
    ตัวอย่าง:
    ```typescript
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
    ```
5.  บันทึกไฟล์.

ตอนนี้แอปพลิเคชันของคุณเชื่อมต่อกับ Google Sheets แล้ว! ข้อมูลจะถูกดึงและบันทึกไปยัง Spreadsheet ที่คุณสร้างขึ้น

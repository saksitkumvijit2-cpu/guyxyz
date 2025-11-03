import { Employer, Case } from '../types';

// ====================================================================================
//  สำคัญ: กรุณานำ Web app URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
//  PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// ====================================================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzjG6NOqpCzYPvVLr3QFAfZN2OJPGr8QQhBiRVBmu6UzJW-LCCPy6Bv0OB_Zvdj6q9i5Q/exec'; 
// ====================================================================================


// --- Fallback Configuration ---
// If the script URL is the placeholder, use localStorage as a fallback database.
const USE_LOCAL_STORAGE_FALLBACK = APPS_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL_GOES_HERE');
const EMPLOYERS_KEY = 'app_employers_data';
const CASES_KEY = 'app_cases_data';
const SIMULATED_DELAY = 500; // ms

// --- LocalStorage Helper Functions ---
const getFromStorage = (key: string) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error reading from localStorage key "${key}":`, e);
        return [];
    }
};

const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving to localStorage key "${key}":`, e);
    }
};

// --- Google Apps Script API Helper ---
const fetchFromScript = async (method: 'GET' | 'POST', action: string, payload?: any) => {
    let url = APPS_SCRIPT_URL;
    let options: RequestInit;

    if (method === 'GET') {
        url += `?action=${action}`;
        options = { method: 'GET', redirect: 'follow' };
    } else { // POST
        options = {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, payload }),
            redirect: 'follow',
        };
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`Script error: ${data.error}`);
        }
        return data;
    } catch (error) {
        console.error(`Failed to fetch from Google Apps Script for action [${action}]:`, error);
        throw error;
    }
};


// --- Employer API ---
export const fetchEmployers = async (): Promise<Employer[]> => {
    if (USE_LOCAL_STORAGE_FALLBACK) {
        console.warn("Using localStorage for employers. Configure APPS_SCRIPT_URL in services/apiService.ts to use Google Sheets.");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        return getFromStorage(EMPLOYERS_KEY);
    }
    return await fetchFromScript('GET', 'getEmployers');
};

export const saveEmployers = async (employers: Employer[]): Promise<void> => {
    if (USE_LOCAL_STORAGE_FALLBACK) {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        saveToStorage(EMPLOYERS_KEY, employers);
        return;
    }
    await fetchFromScript('POST', 'saveEmployers', employers);
};

// --- Case API ---
export const fetchCases = async (): Promise<Case[]> => {
    if (USE_LOCAL_STORAGE_FALLBACK) {
        console.warn("Using localStorage for cases. Configure APPS_SCRIPT_URL in services/apiService.ts to use Google Sheets.");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        return getFromStorage(CASES_KEY);
    }
    return await fetchFromScript('GET', 'getCases');
};

export const saveCases = async (cases: Case[]): Promise<void> => {
     if (USE_LOCAL_STORAGE_FALLBACK) {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        saveToStorage(CASES_KEY, cases);
        return;
    }
    await fetchFromScript('POST', 'saveCases', cases);
};
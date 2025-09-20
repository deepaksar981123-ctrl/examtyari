// services/sheetApi.js
const SHEET_WRITE_URL = 'https://script.google.com/macros/s/AKfycbwwA0PAmRZQxtM_mBS6t3E9pwBzOzOWiFsyTtFC9Hymz5oyw_lMXdn-h1Rth8Fszko/exec';

export async function saveWord(wordData) {
  return await sendToSheet({ action: 'create', ...wordData });
}

export async function updateWord(oldWord, wordData) {
  return await sendToSheet({ action: 'update', oldWord, ...wordData });
}

export async function deleteWord(word) {
  return await sendToSheet({ action: 'delete', word });
}

async function sendToSheet(payload) {
  try {
    const res = await fetch(SHEET_WRITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('Sheet API error:', err);
    throw err;
  }
}

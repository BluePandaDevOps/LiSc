import {
  BUILDER_RESULT_STORE_NAME,
  HTML_PAGE_STORE_NAME,
  BUILDER_STORE_NAME,
  saveKeywordListToDB,
  removeKeywordByEntryFromDB,
  storeHTMLpage,
  removeEntryByUrlDB,
  importDataToStoresDB,
  exportAllStoresDB,
  getAllNormalizedFromDB,
  updateKeywordEntryInDB
} from '../data/database.js'

import {
  isEntryValid
} from '../components/utils.js'

const eventTarget = new EventTarget();



export async function getAllHTMLpages() {
  return await getAllNormalizedFromDB(HTML_PAGE_STORE_NAME);
}

export async function removeRawHTMLByUrl(url) {
  return await removeEntryByUrlDB(HTML_PAGE_STORE_NAME, url);
}

export async function getAllFinalResultEntries() {
  return await getAllNormalizedFromDB(BUILDER_RESULT_STORE_NAME);
}

export async function importDataToStores(jsonData) {
  return await importDataToStoresDB(jsonData);
}

export async function exportAllStores() {
  return await exportAllStoresDB();
}


export async function removeResultByUrl(url) {
  return await removeEntryByUrlDB(BUILDER_RESULT_STORE_NAME, url);
}

export async function saveHTMLpage(pageObject) {
  if (!isValidPageObject(pageObject)) {
    throw new Error('New pageObject to store HTML is not valid!');
  }
  pageObject.url = pageObject.url.includes('?') ? pageObject.url.split('?')[0] : pageObject.url;
  await storeHTMLpage(pageObject);
  eventTarget.dispatchEvent(new CustomEvent('rawHTMLstoreUpdated'));
}
function isValidPageObject(object) {
  return (
    object &&
    typeof object === 'object' &&
    typeof object.url === 'string' &&
    typeof object.HTML === 'string'
  );
}

export async function getKeywordList() {
  return await getAllNormalizedFromDB(BUILDER_STORE_NAME);
}


// New: Add a single keyword to the list
export async function addKeyword(entry) {
  if (!isEntryValid(entry)) {
    throw new Error('New entry for url or pattern not valid!');
  }
  await saveKeywordListToDB(entry);
  eventTarget.dispatchEvent(new CustomEvent('KeywordListUpdated', { detail: entry }));

}

// New: Add a single keyword to the list
export async function updateKeyword(oldEntry, newEntry) {
  if (!isEntryValid(oldEntry)) {
    throw new Error('Old entry for url or pattern not valid!');
  }
  if (!isEntryValid(newEntry)) {
    throw new Error('New entry for url or pattern not valid!');
  }
  await updateKeywordEntryInDB(oldEntry, newEntry);
  eventTarget.dispatchEvent(new CustomEvent('KeywordListUpdated', { detail: newEntry }));
  return true;
}


export async function removeKeywordByEntry(entryToRemove) {
  await removeKeywordByEntryFromDB(entryToRemove)
  eventTarget.dispatchEvent(new CustomEvent('KeywordListUpdated', { detail: entryToRemove }));
}

// New: Remove keyword by index
export function removeKeywordAt(index) {
  if (index >= 0 && index < KeywordList.length) {
    KeywordList.splice(index, 1);
    eventTarget.dispatchEvent(new CustomEvent('KeywordListUpdated', { detail: entry }));
  }
}

export function addListener(eventName, callback) {
  eventTarget.addEventListener(eventName, callback);
}

export function removeListener(eventName, callback) {
  eventTarget.removeEventListener(eventName, callback);
}

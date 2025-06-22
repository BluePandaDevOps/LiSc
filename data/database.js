let db;
let CURRENT_DATABASE_NAME

export const BUILDER_STORE_NAME = 'builder_store'
export const HTML_PAGE_STORE_NAME = 'HTML_page_store'
export const BUILDER_RESULT_STORE_NAME = 'builder_result_store'


export async function initializeDatabase(databaseName, version, stores) {
    CURRENT_DATABASE_NAME = databaseName
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, version);

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("Database opened successfully");
            resolve(db);
        };

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            console.log(`onupgradeneeded: ${JSON.stringify(event)} `);

            if (!db.objectStoreNames.contains(BUILDER_STORE_NAME)) {
                db.createObjectStore(BUILDER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(HTML_PAGE_STORE_NAME)) {
                db.createObjectStore(HTML_PAGE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(BUILDER_RESULT_STORE_NAME)) {
                db.createObjectStore(BUILDER_RESULT_STORE_NAME, { keyPath: 'url' });
            }
            stores.forEach(store => {
                console.log(`Checking new store: ${store.storeName} `);
                if (!db.objectStoreNames.contains(store.storeName)) {
                    const objectStore = db.createObjectStore(store.storeName, {
                        keyPath: store.keyPath,
                        autoIncrement: store.autoIncrement || false,
                    });
                    store.indexes.forEach(index => {
                        objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
                    });
                    console.log(`Object store '${store.storeName}' created: ${JSON.stringify(store)}`);
                }
            });
        };

        request.onerror = function (event) {
            console.error("Database error:", event.target.error);
            reject("Database error: " + event.target.errorCode);
        };
    });
}


export function deleteCurrentDatabase() {
    const databaseName = CURRENT_DATABASE_NAME
    return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(databaseName);

        deleteRequest.onsuccess = () => {
            console.log(`Database "${databaseName}" deleted successfully`);
            resolve();
        };

        deleteRequest.onerror = (event) => {
            console.error(`Failed to delete database "${databaseName}":`, event.target.error);
            reject(event.target.error);
        };

        deleteRequest.onblocked = () => {
            console.warn(`Deletion of database "${databaseName}" is blocked (maybe it's open in another tab)`);
        };
    });
}


function getCurrentDBVersion(databaseName) {
    return new Promise((resolve, reject) => {
        // Open DB without specifying version to get current version
        const request = indexedDB.open(databaseName);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const version = db.version;
            db.close();
            resolve(version);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}


export async function upsertFinalContent(storeName, resultDataRow) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");

        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const timestamp = new Date().toISOString();

        const { url, type, data } = resultDataRow;

        const getRequest = objectStore.get(url);

        getRequest.onsuccess = function (event) {
            const existing = event.target.result;
            let updatedRecord;

            if (existing) {
                // Look for an existing type
                const index = existing.result.findIndex(item => item.type === type);

                if (index !== -1) {
                    // Update existing type's data
                    existing.result[index].data = data;
                } else {
                    // Add new { type, data } pair
                    existing.result.push({ type, data });
                }

                existing.timestamp = timestamp;
                updatedRecord = existing;
            } else {
                // New entry for this URL
                updatedRecord = {
                    url,
                    result: [{ type, data }],
                    timestamp
                };
            }

            const putRequest = objectStore.put(updatedRecord);

            putRequest.onsuccess = () => {
                resolve(putRequest.result);
            };

            putRequest.onerror = () => {
                reject("Error updating or inserting result: " + putRequest.error);
            };
        };

        getRequest.onerror = function () {
            reject("Error reading existing result: " + getRequest.error);
        };
    });
}

export function storeContent(storeName, data) {
    console.log(`storeContent: ${JSON.stringify(data)} in store  ${storeName}`);
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();

        if (!db) {
            return reject("Database not initialized");
        }


        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);

        const record = { ...data, timestamp };

        const request = objectStore.add(record);

        request.onsuccess = function (event) {
            console.log(`Data stored in '${storeName}' successfully:`, event.target.result);
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            console.error("Error storing data:", event.target.error);
            reject("Error storing data: " + event.target.error);
        };

        transaction.oncomplete = function () {
            console.log("Transaction completed.");
        };
    });
}



export function updateContent(storeName, id, updatedData) {
    console.log(`updateContent: ${id} : ${JSON.stringify(updatedData)} in ${storeName}`);
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();

        if (!db) {
            return reject("Database not initialized");
        }

        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);

        const getRequest = objectStore.get(id);

        getRequest.onsuccess = function (event) {
            const existingData = event.target.result;

            if (!existingData) {
                return reject("Record not found for the given ID");
            }


            const updatedRecord = {
                ...existingData,
                ...updatedData,
                id,
                timestamp,
            };

            const putRequest = objectStore.put(updatedRecord);

            putRequest.onsuccess = function (event) {
                console.log(`Record in '${storeName}' updated successfully:`, event.target.result);
                resolve(event.target.result);
            };

            putRequest.onerror = function (event) {
                console.error("Error updating record:", event.target.error);
                reject("Error updating record: " + event.target.error);
            };
        };

        getRequest.onerror = function (event) {
            console.error("Error retrieving record:", event.target.error);
            reject("Error retrieving record: " + event.target.error);
        };

        transaction.oncomplete = function () {
            console.log("Transaction completed.");
        };

        transaction.onerror = function (event) {
            console.error("Transaction error:", event.target.error);
            reject("Transaction error: " + event.target.error);
        };
    });
}





export function checkIfUrlExists(storeName, url) {
    console.log(`checkIfUrlExists url: ${url}, storeName: ${storeName}`);
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("Database not initialized");
        }

        if (!db.objectStoreNames.contains(storeName)) {
            console.error(`Object store ${storeName} not found.`);
            return;
        }

        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);

        // Check if the store is empty by making a request for a count of all records
        const countRequest = store.count();

        countRequest.onsuccess = function () {
            // If the store is empty, resolve with null
            if (countRequest.result === 0) {
                resolve(null);
                return;
            }

            // Store is not empty, proceed to query using the index
            const query = store.index("urlIndex");
            const getRequest = query.get(url);

            getRequest.onsuccess = function () {
                if (getRequest.result) {
                    resolve(getRequest.result.id);
                } else {
                    resolve(null);
                }
            };

            getRequest.onerror = function () {
                reject("Error querying database");
            };
        };

        countRequest.onerror = function () {
            reject("Error checking store count");
        };
    });
}

function normalizeRows(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (result && Object.keys(result).length > 0) {
        return [result];
    }

    return [];
}

// pageObject: url HTML
export function storeHTMLpage(pageObject) {
    if (!db) return Promise.reject('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(HTML_PAGE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(HTML_PAGE_STORE_NAME);

        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.url === pageObject.url) {
                    const updatedEntry = {
                        ...cursor.value,
                        ...pageObject,
                        savedAt: new Date().toISOString()
                    };
                    const updateRequest = cursor.update(updatedEntry);

                    updateRequest.onsuccess = () => {
                        resolve('Duplicate entry found, updated.');
                    };
                    updateRequest.onerror = () => {
                        reject(updateRequest.error);
                    };
                    return;
                };
                cursor.continue();
            } else {
                const newEntry = {
                    ...pageObject,
                    savedAt: new Date().toISOString()
                };
                const addRequest = store.add(newEntry);
                addRequest.onsuccess = () => {
                    resolve('Entry added successfully');
                };
                addRequest.onerror = () => {
                    reject(addRequest.error);
                };
            }
        };

        store.openCursor().onerror = function (event) {
            reject(event.target.error);
        };
    });
}


export function getHTMLpage(url) {
    if (!db) return Promise.reject('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(HTML_PAGE_STORE_NAME, 'readonly');
        const store = tx.objectStore(HTML_PAGE_STORE_NAME);

        const request = store.openCursor();

        request.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.url === url) {
                    resolve(cursor.value); // Return the matched page
                    return;
                }
                cursor.continue();
            } else {
                resolve(null); // No match found
            }
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

export function saveKeywordListToDB(entry) {
    if (!db) return Promise.reject('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUILDER_STORE_NAME, 'readonly');
        const store = tx.objectStore(BUILDER_STORE_NAME);

        // We'll do an index or a cursor search for matching url
        // Assuming you don't have an index on url, we use a cursor

        let duplicateFound = false;

        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.url === entry.url &&
                    cursor.value.type === entry.type &&
                    cursor.value.pattern === entry.pattern) {
                    duplicateFound = true;
                    resolve('Duplicate entry found, not added.');
                    return; // stop iterating
                }
                cursor.continue();
            } else {
                // No duplicate found, now add
                const writeTx = db.transaction(BUILDER_STORE_NAME, 'readwrite');
                const writeStore = writeTx.objectStore(BUILDER_STORE_NAME);
                const addRequest = writeStore.add(entry);

                addRequest.onsuccess = () => {
                    resolve('Entry added successfully');
                };

                addRequest.onerror = () => {
                    reject(addRequest.error);
                };
            }
        };

        store.openCursor().onerror = function (event) {
            reject(event.target.error);
        };
    });
}



export async function removeKeywordByEntryFromDB(entryToRemove) {
    if (!db) throw new Error('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUILDER_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BUILDER_STORE_NAME);

        const request = store.openCursor();

        request.onerror = () => reject(request.error);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const value = cursor.value;
                if (
                    value.url === entryToRemove.url &&
                    value.type === entryToRemove.type &&
                    value.pattern === entryToRemove.pattern
                ) {
                    cursor.delete(); // delete this record
                    resolve(true);   // Deleted one entry
                    return;          // Stop cursor
                }
                cursor.continue();
            } else {
                // No matching entry found
                resolve(false);
            }
        };
    });
}

export async function updateKeywordEntryInDB(oldEntry, newEntry) {
    if (!db) throw new Error('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(BUILDER_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BUILDER_STORE_NAME);

        const request = store.openCursor();

        request.onerror = () => reject(request.error);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const value = cursor.value;
                // Find the record matching oldEntry exactly
                if (
                    value.url === oldEntry.url &&
                    value.type === oldEntry.type &&
                    value.pattern === oldEntry.pattern
                ) {
                    const updatedValue = {
                        ...value,
                        ...newEntry,
                    };

                    cursor.update(updatedValue);
                    resolve(true);  // Updated successfully
                    return;         // Stop cursor
                }
                cursor.continue();
            } else {
                // No matching entry found
                resolve(false);
            }
        };
    });
}


export async function removeEntryByUrlDB(storeName, url) {
    if (!db) throw new Error('DB is not initialized');

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        const request = store.openCursor();

        request.onerror = () => reject(request.error);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const value = cursor.value;
                if (value.url === url) {
                    cursor.delete(); // delete this record
                    resolve(true);   // Deleted one entry
                    return;          // Stop cursor
                }
                cursor.continue();
            } else {
                // No matching entry found
                resolve(false);
            }
        };
    });
}


export async function importDataToStoresDB(data) {
    if (!db) throw new Error('DB is not initialized');
    return new Promise((resolve, reject) => {
        const tx = db.transaction(db.objectStoreNames, 'readwrite');

        for (const storeName of db.objectStoreNames) {
            const store = tx.objectStore(storeName);
            const items = data[storeName];
            if (!Array.isArray(items)) continue;

            items.forEach(item => store.put(item));
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}


export async function exportAllStoresDB() {
    if (!db) throw new Error('DB is not initialized');
    const exportData = {};

    const tx = db.transaction(db.objectStoreNames, 'readonly');

    // Wrap each store read in a Promise so we can await them all
    const promises = [...db.objectStoreNames].map(storeName => {
        return new Promise((resolve, reject) => {
            const store = tx.objectStore(storeName);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                exportData[storeName] = getAllRequest.result;
                resolve();
            };
            getAllRequest.onerror = () => reject(getAllRequest.error);
        });
    });

    try {
        await Promise.all(promises);

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'indexeddb-export.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log('Export completed:', exportData);
    } catch (error) {
        console.error('Export failed:', error);
    }
}

export function getAllNormalizedFromDB(storeName) {
    if (!db) return Promise.reject('Database not initialized');

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        const request = store.getAll();

        request.onsuccess = function (event) {
            const results = event.target.result || [];
            resolve(normalizeRows(results));
        };

        request.onerror = function (event) {
            reject("Error retrieving data: " + event.target.error);
        };
    });
}
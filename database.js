let db;

export async function initializeDatabase(databaseName, version, stores) {

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, version);

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("Database opened successfully");
            resolve(db);
        };

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store.storeName)) {
                    const objectStore = db.createObjectStore(store.storeName, {
                        keyPath: store.keyPath,
                        autoIncrement: store.autoIncrement || false,
                    });
                    store.indexes.forEach(index => {
                        objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
                    });
                    console.log(`Object store '${store.storeName}' created`);
                }
            });
        };

        request.onerror = function (event) {
            reject("Database error: " + event.target.errorCode);
        };
    });
}


export function storeContent(storeName, data) {
    console.log(`storeContent: ${JSON.stringify(data)}`);
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();

        if (!db) {
            return reject("Database not initialized");
        }

        console.log(`storeName: ${storeName}`)
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
    console.log(`updateContent: ${id} : ${JSON.stringify(updatedData)}`);
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



export function getAllContent(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("Database not initialized");
        }

        const transaction = db.transaction([storeName], "readonly");
        const objectStore = transaction.objectStore(storeName);

        const request = objectStore.getAll();

        request.onsuccess = function (event) {
            const allContent = event.target.result;
            console.log(`All data from '${storeName}':`, allContent);
            resolve(allContent);
        };

        request.onerror = function (event) {
            console.error("Error retrieving data:", event.target.error);
            reject("Error retrieving data: " + event.target.error);
        };
    });
}


export function checkIfUrlExists(storeName, url) {
    console.log(`checkIfUrlExists url: ${url}`);
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("Database not initialized");
        }

        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);

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
    });
}
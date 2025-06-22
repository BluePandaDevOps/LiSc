
import { pivotRowsByUrl } from './finalResult.js';
import {
    importDataToStores,
    getAllFinalResultEntries,
    exportAllStores
} from '../data/builder_parser_store.js'


document.getElementById('exportAllStoresBtn').addEventListener('click', async () => {
    exportAllStores()
});


document.getElementById('exportResultsFromDatabaseBtn').addEventListener('click', async () => {
    document.dispatchEvent(new CustomEvent('downloadCSVResultTableFromDatabase'));
});

document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        if (typeof jsonData !== 'object' || jsonData === null) {
            throw new Error('Invalid file format');
        }

        await importDataToStores(jsonData);
        alert('Import completed successfully!');
    } catch (err) {
        console.error('Import error:', err);
        alert('Failed to import data: ' + err.message);
    }
});



document.addEventListener('downloadCSVResultTableFromDatabase', async () => {
    const data = await getAllFinalResultEntries()
    const { data: tableData, columns: tableColumns } = pivotRowsByUrl(data)
    download_data(tableData, `${getFormattedTimestamp()}_finalResults.csv`)
});

function getFormattedTimestamp() {
    const now = new Date();

    const pad = (n) => n.toString().padStart(2, '0');

    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1); // Months are 0-based
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}


/*
export function download_data(content, fileName = "exported_data.csv") {
    if (content && content.length > 0) {
        const headers = Object.keys(content[0]);
        const csvContent = [
            headers,
            ...content.map(entry => headers.map(header => entry[header] || ""))
        ]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        browser.downloads.download({
            url: url,
            filename: fileName,
            saveAs: true
        });
    }
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getAllData") {
        console.log("Message received:", message.action);
        getAllNormalizedFromDB(config.indexedDB.stores[0].storeName)
            .then(content => {
                download_data(content);
                sendResponse({ success: true, content: content });
            })
            .catch(err => {
                sendResponse({ success: false, message: err });
            });
    }
});

*/
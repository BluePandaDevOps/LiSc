import { 
    initializeDatabase,
    storeContent,
    getAllNormalizedFromDB,
    checkIfUrlExists,
    updateContent } from '../data/database.js';
import { parseHTML } from '../logic/html_parser.js';
import { loadConfig, IN_BUILD_PARSER_MODE  } from '../config/config.js';
import { saveHTMLpage} from '../data/builder_parser_store.js'

let config = null;




async function initialize() {
    try {
        config = await loadConfig();

        if (!config || !config.indexedDB) {
            throw new Error("Invalid configuration: 'indexedDB' settings are missing.");
        }

        const { databaseName, version, stores } = config.indexedDB;

        if (!databaseName || !stores || stores.length === 0) {
            throw new Error("Invalid configuration: Database name or stores are not properly defined in the config.");
        }

        await initializeDatabase(databaseName, version, stores);
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
}

await initialize();
  

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


export function download_data(content, fileName="exported_data.csv") {
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
            filename:  fileName,
            saveAs: true
        });
    }
}

async function send_to_storing(response) {
    try {
        const storedID = await checkIfUrlExists(config.indexedDB.stores[0].storeName, response.url);
        if (storedID) {
            await updateContent(config.indexedDB.stores[0].storeName, storedID, response);
            console.log(`Updated page: ${response.url}`);
        } else {
            await storeContent(config.indexedDB.stores[0].storeName, response);
            console.log(`Stored page: ${response.url}`);
        }
    } catch (error) {
        console.error("Error storing content:", error);
    }
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab.url) {
            console.log('Page is fully loaded:', tab.url);
            const currentTab = await browser.tabs.get(tabId);
            if (!currentTab) return;
            if(evaluateBuilderMode(tabId)) return;
            if (await checkSiteAndUpdateIcon(tab)) {
                evaluateSite(tabId, tab);
            }
        }
    } catch (error) {
        console.error("Tab might have been closed or other error:", error);
    }
});

browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        
        if (tab.url) {
            console.log('Switching Tab:', tab.url);
            const currentTab = await browser.tabs.get(activeInfo.tabId);
            if (!currentTab) return;
            if (evaluateBuilderMode(activeInfo.tabId)) return;
            if (await checkSiteAndUpdateIcon(tab)) {
                evaluateSite(activeInfo.tabId, tab);
            }
        }
    } catch (error) {
        console.error("Tab might have been closed or other error:", error);
    }
});

function evaluateBuilderMode(tabId){
    if(IN_BUILD_PARSER_MODE.flag){
        setIcon('building');
        let refreshCount = 0;
        const maxRefreshes = 3;
        let checkInterval = setInterval(() => {
            browser.tabs.sendMessage(tabId, { action: "parseHTML" })
                .then(response => {
                    if (response && response.result === 'successful' && response.htmlContent) {
                        const result = saveHTMLpage({url: response.url, HTML: response.htmlContent}); 
                        //const result = parseHTMLforKeyword(response.htmlContent);
                        clearInterval(checkInterval);
                    }else{
                        refreshCount++;
                        if (refreshCount >= maxRefreshes) {
                            clearInterval(checkInterval);
                        }
                    }
                })
                .catch(err => {
                    console.error("Error sending message to content script:", err);
                });
        }, 1000);
        return true
    }
    return false

}

function evaluateSite(tabId, tab) {
    setIcon('pending');
    let refreshCount = 0;
    const maxRefreshes = 3;
    let checkInterval = setInterval(() => {
        browser.tabs.sendMessage(tabId, { action: "parseHTML" })
            .then(response => {
                if (response && response.result === 'successful' && response.htmlContent) {
                    const parsedFields = parseHTML(response.htmlContent);
                    if (parsedFields) {
                        const { profileName, position, company, aboutText, experienceLatest, location } = parsedFields;
                        const url = extractBaseUrl(response.url);
                        send_to_storing({ url, profileName, position, company, aboutText, experienceLatest, location });
                        clearInterval(checkInterval);
                        setIcon('success');
                    }else{
                        refreshCount++;
                        if (refreshCount >= maxRefreshes) {
                            clearInterval(checkInterval);
                        }
                    }
                }
            })
            .catch(err => {
                console.error("Error sending message to content script:", err);
            });
    }, 1000);
}

browser.browserAction.onClicked.addListener(() => {
    setIcon('pending');
    if(IN_BUILD_PARSER_MODE.flag){
        setIcon('building');
        return
    }
    setTimeout(() => {
        const success = true;

        if (success) {
            setIcon('success');
        } else {
            setIcon('error');
        }
    }, 3000);
});

browser.runtime.onInstalled.addListener(() => {
    setIcon('default');

    browser.notifications.create({
        type: "basic",
        iconUrl: "icons/favicon-192x192.png",
        title: "HTML Parser Installed",
        message: "Your extension is ready! Click the icon in the toolbar to use it."
    });
});

async function checkSiteAndUpdateIcon(tab) {
    if (!tab || typeof tab.url !== 'string') {
        console.error("Invalid tab object or missing URL.");
        return false;
    }

    if (!config) {
        try {
            config = await loadConfig();
        } catch (error) {
            console.error("Error loading configuration:", error);
            return false;
        }
    }

    try {
        const url = new URL(tab.url);

        if (!url.protocol.startsWith("http")) {
            console.warn("Non-HTTP/HTTPS protocol detected. Ignoring.");
            setIcon('default');
            return false;
        }

        if (config.allowedSites.some(site => url.hostname.toLowerCase().includes(site.toLowerCase()))) {
            setIcon('pending');
            return true;
        } else {
            setIcon('default');
            return false;
        }
    } catch (error) {
        console.error("Error parsing URL or performing validation:", error);
        setIcon('default');
        return false;
    }
}

export function setIcon(state) {
    const iconMap = {
        'pending': {
            16: "icons/favicon-yellow-16x16.png",
            32: "icons/favicon-yellow-32x32.png"
        },
        'building': {
            16: "icons/favicon-purple-512x512.png",
            32: "icons/favicon-purple-512x512.png"
        },
        'success': {
            16: "icons/favicon-green-16x16.png",
            32: "icons/favicon-green-32x32.png"
        },
        'error': {
            16: "icons/favicon-red-16x16.png",
            32: "icons/favicon-red-32x32.png"
        },
        'default': {
            16: "icons/favicon-blue-16x16.png",
            32: "icons/favicon-blue-32x32.png"
        }
    };
    const iconPath = iconMap[state] || iconMap['default'];
    browser.browserAction.setIcon({ path: iconPath });
}

function extractBaseUrl(fullUrl) {
    try {
        const urlObj = new URL(fullUrl);
        return urlObj.origin + urlObj.pathname;
    } catch (error) {
        console.error("Invalid URL:", fullUrl);
        return null;
    }
}

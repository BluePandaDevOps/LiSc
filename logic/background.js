import {
    initializeDatabase,
    storeContent,
    checkIfUrlExists,
    updateContent
} from '../data/database.js';
import { loadConfig, IN_BUILD_PARSER_MODE } from '../config/config.js';
import { saveHTMLpage } from '../data/builder_parser_store.js'

let config = null;

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: browser.runtime.getURL('lisc.html') });
});


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
            if (await checkSiteAndUpdateIcon(tab)) {
                evaluateBuilderMode(tabId)
                //evaluateSite(tabId, tab);
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
            if (await checkSiteAndUpdateIcon(tab)) {
                evaluateBuilderMode(activeInfo.tabId)
                //evaluateSite(activeInfo.tabId, tab);
            }
        }
    } catch (error) {
        console.error("Tab might have been closed or other error:", error);
    }
});

async function evaluateBuilderMode(tabId) {
    if (!IN_BUILD_PARSER_MODE.flag) return false;

    setIcon('building');
    const maxAttempts = 3;
    let attempt = 0;

    async function tryParse() {
        try {
            const response = await browser.tabs.sendMessage(tabId, { action: "parseHTML" });

            if (response && response.result === 'successful' && response.htmlContent) {
                await saveHTMLpage({ url: response.url, HTML: response.htmlContent });
                console.log(`Page parsed and saved: ${response.url}`);
                return true;
            } else {
                console.log(`Attempt ${attempt + 1} at Tab ${tabId} failed, retrying...`);
                return false;
            }
        } catch (err) {
            console.error("Error sending message to content script:", err);
            return false;
        }
    }

    // Retry loop with delay
    while (attempt < maxAttempts) {
        const success = await tryParse();
        if (success) return true;

        attempt++;
        if (attempt < maxAttempts) {
            await new Promise(res => setTimeout(res, 1000)); // Wait 1 second
        }
    }

    console.warn("Max retries reached. Parsing failed.");
    return false;
}

browser.browserAction.onClicked.addListener(() => {
    setIcon('pending');
    if (IN_BUILD_PARSER_MODE.flag) {
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
            console.log("Non-HTTP/HTTPS protocol detected. Ignoring.");
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

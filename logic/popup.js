document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("store").addEventListener("click", () => {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const activeTab = tabs[0];

            browser.tabs.sendMessage(activeTab.id, { action: "parseHTML" }).then(response => {
                if (response?.stored) {
                    document.getElementById("feedback").innerText =
                        `Page stored successfully. Total entries: ${response.totalEntries}`;
                } else {
                    document.getElementById("feedback").innerText = "Failed to store the page.";
                }
            });
        });
    });

    document.getElementById("export").addEventListener("click", () => {
        browser.runtime.sendMessage({ action: "getAllData" }).then(response => {
            if (response.success) {
                document.getElementById("feedback").innerText = "Data exported as CSV.";
            } else {
                document.getElementById("feedback").innerText = "Failed to retrieve data.";
            }
        });
    });

    const button = document.getElementById('open-builder');
    button.addEventListener('click', () => {
        window.open('builder.html', '_blank');
    });

});


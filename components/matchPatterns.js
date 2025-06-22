import { isValidPattern } from './utils.js'
import {
    removeKeywordByEntry,
    getKeywordList,
    addKeyword,
    updateKeyword
} from '../data/builder_parser_store.js';
import {
    addSortingFunctionality,
    addSearchFunctionality
} from './utils_frontend.js';
import { activateTab } from './builder_parser_website.js';

const addKeywordBtn = document.getElementById('addKeywordBtn');
const closeBtn = document.getElementById('closePanelBtn');
const sidePanel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const panelForm = document.getElementById('panelForm');


const searchInput = document.getElementById("tablePatternsSearch");
const searchButton = document.getElementById("searchPatternsBtn");
const clearButton = document.getElementById("clearPatternsBtn");

const table = document.getElementById("patternsTable");
addSortingFunctionality(table, true)
addSearchFunctionality(table,
    {
        searchInput: searchInput,
        searchButton: searchButton,
        clearButton: clearButton
    }
)

document.getElementById("nextPathOptions").addEventListener('click', async () => {
    activateTab('pathOptions');
});

document.getElementById("refreshPatterns").addEventListener('click', async () => {
    document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
});



document.addEventListener('KeywordListUpdated', async () => {
    const tableBody = document.querySelector('#patternsTable tbody');
    if (!tableBody) return console.error('Table body element not found!');

    tableBody.innerHTML = ''; // Clear everything

    try {
        const entries = await getKeywordList();
        if (Array.isArray(entries) && entries.length > 0) {
            entries.forEach((entry, index) => {
                const row = createKeywordsRow(entry, index);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load keyword entries:', error);
    }
});

panelForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const url = document.getElementById('newUrlInput').value;
    const type = document.getElementById('newTypeInput').value;
    const pattern = document.getElementById('newPatternInput').value;

    if (url === '') {
        showError('url cannot be empty.');
        return;
    }
    if (pattern === '') {
        showError('Pattern cannot be empty.');
        return;
    }
    if (type === '') {
        showError('Type cannot be empty.');
        return;
    }
    if (!isValidPattern(pattern)) {
        showError('Pattern is not a valid regular expression.');
        return;
    }

    clearError();

    const newEntry = { url, type, pattern };

    if (sidePanel.dataset.oldEntry) {
        const oldEntry = JSON.parse(sidePanel.dataset.oldEntry);

        updateKeyword(oldEntry, newEntry)
            .then(updated => {
                if (updated) {
                    document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
                    closePanel();
                } else {
                    showError('Update failed: original entry not found.');
                }
            })
            .catch(error => {
                console.error('Failed to update keyword:', error);
                showError('Update failed due to an error.');
            });
    } else {
        addKeyword(newEntry)
            .then(() => {
                document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
                closePanel();
            })
            .catch(error => {
                console.error('Failed to add keyword:', error);
                showError('Add failed due to an error.');
            });
    }
});


function openPanel(entry = null) {
    sidePanel.classList.add('active');
    overlay.classList.add('active');
    sidePanel.setAttribute('aria-hidden', 'false');

    if (entry) {
        // Prefill inputs
        document.getElementById('newUrlInput').value = entry.url;
        document.getElementById('newTypeInput').value = entry.type;
        document.getElementById('newPatternInput').value = entry.pattern;

        // Store old entry as JSON string to dataset (or a global variable)
        sidePanel.dataset.oldEntry = JSON.stringify(entry);
    } else {
        // Clear inputs
        document.getElementById('newUrlInput').value = '';
        document.getElementById('newTypeInput').value = '';
        document.getElementById('newPatternInput').value = '';

        delete sidePanel.dataset.oldEntry;
    }
}

function closePanel() {
    sidePanel.classList.remove('active');
    overlay.classList.remove('active');
    sidePanel.setAttribute('aria-hidden', 'true');
}




addKeywordBtn.addEventListener('click', openPanel);
closeBtn.addEventListener('click', closePanel);
overlay.addEventListener('click', closePanel);

// Optional: close panel on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && sidePanel.classList.contains('active')) {
        closePanel();
    }
});

addKeywordBtn.addEventListener('click', () => {
    // Clear input fields
    delete sidePanel.dataset.editingIndex;

    openPanel();
});

function showError(msg) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = msg;
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '';
}


function createKeywordsRow(entry = { url: '', type: '', pattern: '' }, index) {
    const tr = document.createElement('tr');
    const urlTd = document.createElement('td');
    urlTd.textContent = entry.url;
    tr.appendChild(urlTd)

    const typeTd = document.createElement('td');
    typeTd.textContent = entry.type;
    tr.appendChild(typeTd)

    const patternTd = document.createElement('td');
    patternTd.textContent = entry.pattern;
    tr.appendChild(patternTd)

    // Delete button
    const tdActions = document.createElement('td');
    tdActions.classList.add('actions-col');
    const updateBtn = document.createElement('button');
    updateBtn.type = 'button';
    updateBtn.textContent = 'Update';
    updateBtn.addEventListener('click', () => {
        // Store the row index or some identifier if needed (optional)
        sidePanel.dataset.editingIndex = index;

        openPanel({ url: urlTd.textContent, type: typeTd.textContent, pattern: patternTd.textContent});
    });
    tdActions.appendChild(updateBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        deleteBtn.disabled = true;
        removeKeywordByEntry(entry)
            .then(() => {
                // Once removal is done, re-render the table
                document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
            })
            .catch(error => {
                console.error('Failed to remove keyword:', error);
                // Optionally show user an error message here
            })
    });
    tdActions.appendChild(deleteBtn);
    tr.appendChild(tdActions);

    return tr;
}









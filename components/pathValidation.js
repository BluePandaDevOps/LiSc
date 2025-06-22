import {
    BUILDER_RESULT_STORE_NAME,
    upsertFinalContent
} from '../data/database.js';
import {
    getAllHTMLpages
} from '../data/builder_parser_store.js';
import {
    getElementByPathFromHTML,
    debugSelectorPath
} from '../logic/builder_parser_logic.js';
import { getAllSelectedPathsDataFromPathSelection } from './pathSelection.js'
import { createTextCell } from './utils.js'
import {
    addSortingFunctionality,
    addSearchFunctionality
} from './utils_frontend.js';
import { activateTab } from './builder_parser_website.js';

document.getElementById("nextResults").addEventListener('click', async () => {
    activateTab('endResults');
});

const searchInputS = document.getElementById("tablePathValidationSSearch");
const searchButtonS = document.getElementById("searchPathValidationSBtn");
const clearButtonS = document.getElementById("clearPathValidationSBtn");

const tableSuccess = document.getElementById("validatePathsTableSuccess");
addSortingFunctionality(tableSuccess, true)
addSearchFunctionality(tableSuccess,
    {
        searchInput: searchInputS,
        searchButton: searchButtonS,
        clearButton: clearButtonS
    }
)

const searchInputF = document.getElementById("tablePathValidationFSearch");
const searchButtonF = document.getElementById("searchPathValidationFBtn");
const clearButtonF = document.getElementById("clearPathValidationFBtn");


const tableFailure= document.getElementById("validatePathsTableFailure");
addSortingFunctionality(tableFailure, true)
addSearchFunctionality(tableFailure,
    {
        searchInput: searchInputF,
        searchButton: searchButtonF,
        clearButton: clearButtonF
    }
)

document.getElementById('validatePathsBtn').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('validatePathsTable'));
});



document.addEventListener('validatePathsTable', async () => {
    const tableBodySuccess = document.querySelector('#validatePathsTableSuccess tbody');
    if (!tableBodySuccess) return console.error('Table validatePathsTableSuccess element not found!');
    const tableBodyFailure = document.querySelector('#validatePathsTableFailure tbody');
    if (!tableBodyFailure) return console.error('Table validatePathsTableFailure element not found!');

    tableBodySuccess.innerHTML = ''; // Clear everything
    tableBodyFailure.innerHTML = ''; // Clear everything

    try {
        const htmls = await getAllHTMLpages()
        const pathSelectionObjects = await getAllSelectedPathsDataFromPathSelection()
        if (Array.isArray(htmls) && htmls.length > 0) {
            htmls.forEach((html, index) => {
                pathSelectionObjects.forEach((path, index) => {
                    const result = getElementByPathFromHTML(html.HTML, path.path, path.textContextIsChecked);
                    if (result) {
                        console.log(JSON.stringify(result, null, 2))
                        const newData = applyPostSelectionParsing(path.postSelection, result.textContent)
                        const rowSucess = createValidatedPathRow({ url: html.url, type: path.type, value: newData })
                        rowSucess.appendChild(addSuccessActions(rowSucess))
                        tableBodySuccess.appendChild(rowSucess);
                    } else {
                        const result = debugSelectorPath(html.HTML, path.path)
                        const rowFailure = createValidatedPathRow({ url: html.url, type: path.type, value: JSON.stringify(result, null, 2) })
                        tableBodyFailure.appendChild(rowFailure);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Failed to load keyword entries:', error);
    }
});


document.getElementById('checkAllSuccessBoxes').addEventListener('change', function () {
    const checked = this.checked;
    const checkboxes = document.querySelectorAll('#validatePathsTableSuccess tbody input.row-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
});

function addSuccessActions(row) {
    if (!row) {
        console.error('Row element is required');
        return;
    }

    const td = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'row-checkbox';
    td.appendChild(checkbox);

    return td
}

function applyPostSelectionParsing(selectionObject, dataString) {
    if (!selectionObject || typeof dataString !== 'string') {
        return dataString;
    }

    switch (selectionObject.mode) {
        case 'regex':
            try {
                // Extract pattern and flags from regexPattern string, e.g. "g//" or "/pattern/g"
                // We'll assume user inputs regex as "/pattern/flags" or just "pattern"
                let patternStr = selectionObject.regexPattern.trim();

                // Remove starting and ending slashes if present
                let match = patternStr.match(/^\/(.*)\/([a-z]*)$/i);
                let pattern, flags;
                if (match) {
                    pattern = match[1];
                    flags = match[2];
                } else {
                    pattern = patternStr;
                    flags = '';
                }

                const regex = new RegExp(pattern, flags);

                // Apply regex on dataString and return the matched string(s)
                const matches = dataString.match(regex);

                // Return the first match or the whole match array (choose what fits best)
                if (matches) {
                    // If global flag used, return array, else first match
                    return flags.includes('g') ? matches : matches[0];
                } else {
                    return ''; // no match found
                }
            } catch (e) {
                console.error('Invalid regex:', e);
                return '';
            }

        case 'split':
            const delimiter = selectionObject.delimiter || '';
            const pos = parseInt(selectionObject.position, 10);

            if (!delimiter || isNaN(pos) || pos < 0) {
                return dataString; // invalid input, return original
            }

            const parts = dataString.split(delimiter);
            return parts[pos] !== undefined ? parts[pos] : '';

        case 'none':
        default:
            return dataString;
    }
}

document.getElementById('moveSelectedSuccessBtn').addEventListener('click', async () => {
    const checkedBoxes = document.querySelectorAll('#validatePathsTableSuccess tbody input.row-checkbox:checked');
    const selectedRows = [];

    // Get headers from the table (assuming they are in <thead><tr><th>...</th></tr></thead>)
    const headers = Array.from(document.querySelectorAll('#validatePathsTableSuccess thead th'))
        .slice(0, -1) // exclude last header (checkbox column)
        .map(th => th.textContent.trim());

    checkedBoxes.forEach(async (checkbox) => {
        const row = checkbox.closest('tr');
        const cells = Array.from(row.querySelectorAll('td')).slice(0, -1); // exclude last td (checkbox)

        // Build an object mapping header -> cell text
        //do not change header if upsert should still work
        const rowData = {};
        headers.forEach((header, i) => {
            rowData[header.toLowerCase()] = cells[i]?.textContent.trim() || '';
        });
        const dbResult = await upsertFinalContent(BUILDER_RESULT_STORE_NAME, rowData)
    });

    document.dispatchEvent(new CustomEvent('buildResultTableFromDatabase'));
});


function createValidatedPathRow(entry = { url: '', type: '', value: '', }, index) {
    if (!entry) return null
    const tr = document.createElement('tr');
    tr.appendChild(createTextCell(entry.url));
    tr.appendChild(createTextCell(entry.type));
    tr.appendChild(createTextCell(entry.value));

    return tr;
}
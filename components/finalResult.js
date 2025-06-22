
import {
    removeResultByUrl,
    getAllFinalResultEntries
} from '../data/builder_parser_store.js';

import {
    addSortingFunctionality,
    addSearchFunctionality
} from './utils_frontend.js';


const searchInput = document.getElementById("tableResultsSearch");
const searchButton = document.getElementById("searchResultsBtn");
const clearButton = document.getElementById("clearResultsSBtn");

const tableSuccess = document.getElementById("finalResultsTable");
addSortingFunctionality(tableSuccess, true)
addSearchFunctionality(tableSuccess,
    {
        searchInput: searchInput,
        searchButton: searchButton,
        clearButton: clearButton
    }
)


document.addEventListener('buildResultTableFromDatabase', async () => {
    const container = document.querySelector('#finalResultsTable tbody');
    if (!container) return;

    const data = await getAllFinalResultEntries()
    const { data: tableData, columns: tableColumns } = pivotRowsByUrl(data)

    // Clear previous table
    container.innerHTML = '';

    const table = document.createElement('table');

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    tableColumns.forEach(col => {
        const th = document.createElement('th');
        th.setAttribute('data-key', col);
        th.textContent = col;
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = 'Actions';
    thActions.classList.add('actions-col');
    headerRow.appendChild(thActions);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create data rows
    const tbody = document.createElement('tbody');
    tableData.forEach(rowData => {
        const row = document.createElement('tr');
        tableColumns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = rowData[col] || '';
            row.appendChild(td);
        });

        const tdActions = document.createElement('td');
        tdActions.classList.add('actions-col');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            deleteBtn.disabled = true;
            removeResultByUrl(rowData['url'])
                .then(() => {
                    // Once removal is done, re-render the table
                    document.dispatchEvent(new CustomEvent('buildResultTableFromDatabase'));
                })
                .catch(error => {
                    console.error('Failed to remove keyword:', error);
                    // Optionally show user an error message here
                })
        });
        tdActions.appendChild(deleteBtn);
        row.appendChild(tdActions);

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table);
});




export function pivotRowsByUrl(entries) {
    // 1. Collect all unique types
    const allTypes = new Set();
    entries.forEach(entry => {
        entry.result.forEach(item => {
            allTypes.add(item.type);
        });
    });

    const typeList = Array.from(allTypes);

    // 2. Create a row per URL, with columns for each type
    const result = entries.map(entry => {
        const row = { url: entry.url };

        // Initialize columns with empty string
        typeList.forEach(type => {
            row[type] = '';
        });

        // Fill in available type-data pairs
        entry.result.forEach(item => {
            row[item.type] = item.data;
        });

        return row;
    });

    return { data: result, columns: ['url', ...typeList] };
}

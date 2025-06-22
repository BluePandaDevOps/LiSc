
import {
    parseHTMLsforKeywords,
    calculateSuccessPerPath,
} from '../logic/builder_parser_logic.js';
import { 
    setLoading,
    addSortingFunctionality,
    addSearchFunctionality
 } from './utils_frontend.js';
 import { activateTab } from './builder_parser_website.js';

 console.log("loaded: pathOptions.js");
 document.getElementById("nextpathSelection").addEventListener('click', async () => {
    activateTab('pathSelection');
});

document.getElementById('createSelectedPathsBtn').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('updateSelectedPathsTable'));
    activateTab('pathSelection');
});

const fetchBtn = document.getElementById('fetch-content')
fetchBtn.addEventListener('click', async () => {
    setLoading(fetchBtn, true);

    const waitForDone = new Promise(resolve => {
        document.dispatchEvent(new CustomEvent('fetchAndMatch', {
            detail: { done: resolve }
        }));
    });

    try {
        await waitForDone;
    } catch (err) {
        console.error('fetchAndMatch error:', err);
    } finally {
        setLoading(fetchBtn, false);
    }
});

document.addEventListener('fetchAndMatch', async (event) => {
    const done = event.detail?.done;
    try {

        const tableBody = document.querySelector('#fetchMatchTable tbody');
        if (!tableBody) return console.error('Table body element not found!');


        const searchInput = document.getElementById("tableFatchAndMatchSearch");
        const searchButton = document.getElementById("searchFatchAndMatchBtn");
        const clearButton = document.getElementById("clearFatchAndMatchBtn");
        const table = document.getElementById("fetchMatchTable");


        if (!table) {
            console.error("Table element not found!");
            if (done) done();
            return;
        }
       
        addSortingFunctionality(table, true)
        addSearchFunctionality(table,
            {
                searchInput:searchInput,
                searchButton: searchButton,
                clearButton: clearButton
            }
        )

        const entries = await parseHTMLsforKeywords();
        tableBody.innerHTML = ''; // Clear existing rows

        if (Array.isArray(entries) && entries.length > 0) {
            for (const entry of entries) {
                const rows = await createFetchAndMatchRows(entry);
                rows.forEach(row => tableBody.appendChild(row));
            }
        }

        
        
    } finally {
        if (done) done();
    }
});


export function getSelectedPathsAndTypesfromFetchMatch() {
    // Select all checked checkboxes within your table (adjust selector as needed)
    const checkedBoxes = document.querySelectorAll('#fetchMatchTable tbody input[type="checkbox"]:checked');

    // Map checked checkboxes to objects with type and path
    const selected = Array.from(checkedBoxes).map(checkbox => ({
        type: checkbox.dataset.type,
        path: checkbox.dataset.path
    }));

    return selected;
}

async function createFetchAndMatchRows(entry = { url: '', type: '', pattern: '', pathsAndContext: [] }, index) {
    const rows = [];

    const numRows = Math.max(entry.pathsAndContext.length, 1);

    for (let i = 0; i < numRows; i++) {
        const tr = document.createElement('tr');

        if (i === 0) {
            const urlTd = document.createElement('td');
            urlTd.textContent = entry.url;
            urlTd.rowSpan = numRows;
            tr.appendChild(urlTd);

            const typeTd = document.createElement('td');
            typeTd.textContent = entry.type;
            typeTd.rowSpan = numRows;
            tr.appendChild(typeTd);

            const patternTd = document.createElement('td');
            patternTd.textContent = entry.pattern;
            patternTd.rowSpan = numRows;
            tr.appendChild(patternTd);
        }

        if (entry.pathsAndContext.length === 0) {
            const emptyTd = document.createElement('td');
            emptyTd.colSpan = 5;
            emptyTd.textContent = 'No paths';
            emptyTd.style.textAlign = 'center';
            tr.appendChild(emptyTd);
        } else {
            const pathAndContext = entry.pathsAndContext[i];



            const contextTd = document.createElement('td');
            contextTd.textContent = pathAndContext.context;
            contextTd.classList.add("expandable");
            tr.appendChild(contextTd);

            const pathTd = document.createElement('td');
            pathTd.textContent = pathAndContext.path;
            pathTd.classList.add("expandable");
            tr.appendChild(pathTd);

            tr.addEventListener("click", function () {
                tr.classList.toggle("expanded");
            });


            const results = await calculateSuccessPerPath(pathAndContext.path);

            const successTd = document.createElement('td');
            successTd.textContent = results.successCounter;
            tr.appendChild(successTd);

            const failureTd = document.createElement('td');
            failureTd.textContent = results.failureCounter;
            tr.appendChild(failureTd);

            const checkboxTd = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';

            // Optional: add dataset attributes to identify checkbox later
            checkbox.dataset.type = entry.type;
            checkbox.dataset.path = pathAndContext.path;

            // No listeners as per your request, but you can add:
            // checkbox.addEventListener('change', ...);

            checkboxTd.appendChild(checkbox);
            tr.appendChild(checkboxTd);
        }

        rows.push(tr);
    }

    return rows;
}

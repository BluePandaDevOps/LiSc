import { activateTab } from './builder_parser_website.js';
import { createTextCell } from './utils.js'
import { getSelectedPathsAndTypesfromFetchMatch } from './pathOptions.js'
import {
    addSortingFunctionality,
    addSearchFunctionality
} from './utils_frontend.js';

console.log("loaded: pathSelection.js");
document.getElementById("nextpathValidation").addEventListener('click', async () => {
    activateTab('pathValidation');
});


const searchInput = document.getElementById("tablePathSelectionSearch");
const searchButton = document.getElementById("searchPathSelectionBtn");
const clearButton = document.getElementById("clearPathSelectionBtn");

const table = document.getElementById("selectedPathsTable");
addSortingFunctionality(table, true)
addSearchFunctionality(table,
    {
        searchInput: searchInput,
        searchButton: searchButton,
        clearButton: clearButton
    }
)




document.addEventListener('updateSelectedPathsTable', () => {
    const tableBody = document.querySelector('#selectedPathsTable tbody');
    if (!tableBody) return console.error('Table body element not found!');

    tableBody.innerHTML = ''; // Clear everything

    try {
        const entries = getSelectedPathsAndTypesfromFetchMatch();
        if (Array.isArray(entries) && entries.length > 0) {
            entries.forEach((entry, index) => {
                const row = createSelectedPathRow(entry)
                const splitCellOptions = addPostSelectionOptions()
                row.appendChild(splitCellOptions);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load keyword entries:', error);
    }
    activateTab('pathSelection');
});



function createSelectedPathRow(entry = { type: '', path: '', }, index) {
    const tr = document.createElement('tr');
    tr.appendChild(createTextCell(entry.type));
    tr.appendChild(createTextCell(entry.path));

    const textContentCell = document.createElement('td');

    const textContentLabel = document.createElement('label');
    const textContentCheckbox = document.createElement('input');
    textContentCheckbox.type = 'checkbox';
    textContentCheckbox.className = 'path-includeTextContent-toggle';
    textContentLabel.appendChild(textContentCheckbox);
    textContentCell.appendChild(textContentLabel);
    textContentCell.appendChild(document.createElement('br'));

    tr.appendChild(textContentCell)
    return tr;
}




export function getAllSelectedPathsDataFromPathSelection() {
    const table = document.querySelector('#selectedPathsTable');
    if (!table) return [];

    const rows = table.querySelectorAll('tbody tr');
    const results = [];

    rows.forEach(row => {
        const [typeCell, pathCell, checkboxCell, postSelectionCell] = row.cells;

        const textContextIsChecked = checkboxCell.querySelector('input[type="checkbox"]')?.checked || false;

        const postSelection = getCurrentPostSelectionOptions(postSelectionCell);

        results.push({
            type: typeCell.textContent.trim(),
            path: pathCell.textContent.trim(),
            textContextIsChecked,
            postSelection
        });
    });

    return results;
}



function getCurrentPostSelectionOptions(container) {
    const splitCheckbox = container.querySelector('.split-toggle');
    const delimiterInput = container.querySelector('.split-delimiter');
    const positionInput = container.querySelector('.split-position');
    const regexCheckbox = container.querySelector('.split-regex');
    const regexInput = container.querySelector('.split-regex-input');

    if (regexCheckbox?.checked) {
        return {
            mode: 'regex',
            regexPattern: regexInput.value.trim()
        };
    }

    if (splitCheckbox?.checked) {
        return {
            mode: 'split',
            delimiter: delimiterInput.value.trim(),
            position: positionInput.value.trim()
        };
    }

    return { mode: 'none' };
}
function addPostSelectionOptions() {
    const splitCell = document.createElement('td');

    const splitLabel = document.createElement('label');
    const splitCheckbox = document.createElement('input');
    splitCheckbox.type = 'checkbox';
    splitCheckbox.className = 'split-toggle';
    splitLabel.appendChild(splitCheckbox);
    splitLabel.appendChild(document.createTextNode(' Enable Split'));
    splitCell.appendChild(splitLabel);
    splitCell.appendChild(document.createElement('br'));

    const delimiterLabel = document.createElement('label');
    delimiterLabel.textContent = 'Delimiter: ';
    const delimiterInput = document.createElement('input');
    delimiterInput.type = 'text';
    delimiterInput.className = 'split-delimiter';
    delimiterInput.placeholder = 'e.g. / or -';
    delimiterLabel.appendChild(delimiterInput);
    splitCell.appendChild(delimiterLabel);

    const positionLabel = document.createElement('label');
    positionLabel.textContent = 'Position: ';
    const positionInput = document.createElement('input');
    positionInput.type = 'text';
    positionInput.className = 'split-position';
    positionInput.placeholder = 'e.g. 5';
    positionLabel.appendChild(positionInput);
    splitCell.appendChild(positionLabel);

    const regexLabel = document.createElement('label');
    regexLabel.className = 'split-regex-label';

    const regexCheckbox = document.createElement('input');
    regexCheckbox.type = 'checkbox';
    regexCheckbox.className = 'split-regex';

    const regexInput = document.createElement('input');
    regexInput.type = 'text';
    regexInput.className = 'split-regex-input';
    regexInput.placeholder = 'g//';

    regexLabel.appendChild(regexCheckbox);
    regexLabel.appendChild(document.createTextNode(' Use Regex'));
    splitCell.appendChild(regexLabel);
    splitCell.appendChild(regexInput);


    // Handle mutual exclusivity & UI toggles only
    splitCell.addEventListener('change', (event) => {
        if (event.target === regexCheckbox && regexCheckbox.checked && splitCheckbox.checked) {
            splitCheckbox.checked = false;
        }
        if (event.target === splitCheckbox && splitCheckbox.checked && regexCheckbox.checked) {
            regexCheckbox.checked = false;
        }
        regexInput.disabled = !regexCheckbox.checked;
    });

    return splitCell;
}



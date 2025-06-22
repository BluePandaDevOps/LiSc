
export function setLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        // Lock current width to avoid layout shift
        const width = button.offsetWidth;
        button.style.width = `${width}px`;
        button.classList.add('loading');
    } else {
        button.classList.remove('loading');
        button.style.width = '';
    }
}


export function addSearchFunctionality(table, searchElements, useGrouping = false) {
    // Trigger search on button click
    searchElements.searchButton.addEventListener("click", () => performSearch(table, searchElements.searchInput, useGrouping));

    searchElements.clearButton.addEventListener("click", () => {
        searchElements.searchInput.value = "";
        performSearch(table, searchElements.searchInput, useGrouping);
    });

    searchElements.searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            performSearch(table, searchElements.searchInput, useGrouping);
        }
    });

}




function performSearch(table, searchInput, useGrouping = false) {
    const tbody = table.querySelector('tbody');
    const columnMap = getColumnMap(table);
    const query = searchInput.value.trim().toLowerCase();

    let groups;
    if (useGrouping) {
        groups = getRowGroups(table);
    } else {
        // Each row is its own group
        groups = Array.from(tbody.querySelectorAll('tr')).map(row => [row]);
    }

    if (!query) {
        // Show all rows if search is empty
        groups.forEach(group => group.forEach(row => (row.style.display = "")));
        return;
    }

    groups.forEach(group => {
        const showGroup = group.some(row => {
            let show = false;
            const orGroups = query.split(/\s+or\s+/i);

            for (let groupText of orGroups) {
                const andConditions = groupText.split(/\s+and\s+/i);
                const matchesAll = andConditions.every(cond => evaluateCondition(cond, row, columnMap));
                if (matchesAll) {
                    show = true;
                    break;
                }
            }
            return show;
        });

        group.forEach(row => {
            row.style.display = showGroup ? "" : "none";
        });
    });
}

export function addSortingFunctionality(table, useGrouping = true) {
    const columnMap = getColumnMap(table);
    let currentSort = { key: null, ascending: true };
    const tbody = table.querySelector('tbody');

    const headers = table.querySelectorAll('thead th');
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const key = header.getAttribute('data-key');
            if (!key) return;

            const colIndex = columnMap[key];
            if (colIndex === undefined) return;

            // Toggle sort order
            const isSameKey = currentSort.key === key;
            currentSort.key = key;
            currentSort.ascending = isSameKey ? !currentSort.ascending : true;

            let groups;
            if (useGrouping) {
                groups = getRowGroups(table);
            } else {
                // Each row is a group of one row (no grouping)
                groups = Array.from(tbody.querySelectorAll('tr')).map(row => [row]);
            }

            groups.sort((groupA, groupB) => {
                const rowA = groupA[0];
                const rowB = groupB[0];

                const aText = rowA.children[colIndex]?.textContent.trim().toLowerCase() || '';
                const bText = rowB.children[colIndex]?.textContent.trim().toLowerCase() || '';

                return currentSort.ascending
                    ? aText.localeCompare(bText)
                    : bText.localeCompare(aText);
            });

            groups.forEach(groupRows => {
                groupRows.forEach(row => tbody.appendChild(row));
            });
        });
    });
}
function evaluateCondition(condition, row, columnMap) {
    const cells = row.querySelectorAll("td");

    if (condition.includes("=")) {
        const [key, value] = condition.split("=").map(s => s.trim().toLowerCase());

        const colIndex = columnMap[key];
        if (colIndex === undefined || !cells[colIndex]) return false;
        return cells[colIndex].textContent.toLowerCase().includes(value);
    }

    // Plain text search on entire row
    const rowText = Array.from(cells)
        .map(td => td.textContent.toLowerCase())
        .join(" ");
    return rowText.includes(condition.toLowerCase());
}

function getColumnMap(table) {
    const headers = table.querySelectorAll("thead th");
    const map = {};
    headers.forEach((th, index) => {
        const key = th.getAttribute("data-key");
        if (key) map[key] = index;
    });
    return map;
}

function getRowGroups(table) {
    const tbody = table.querySelector('tbody');
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const groups = [];

    let i = 0;
    while (i < allRows.length) {
        const mainRow = allRows[i];
        const firstCell = mainRow.querySelector('td');
        let rowspan = 1;
        if (firstCell && firstCell.hasAttribute('rowspan')) {
            rowspan = parseInt(firstCell.getAttribute('rowspan'), 10);
        }
        const group = allRows.slice(i, i + rowspan);
        groups.push(group);
        i += rowspan;
    }

    return groups;
}
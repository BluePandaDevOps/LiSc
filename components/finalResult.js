
import {
    removeResultByUrl,
    getAllFinalResultEntries
} from '../data/builder_parser_store.js';



document.addEventListener('buildResultTableFromDatabase', async () => {
    const container = document.querySelector('#finalResultsTable tbody');
    if (!container) return;
  
    const data = await getAllFinalResultEntries()
    const { data: tableData, columns: tableColumns} = pivotRowsByUrl(data)
  
    // Clear previous table
    container.innerHTML = '';
  
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.border = '1px solid #ccc';
  
    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    tableColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        th.style.border = '1px solid #ccc';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f4f4f4';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create data rows
    const tbody = document.createElement('tbody');
    tableData.forEach(rowData => {
        const row = document.createElement('tr');
        tableColumns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = rowData[col] || '';
            td.style.border = '1px solid #ccc';
            td.style.padding = '8px';
            row.appendChild(td);
        });

        const tdActions = document.createElement('td');
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
  
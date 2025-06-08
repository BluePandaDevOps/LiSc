
import { 
    parseHTMLsforKeywords,
    calculateSuccessPerPath,
} from '../logic/builder_parser_logic.js';




document.getElementById('fetch-content').addEventListener('click', async () => {
    document.dispatchEvent(new CustomEvent('fetchAndMatch'));
  });

document.addEventListener('fetchAndMatch', async () => {
    const tableBody = document.querySelector('#fetchMatchTable tbody');
    if (!tableBody) return console.error('Table body element not found!');
  
    const entries = await parseHTMLsforKeywords();
    tableBody.innerHTML = ''; // Clear everything
  
    if (Array.isArray(entries) && entries.length > 0) {
      for (const entry of entries) {
        const rows = await createFetchAndMatchRows(entry);  // note plural 'Rows'
        rows.forEach(row => tableBody.appendChild(row));
      }
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
        urlTd.style.border = '1px solid black';
        urlTd.style.padding = '4px';
        tr.appendChild(urlTd);
  
        const typeTd = document.createElement('td');
        typeTd.textContent = entry.type;
        typeTd.rowSpan = numRows;
        typeTd.style.border = '1px solid black';
        typeTd.style.padding = '4px';
        tr.appendChild(typeTd);
  
        const patternTd = document.createElement('td');
        patternTd.textContent = entry.pattern;
        patternTd.rowSpan = numRows;
        patternTd.style.border = '1px solid black';
        patternTd.style.padding = '4px';
        tr.appendChild(patternTd);
      }
  
      if (entry.pathsAndContext.length === 0) {
        const emptyTd = document.createElement('td');
        emptyTd.colSpan = 5;
        emptyTd.textContent = 'No paths';
        emptyTd.style.border = '1px solid black';
        emptyTd.style.padding = '4px';
        emptyTd.style.textAlign = 'center';
        tr.appendChild(emptyTd);
      } else {
        const pathAndContext = entry.pathsAndContext[i];
  
        const pathTd = document.createElement('td');
        pathTd.textContent = pathAndContext.path;
        pathTd.style.border = '1px solid black';
        pathTd.style.padding = '4px';
        tr.appendChild(pathTd);
  
        const contextTd = document.createElement('td');
        contextTd.textContent = pathAndContext.context;
        contextTd.style.border = '1px solid black';
        contextTd.style.padding = '4px';
        tr.appendChild(contextTd);
  
  
  
        const results = await calculateSuccessPerPath(pathAndContext.path);
  
        const successTd = document.createElement('td');
        successTd.textContent = results.successCounter;
        successTd.style.border = '1px solid black';
        successTd.style.padding = '4px';
        tr.appendChild(successTd);
  
        const failureTd = document.createElement('td');
        failureTd.textContent = results.failureCounter;
        failureTd.style.border = '1px solid black';
        failureTd.style.padding = '4px';
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
        checkboxTd.style.border = '1px solid black';
        checkboxTd.style.padding = '4px';
        tr.appendChild(checkboxTd);
      }
  
      rows.push(tr);
    }
  
    return rows;
}
  
import {
  getAllHTMLpages,
  removeRawHTMLByUrl
} from '../data/builder_parser_store.js';


document.getElementById("refreshRawHTMLbtn").addEventListener('click', async () => {
    document.dispatchEvent(new CustomEvent('rawHTMLstoreUpdated'));
  });

document.addEventListener('rawHTMLstoreUpdated', async () => {
    const data = await getAllHTMLpages();
    console.log(`data: ${data}`)
    const tableBody = document.querySelector("#rawHTMLTable tbody");
    tableBody.innerHTML = ""; // Clear old rows
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(entry => {
        const row = document.createElement("tr");
  
        const urlCell = document.createElement("td");
        urlCell.textContent = entry.url;
        row.appendChild(urlCell);
  
        const timeCell = document.createElement("td");
        timeCell.textContent = entry.savedAt;
        row.appendChild(timeCell);

        const tdActions = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            deleteBtn.disabled = true;
            removeRawHTMLByUrl(entry.url)
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
  
        tableBody.appendChild(row);
      });
    }
  });
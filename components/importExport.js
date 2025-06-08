
import { pivotRowsByUrl } from './finalResult.js';
import { download_data } from '../logic/background.js';
import {
    importDataToStores,
    getAllFinalResultEntries,
    exportAllStores
} from '../data/builder_parser_store.js'
 

 document.getElementById('exportAllStoresBtn').addEventListener('click', async () => {
    exportAllStores()
  });
  

document.getElementById('exportResultsFromDatabaseBtn').addEventListener('click', async () => {
    document.dispatchEvent(new CustomEvent('downloadCSVResultTableFromDatabase'));
  });

document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
  
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
  
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('Invalid file format');
      }
  
      await importDataToStores(jsonData);
      alert('Import completed successfully!');
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import data: ' + err.message);
    }
  });
  

  
document.addEventListener('downloadCSVResultTableFromDatabase', async () => {
    const data = await getAllFinalResultEntries()
    const { data: tableData, columns: tableColumns} = pivotRowsByUrl(data)
    download_data(tableData, `${getFormattedTimestamp()}_finalResults.csv`)
  });
  
  function getFormattedTimestamp() {
    const now = new Date();
  
    const pad = (n) => n.toString().padStart(2, '0');
  
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1); // Months are 0-based
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
  
    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
  }
  
import { isValidPattern } from './utils.js'
import {
    removeKeywordByEntry,   
    getKeywordList,
    addKeyword
} from '../data/builder_parser_store.js';

document.addEventListener('KeywordListUpdated', async () => {
    const tableBody = document.querySelector('#keywordsTable tbody');
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

  // Add new keyword
  document.getElementById('addKeywordBtn').addEventListener('click', () => {
    const url = document.getElementById('newUrlInput').value.trim();
    const type = document.getElementById('newTypeInput').value.trim();
    const pattern = document.getElementById('newPatternInput').value.trim();

    if (url === '') {
        showError('url cannot be empty.');
        return;
    }else if(pattern === ''){
        showError('Pattern cannot be empty.');
        return;
    }else if(type === ''){
        showError('Type cannot be empty.');
        return;
    }else if(typeof url !== 'string'){
        showError('url must be a String.');
        return;
    }else if(typeof type !== 'string'){
        showError('Type must be a String.');
        return;
    }else if(typeof pattern !== 'string'){
        showError('Pattern must be a String.');
        return;
    }
    if (!isValidPattern(pattern)) {
        showError('Pattern is not a valid regular expression.');
        return;
    }

    clearError();
    addKeyword({ url, type, pattern }).then(() => {
      document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
    })
    .catch(error => {
      console.error('Failed to remove keyword:', error);
      // Optionally show user an error message here
    });
    document.getElementById('newUrlInput').value = '';;
    document.getElementById('newTypeInput').value = '';;
    document.getElementById('newPatternInput').value = '';;

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
  
    tr.appendChild(createInputCell({
      value: entry.url,
      placeholder: 'Enter url',
      className: 'url'
    }));
  
    tr.appendChild(createInputCell({
      value: entry.type,
      placeholder: 'Enter Type',
      className: 'type'
    }));
  
    tr.appendChild(createInputCell({
      value: entry.pattern,
      placeholder: 'Enter pattern',
      className: 'pattern'
    }));
  
    // Delete button
    const tdActions = document.createElement('td');
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

  function createInputCell({ value = '', placeholder = '', className = '' }) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    input.className = className;
    td.appendChild(input);
    return td;
  }
  
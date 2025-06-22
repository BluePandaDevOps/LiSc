import {
    deleteCurrentDatabase,
} from '../data/database.js';




document.getElementById('deleteDatabaseBtn').addEventListener('click', async () => {
    const confirmed = confirm("Are you sure you want to delete the database?");
    if (!confirmed) return;

    const statusDatabaseDiv = document.getElementById('deleteDatabaseStatus');
    try {
        await deleteCurrentDatabase(); // replace with your DB name
        statusDatabaseDiv.textContent = 'Database deleted successfully.';
        statusDatabaseDiv.style.color = 'green';
    } catch (error) {
        statusDatabaseDiv.textContent = 'Failed to delete database: ' + error.message;
        statusDatabaseDiv.style.color = 'red';
    }
});


export function createTextCell(text = '') {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}


export function isValidPattern(pattern) {
    try {
        new RegExp(pattern);
        return true;
    } catch (e) {
        return false;
    }
}


export function isEntryValid(entry) {
    return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.url === 'string' &&
        typeof entry.pattern === 'string'
    );
}

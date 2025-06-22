document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('openTab');
    if (button) {
        button.addEventListener('click', () => {
            window.open('lisc.html', '_blank');
        });
    }
});
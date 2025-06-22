// main.js
import { setIcon } from '../logic/background.js';
import { IN_BUILD_PARSER_MODE } from '../config/config.js';


if (document.readyState === "loading") {
  // The document is still loading, so wait for DOMContentLoaded event
  document.addEventListener("DOMContentLoaded", () => {
    initialize_buttons();
  });
} else {
  // The DOM is already loaded, just run your code now
  initialize_buttons();
};

function initialize_buttons() {

  // Get DOM elements
  const toogleBuilderMode = document.getElementById("toggleSliderBuilderMode");
  const labelBuilderMode = document.getElementById("modeLabelBuilderMode");



  document.querySelectorAll('.tab-link').forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab.dataset.tab);
    });
  });

  toogleBuilderMode.addEventListener("change", () => {
    const isOn = toogleBuilderMode.checked;
    labelBuilderMode.textContent = isOn ? "Disable Building Mode" : "Enable Building Mode";

    // Example: toogleBuilderMode flag (if needed)
    IN_BUILD_PARSER_MODE.flag = isOn;

    // Update icon or do something else
    setIcon(isOn ? 'building' : 'default');
  });

  document.dispatchEvent(new CustomEvent('KeywordListUpdated'));
  document.dispatchEvent(new CustomEvent('rawHTMLstoreUpdated'));
};



export function activateTab(tabId) {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');
  
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
  
    const selectedTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
    const selectedContent = document.getElementById(tabId);
  
    if (selectedTab && selectedContent) {
      selectedTab.classList.add('active');
      selectedContent.classList.add('active');
    }
  }

  document.querySelectorAll('.tooltip-icon').forEach(icon => {
    icon.addEventListener('mouseenter', (e) => {
      const tooltip = document.getElementById('global-tooltip');
      tooltip.textContent = icon.getAttribute('data-tooltip');
      
      const rect = icon.getBoundingClientRect();
      tooltip.style.top = `${rect.top - 30 + window.scrollY}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.opacity = 1;
    });
  
    icon.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('global-tooltip');
      tooltip.style.opacity = 0;
    });
  });




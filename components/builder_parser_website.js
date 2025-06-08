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

function initialize_buttons(){

  // Get DOM elements
  const toogleBuilderMode = document.getElementById("toggleSliderBuilderMode");
  const labelBuilderMode = document.getElementById("modeLabelBuilderMode");


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






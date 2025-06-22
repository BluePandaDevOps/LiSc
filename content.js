browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("content set up");

  if (message.action === "parseHTML") {
    new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve({
          result: 'successful',
          url: window.location.href,
          htmlContent: document.documentElement.innerHTML
        });
      } else {
        window.addEventListener('load', () => {
          resolve({
            result: 'successful',
            url: window.location.href,
            htmlContent: document.documentElement.innerHTML
          });
        });
      }
    }).then(data => sendResponse(data));

    return true; // Keeps response channel open
  }

  sendResponse({ result: 'not ready' });
  return false;
});

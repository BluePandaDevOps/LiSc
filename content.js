browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("content set up");
    if (message.action === "parseHTML") {
      
      if (document.readyState === 'complete') {
        const htmlContent = document.documentElement.innerHTML; 
        const url = window.location.href;
        sendResponse({result: 'successful', url, htmlContent});
      } else {
        sendResponse({result: 'failed'})
      }
    } else {
        sendResponse({result: 'not ready'})
    }
    return true; 
  });
  
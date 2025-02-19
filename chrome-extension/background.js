chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.ts"],
  });

  // Send a message to `content.js` to toggle the sidebar
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
});

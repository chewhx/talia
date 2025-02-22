chrome.action.onClicked.addListener((tab) => {
  // Inject content script into the tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"], // Ensure this file exists in your extension
  });

  // Send a message to the content script to toggle the sidebar
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar", tabID: tab.id });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log({ tabId, changeInfo, tab });
  if (changeInfo.url && changeInfo.url.toString().includes("session_expired")) {
    console.log("Tab URL changed to:", changeInfo.url);
    chrome.tabs.sendMessage(tabId, { action: "PG_UNAUTHORIZED" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GO_DRAFT_PAGE") {
    console.log("background: ", message);
    const draftID = message.draftID;
    chrome.tabs.update({
      url: `http://localhost:8082/consentForms/drafts/${draftID}`,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GO_DRAFT_PAGE") {
    const draftID = message.draftID;
    chrome.tabs.update({
      url: `http://localhost:8082/consentForms/drafts/${draftID}`,
    });
  }
});

// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

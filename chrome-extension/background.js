chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🟢 Background", { message, sender });

  if (message.action === "GO_DRAFT_PAGE") {
    const draftID = message?.draftInfo?.id;
    const type = message?.draftInfo?.type;

    if (draftID && type) {
      console.log("Navigate to draft page: ", draftID, type);

      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          const url = new URL(activeTab.url);
          const targetUrl = `${url.origin}/${type}/drafts/${draftID}`;

          // Update the URL of the active tab
          chrome.tabs.update(activeTab.id, { url: targetUrl }, (updatedTab) => {
            if (chrome.runtime.lastError) {
              console.error("Error updating tab:", chrome.runtime.lastError);
            } else {
              console.log("Tab updated successfully:", updatedTab);
            }
          });
        } else {
          console.error("No active tab found");
        }
      });
    }
  } else if (message.action === "PG_DRAFT_RESPONSE") {
    chrome.runtime.sendMessage(message);
  } else if (message.action === "GET_ORIGIN") {
    // Get the current active tab's origin
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url);
        sendResponse({ origin: url.origin });
      } else {
        sendResponse({ origin: null });
      }
    });
  }
});

// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

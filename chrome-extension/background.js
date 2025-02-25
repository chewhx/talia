chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🟢 Background", { message, sender });
  if (message.action === "GO_DRAFT_PAGE") {
    const draftID = message?.draftInfo?.id;
    const type = message?.draftInfo?.type;

    if (draftID && type) {
      chrome.tabs.update({
        url: `http://localhost:8082/${type}/drafts/${draftID}`,
      });
    }
  } else if (message.action === "PG_DRAFT_RESPONSE") {
    chrome.runtime.sendMessage(message);
  }
});

// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

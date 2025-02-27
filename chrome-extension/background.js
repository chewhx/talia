chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🟢 Background", { message, sender });
  if (message.action === "GO_DRAFT_PAGE") {
    const draftID = message?.draftInfo?.id;
    const type = message?.draftInfo?.type;
    console.log("Processing");

    if (draftID && type) {
      console.log("Navigate to draft page: ", draftID, type);
      // chrome.tabs.update({
      //   url: `http://localhost:8082/${type}/drafts/${draftID}`,
      // });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = `http://localhost:8082/${type}/drafts/${draftID}`;

        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { url });
        } else {
          chrome.tabs.create({ url });
        }
      });
    }
  } else if (message.action === "PG_DRAFT_RESPONSE") {
    chrome.runtime.sendMessage(message);
  }
});

// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

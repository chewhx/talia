window.addEventListener("message", (event) => {
  const { origin, data } = event;

  /*  Only handle request from HeyTalia */
  if (
    origin !== "http://localhost:3000" &&
    origin !== "http://localhost:8082" &&
    origin !== "https://dev-pg.moe.edu.sg"
  ) {
    return;
  }

  switch (data.action) {
    case "SCAN_FORM_REQUEST": {
      console.log("🟢 Panel: SCAN_FORM_REQUEST", { origin, data });

      sendMessageToContentJSWithResponse(data);
      break;
    }
    case "FILL_FORM_REQUEST": {
      console.log("🟢 Panel: SCAN_FORM_REQUEST", { origin, data });

      sendMessageToContentJSWithoutResponse(data);
      break;
    }
    case "GO_DRAFT_PAGE": {
      console.log("🟢 Panel: GO_DRAFT_PAGE", { origin, data });

      sendMessageToBackground(data);
      break;
    }
    case "PG_DRAFT_REQUEST": {
      console.log("🟢 Panel: PG_DRAFT_REQUEST", { origin, data });

      sendMessageToContentJSWithoutResponse(data);
      break;
    }
    case "IDENTITY_CURRENT_ACTIVE_TAB": {
      console.log("🟢 Panel: IDENTITY_CURRENT_ACTIVE_TAB", { origin, data });
      getCurrentActiveTabOrigin();
    }
  }
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
  /*  Only handle request from background.js */
  if (data.action === "PG_DRAFT_RESPONSE") {
    console.log("🟢 Panel: PG_DRAFT_RESPONSE", { sender, data });
    sendMessageToIframe(data);
    return;
  }
});

// Send to content.js to communicate with web app
async function sendMessageToContentJSWithoutResponse(data) {
  try {
    const activeTab = await getActiveTab();
    const url = new URL(activeTab.url);
    data.currentWebsite = identifyTargetWebsite(url.origin);

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(activeTab.id, data, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Error sending message to content.js:", error);
  }
}

// Send to content.js to communicate with web app and return response to HeyTalia
async function sendMessageToContentJSWithResponse(data) {
  try {
    const activeTab = await getActiveTab();
    data.currentWebsite = identifyTargetWebsite(activeTab.url);

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(activeTab.id, data, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response) {
          response.currentWebsite = data.currentWebsite;
          sendMessageToIframe(response);
          resolve(response);
        } else {
          reject(new Error("No response received from content.js"));
        }
      });
    });
  } catch (error) {
    console.error("Error sending message to content.js:", error);
  }
}

async function getCurrentActiveTabOrigin() {
  try {
    const activeTab = await getActiveTab();
    const currentWebsite = identifyTargetWebsite(activeTab.url);
    console.log("We will send message");
    sendMessageToIframe({
      action: "CURRENT_ACTIVE_TAB_RESPONSE",
      currentWebsite,
    });
  } catch (error) {
    console.error("Error sending message to content.js:", error);
  }
}

// Return response to HeyTalia
function sendMessageToIframe(data) {
  const iframe = document.querySelector("iframe");
  if (iframe) {
    iframe.contentWindow.postMessage(data, "*");
  }
}

// Send message to background.js
function sendMessageToBackground(data) {
  chrome.runtime.sendMessage(data);
}

function identifyTargetWebsite(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("classroom.google.com")) return "GoogleClassroom";
  if (urlLower.includes("vle.learning.moe.edu.sg")) return "SLS";
  if (
    urlLower.includes("localhost:8082") ||
    urlLower.includes("dev-pg.moe.edu.sg") ||
    urlLower.includes("qe-pg.moe.edu.sg") ||
    urlLower.includes("u-pg.moe.edu.sg")
  )
    return "PG";

  return "";
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (tabs.length === 0) {
        reject(new Error("No active tab found"));
      } else {
        resolve(tabs[0]);
      }
    });
  });
}

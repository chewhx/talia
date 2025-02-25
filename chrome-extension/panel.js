window.addEventListener("message", (event) => {
  const { origin, data } = event;

  // Only handle request from HeyTalia
  if (origin !== "http://localhost:3000") {
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
    case "PG_DRAFT_RESPONSE": {
      console.log("🟢 Panel: PG_DRAFT_RESPONSE", { origin, data });

      sendMessageToIframe(data);
      break;
    }
  }
});

// Send to content.js to communicate with web app
function sendMessageToContentJSWithoutResponse(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    data.currentWebsite = identifyTargetWebsite(activeTab.url);

    console.log({ withoutresponse: data });
    chrome.tabs.sendMessage(activeTab.id, data);
  });
}

// Send to content.js to communicate with web app and return response to HeyTalia
function sendMessageToContentJSWithResponse(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    console.log({ activeTab });
    data.currentWebsite = identifyTargetWebsite(activeTab.url);
    chrome.tabs.sendMessage(activeTab.id, data, (response) => {
      if (response) {
        console.log({ response });
        response.currentWebsite = data.currentWebsite;
        sendMessageToIframe(response);
      }
    });
  });
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
    urlLower.includes("dev-pg.moe.edu.sg")
  )
    return "PG";

  return "";
}

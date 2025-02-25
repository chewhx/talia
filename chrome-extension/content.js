(() => {
  // const chromeExtension = "chrome-extension://ncnapjdokmekfgfhpmadgemfnhckpecl";
  // const iframe = ["http://localhost:3000"];
  // const controlledWebsite = ["http://localhost:8082"];

  // Listen from `background.js` or `content.js`
  chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data.action === "SCAN_FORM_REQUEST") {
      console.log("🟢 Content: SCAN_FORM_REQUEST", { data, sender });

      let targetScanner = scanFormElements;

      if (data.currentWebsite === "SLS") {
        targetScanner = scanSLS;
      } else if (data.currentWebsite === "GoogleClassroom") {
        targetScanner = scanClassroom; // Fake scan as we use hardcode placeholder as id
      }

      targetScanner().then((result) => {
        sendResponse({
          action: "SCAN_FORM_RESPONSE",
          result: JSON.stringify(result),
        });
      });
      return true;
    }

    if (data.action === "FILL_FORM_REQUEST") {
      console.log("🟢 Content: FILL_FORM_REQUEST", { data, sender });

      let targetFillForm = fillForm;

      if (data.currentWebsite === "SLS") {
        const formData = JSON.parse(data.data ?? {});
        fillSLS(formData);
      } else if (data.currentWebsite === "GoogleClassroom") {
        fillGoogleClassroom(data?.data); //Only one string
      }

      return;
    }

    /* Actions for PG */
    if (data.action === "GO_DRAFT_PAGE") {
      console.log("🟢 Content: GO_DRAFT_PAGE", { data, sender });
      sendToBackgroundJS(data);
      return;
    }

    if (data.action === "PG_DRAFT_REQUEST") {
      console.log("🟢 Content: PG_DRAFT_REQUEST", { data, sender });
      sendToWebsite(data);
      return;
    }
  });

  if (!window.hasContentScriptListener) {
    window.hasContentScriptListener = true;

    window.addEventListener("message", (event) => {
      const { origin, data } = event;
      if (origin !== "http://localhost:8082") {
        return;
      }

      // // Handle message from active tab website
      // // Only for PG
      if (origin === "http://localhost:8082") {
        switch (data.action) {
          case "PG_DRAFT_RESPONSE": {
            console.log("🟢 Content: PG_DRAFT_RESPONSE", { origin, data });
            chrome.runtime.sendMessage(data);
            break;
          }

          case "PG_UNAUTHORIZED": {
            console.log("🟢 Content: PG_UNAUTHORIZED", { origin, data });
            window.postMessage(data, "http://localhost:3000/");
            break;
          }
        }
      }
    });
  }
})();

// Send to background.js or panel.js
function sendToBackgroundJS(data, targetOrigin = "*") {
  chrome.runtime.sendMessage(data, targetOrigin);
}

// Send to website (PG,etc)
function sendToWebsite(data, targetOrigin) {
  window.postMessage(data, targetOrigin ?? "http://localhost:8082/");
}

// ==================================================
// Scan Form Fields
// ==================================================

function scanFormElements() {
  function createElementInfo(element) {
    return {
      type: element.tagName.toLowerCase(),
      id: element.id || "No ID",
      name: element.name || "No name",
      placeholder: element.placeholder || "",
      // attributes: getAttributes(element),
      ...(element.tagName.toLowerCase() === "select" && {
        options: Array.from(element.options).map((option) => ({
          value: option.value,
          text: option.text,
          selected: option.selected,
          element: option,
        })),
      }),
    };
  }

  function getAttributes(element) {
    const attributes = {};
    Array.from(element.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value;
    });
    return attributes;
  }

  const formElements = document.querySelectorAll("input, select, textarea");
  const elementsInfo = [];
  const radioGroups = {};

  formElements.forEach((element) => {
    if (element.type === "radio") {
      const baseName = element.name.replace(".value", "");
      if (!radioGroups[baseName]) {
        radioGroups[baseName] = [];
      }
      radioGroups[baseName].push(element);
    } else {
      const elementInfo = createElementInfo(element);
      elementsInfo.push(elementInfo);
    }
  });

  // Process radio groups
  for (const [baseName, radios] of Object.entries(radioGroups)) {
    const radioGroupInfo = {
      type: "group",
      name: baseName,
      options: radios.map((radio) => ({
        id: radio.id,
        value: radio.value,
        checked: radio.checked,
        // attributes: getAttributes(radio),
      })),
    };
    elementsInfo.push(radioGroupInfo);
  }

  // return JSON.stringify(elementsInfo, null, 2);
  return JSON.stringify(elementsInfo, replacer(), 2);
}

// Custom replacer function to handle circular references
function replacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    if (value instanceof Element) {
      return `[Element ${value.tagName}]`;
    }
    return value;
  };
}

// ==================================================
// Fill In Form
// ==================================================
function fillForm(formData) {
  function handleGenericField(element, field) {
    if (element) {
      switch (element.type) {
        case "checkbox":
          element?.click();
          break;
        case "select-one":
          element?.click();
          break;
        case "textarea":
          element.value = field;
          triggerChange(element);
          break;
        case "radio":
          element?.click();
          break;
        default:
          element.value = field;
          triggerChange(element);
          break;
      }
    } else {
      console.warn(`Element not found for: ${JSON.stringify(element)}`);
    }
  }

  function findUniqueAttribute(attributes) {
    const priorityAttrs = ["aria-label", "placeholder", "data-testid"];
    for (const attr of priorityAttrs) {
      if (attributes?.[attr]) {
        return { name: attr, value: attributes?.[attr] };
      }
    }
    return null;
  }

  function triggerChange(element) {
    if (element) {
      const event = new Event("change", { bubbles: true, cancelable: false });
      const input = new Event("input", { bubbles: true, cancelable: false });
      const click = new Event("click", { bubbles: true, cancelable: false });
      element.dispatchEvent(event);
      element.dispatchEvent(input);
      element.dispatchEvent(click);
    }
  }
  Object.entries(formData).forEach(([key, field]) => {
    const element = document.getElementById(key);
    if (!element) {
      console.warn(`Element with id ${key} not found`);
      return;
    }

    handleGenericField(element, field);
  });
}

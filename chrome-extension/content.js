(() => {
  // Prevent multiple injections
  if (document.getElementById("heytalia-sidebar")) return;

  // Add Font Awesome to the document (if not already included)
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesomeLink = document.createElement("link");
    fontAwesomeLink.rel = "stylesheet";
    fontAwesomeLink.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css";
    document.head.appendChild(fontAwesomeLink);
  }
  const originalBodyWidth = document.body.style.width;

  // Create a sidebar container (taking 1/3 of the page)
  const sidebar = document.createElement("div");

  sidebar.id = "heytalia-sidebar";
  sidebar.style.position = "fixed";
  sidebar.style.top = "0";
  sidebar.style.right = "0";
  sidebar.style.width = "33vw"; // Sidebar takes 1/3 of the page width
  sidebar.style.height = "100vh";
  sidebar.style.background = "white";
  sidebar.style.boxShadow = "-5px 0 15px rgba(0, 0, 0, 0.2)";
  sidebar.style.zIndex = "10000";
  sidebar.style.transition = "transform 0.3s ease-in-out";
  sidebar.style.transform = "translateX(100%)"; // Initially hidden

  // // Create close button
  // const closeButton = document.createElement("button");
  // closeButton.innerHTML = "x";
  // closeButton.style.position = "absolute";
  // closeButton.style.left = "-20px"; // Adjust this value to control how far it sticks out
  // closeButton.style.top = "1%";
  // closeButton.style.background = "white";
  // closeButton.style.width = "20px"; // Set a fixed width
  // closeButton.style.display = "none";
  // closeButton.style.alignItems = "center";
  // closeButton.style.justifyContent = "center";
  // closeButton.style.cursor = "pointer";
  // closeButton.style.zIndex = "10001";
  // closeButton.style.fontSize = "23px"; // Adjust size of the ">" symbol
  // closeButton.style.color = "#333"; // Change color of the ">" symbol

  // closeButton.style.transition = "background-color 0.3s";
  // closeButton.addEventListener("mouseover", () => {
  //   closeButton.style.backgroundColor = "#f0f0f0";
  // });
  // closeButton.addEventListener("mouseout", () => {
  //   closeButton.style.backgroundColor = "white";
  // });

  // Create an iframe inside the sidebar
  const iframe = document.createElement("iframe");

  // iframe.src = "https://heytalia.vercel.app/"; // Replace with app url
  iframe.src = "http://localhost:3000/"; // Replace with app url
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  // Append elements
  // sidebar.appendChild(closeButton);
  sidebar.appendChild(iframe);
  document.body.appendChild(sidebar);

  // Function to toggle sidebar visibility
  function toggleSidebar() {
    // For PG Sticky Footer to avoid overlap
    const footer = document.getElementById("save-as-draft-sticky-bar");
    if (footer) {
      if (document.getElementById("heytalia-sidebar")) {
        footer.style.width = "67vw";
      } else {
        footer.style.width = "100%";
      }
    }

    if (sidebar.style.transform === "translateX(0%)") {
      sidebar.style.transform = "translateX(100%)";

      document.body.style.width = originalBodyWidth; // Restore original width
      document.body.style.marginRight = "0"; // Reset margin

      closeButton.style.display = "none";

      if (footer) {
        footer.style.width = "100%";
      }
    } else {
      sidebar.style.transform = "translateX(0%)";
      document.body.style.width = "67vw"; // Shrink page width (100% - 33vw)
      document.body.style.marginRight = "33vw"; // Shift content left
      closeButton.style.display = "flex";

      if (footer) {
        footer.style.width = "67vw";
      }
    }
  }

  // Listen for the message from web app (via window.parent.postMessage)
  window.addEventListener("message", (event) => {
    if (event.data.type === "SCAN_FORM_ELEMENTS") {
      console.log("🟢 Extension: Scanning Form");
      if (iframe) {
        iframe.contentWindow.postMessage(
          { type: "SCANNED_FORM_ELEMENTS", data: scanFormElements() },
          "*"
        );
      }
    } else if (event.data.type === "PRE_FILL") {
      console.log("Pre Fill Data");
      const data = JSON.parse(event.data.data);
      const keys = Object.keys(data);

      console.log("data: ", data);
      console.log("keys: ", keys);
      fillForm(data);
    }
  });

  // Listen for messages from `background.js` to open sidebar
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggleSidebar") {
      toggleSidebar();
    }
  });

  // Close sidebar on button click
  // closeButton.addEventListener("click", toggleSidebar);
})();

// ==================================================
// Scan Form Fields
// ==================================================

function scanFormElements() {
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
      type: "radio-group",
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

  console.log("FormFields: ", elementsInfo);

  // return JSON.stringify(elementsInfo, null, 2);
  return JSON.stringify(elementsInfo, replacer(), 2);
}

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
  Object.entries(formData).forEach(([key, field]) => {
    const element = document.getElementById(key);
    if (!element) {
      console.warn(`Element with id ${key} not found`);
      return;
    }

    handleGenericField(element, field);
  });
}

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

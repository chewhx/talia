(() => {
  // Prevent multiple injections
  if (document.getElementById("heytalia-sidebar")) return;

  let tabID = null;
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

  // Close sidebar on button click
  // closeButton.addEventListener("click", toggleSidebar);

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

      // closeButton.style.display = "none";

      if (footer) {
        footer.style.width = "100%";
      }
    } else {
      sidebar.style.transform = "translateX(0%)";
      document.body.style.width = "67vw"; // Shrink page width (100% - 33vw)
      document.body.style.marginRight = "33vw"; // Shift content left
      // closeButton.style.display = "flex";

      if (footer) {
        footer.style.width = "67vw";
      }
    }
  }

  // Listen for messages from `background.js` to open sidebar
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggleSidebar") {
      tabID = request?.tabID;
      toggleSidebar();
    }

    if (request.action === "PG_UNAUTHORIZED") {
      console.log("🟢 Extension: PG_UNAUTHORIZED");
      if (iframe) {
        iframe.contentWindow.postMessage(
          { action: "PG_UNAUTHORIZED" },
          "http://localhost:3000"
        );
      }
    }
  });

  if (!window.hasContentScriptListener) {
    window.hasContentScriptListener = true;

    window.addEventListener("message", (event) => {
      const { origin, data } = event;

      // Check origin for security purposes
      if (
        origin !== "http://localhost:3000" &&
        origin !== "http://localhost:8082"
      ) {
        return;
      }

      // Handle message from heytalia
      if (origin === "http://localhost:3000") {
        switch (data.action) {
          case "SCAN_FORM_REQUEST": {
            console.log("🟢 Extension: SCAN_FORM_REQUEST");
            if (iframe) {
              iframe.contentWindow.postMessage(
                { action: "SCAN_FORM_RESPONSE", result: scanFormElements() },
                "http://localhost:3000"
              );
            }
            break;
          }

          case "PRE_FILL_REQUEST": {
            console.log("🟢 Extension: PRE_FILL_REQUEST");
            const formData = JSON.parse(data.data);
            console.log("🟢 Extension: ", formData);
            fillForm(formData);
            break;
          }

          case "PG_DRAFT_REQUEST": {
            console.log("🟢 Extension: PG_DRAFT_REQUEST");
            window.postMessage(data, "http://localhost:8082/");
            break;
          }

          case "GO_DRAFT_PAGE": {
            console.log("🟢 Extension: GO_DRAFT_PAGE");
            chrome.runtime.sendMessage({
              action: data.action,
              draftID: data.draftID,
            });

            break;
          }
        }
      }

      // Handle message from active tab website
      if (origin === "http://localhost:8082") {
        switch (data.action) {
          case "PG_DRAFT_RESPONSE": {
            console.log("🟢 Extension: PG_DRAFT_RESPONSE");
            iframe.contentWindow.postMessage(data, "http://localhost:3000/");
            break;
          }

          case "PG_UNAUTHORIZED": {
            console.log("🟢 Extension: PG_UNAUTHORIZED");
            window.postMessage(data, "http://localhost:3000/");
            break;
          }
        }
      }
    });
  }
})();

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

// ==================================================
// Navigate to specific page
// ==================================================
function isLoggedIn() {
  // Define common login button selectors
  const loginSelectors = [
    "button:contains('Login')",
    "button:contains('Sign In')",
    "a:contains('Login')",
    "a:contains('Sign In')",
    "[id*='login']",
    "[class*='login']",
  ];

  // Check if a login button exists
  let loginButton = loginSelectors.some((selector) =>
    document.querySelector(selector)
  );

  // Get current URL
  let currentUrl = window.location.href;

  // Determine login status
  if (loginButton) {
    console.log("User is NOT logged in. URL:", currentUrl);
    return { loggedIn: false, url: currentUrl };
  } else {
    console.log("User is logged in. URL:", currentUrl);
    return { loggedIn: true, url: currentUrl };
  }
}

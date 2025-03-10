async function scanClassroom() {
  if (!isClassroomModalOpen) {
    console.log("Should open moadl");
    openClassroomCreateAnnouncementModal();
  }

  return {
    placeholder: "Announce something to your class",
    category: "title",
    element: "input",
  };
}

async function fillGoogleClassroom(
  title = "Demo purpose" // Can be richtext
) {
  // // if (!isClassroomModalOpen) {
  openClassroomCreateAnnouncementModal();
  await waitForClassroomModal();
  // // }

  // Find the element with the matching aria-label
  const element = document.querySelector(
    `[aria-label="Announce something to your class"]`
  );

  // if (element) {
  //   // Clear existing content
  //   while (element.firstChild) {
  //     element.removeChild(element.firstChild);
  //   }

  //   // Create a new text node with the new value
  //   const textNode = document.createTextNode(title);

  //   // Append the new text node
  //   element.appendChild(textNode);

  //   // If the element is contenteditable, we need to ensure the cursor is at the end
  //   if (element.isContentEditable) {
  //     // Create a new range
  //     const range = document.createRange();
  //     const sel = window.getSelection();

  //     // Move the range's start and end to the end of the element
  //     range.setStart(element, element.childNodes.length);
  //     range.collapse(true);

  //     // Remove any existing selection, and add the new range
  //     sel.removeAllRanges();
  //     sel.addRange(range);
  //   }

  //   return { status: true };
  // } else {
  //   console.log(`Element with placeholder "${placeholder}" not found.`);
  // }

  if (element) {
    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    // Simulate manual text input with line breaks and spacing
    let formattedText = title;

    // Use `document.execCommand` to insert text as if the user typed it
    element.focus();

    // Create a policy to bypass TrustHTML on Google Classroom, which protects the 'element' from HTML injection

    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      try {
        // Try to create the policy only if it hasn't been created yet
        if (!window.trustedTypes.defaultPolicy) {
          window.trustedTypes.createPolicy("default", {
            createHTML: (input) => input,
          });
        }
        element.insertAdjacentHTML("beforeend", formattedText);
      } catch (error) {
        // Policy might already exist or there was an issue with creating it
        console.error(
          "Trusted Types policy could not be created or already exists:",
          error
        );
      }
    } else {
      console.warn("Trusted Types are not supported in this browser.");
    }

    // Alternative: Use InputEvent for modern browsers
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));

    return { status: true };
  } else {
    console.log(`Element with placeholder "${placeholder}" not found.`);
  }
}

function isClassroomModalOpen() {
  const modal = document.querySelector(`[aria-labelledby="vXqyh"]`);
  return !!modal;
}

function openClassroomCreateAnnouncementModal() {
  const element = document.querySelector(
    `[guidedhelpid="courseInlineCreatorGH"]`
  );
  element.click();
}

function waitForClassroomModal(maxAttempts = 20, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkModalandField = () => {
      attempts++;
      const modal = document.querySelector(`[aria-labelledby="vXqyh"]`);
      const placeholder = "Announce something to your class";
      const element = document.querySelector(`[aria-label="${placeholder}"]`);

      // Find the element with the matching aria-label

      if (modal || element) {
        resolve(element || modal);
      } else if (attempts >= maxAttempts) {
        resolve(null);
      } else {
        setTimeout(checkModalandField, interval);
      }
    };

    setTimeout(checkModalandField, interval);
  });
}

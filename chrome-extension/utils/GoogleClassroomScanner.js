async function scanClassroom() {
  if (!isClassroomModalOpen) {
    console.log("Should open moadl");
    openClassroomCreateAnnouncementModal();
    await waitForClassroomModal();
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
  const placeholder = "Announce something to your class"; // Hardcore placeholder
  // if (!isClassroomModalOpen) {
  openClassroomCreateAnnouncementModal();
  await waitForClassroomModal();
  // }

  // Find the element with the matching aria-label
  const element = document.querySelector(`[aria-label="${placeholder}"]`);

  if (element) {
    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    // Create a new text node with the new value
    const textNode = document.createTextNode(title);

    // Append the new text node
    element.appendChild(textNode);

    // If the element is contenteditable, we need to ensure the cursor is at the end
    if (element.isContentEditable) {
      // Create a new range
      const range = document.createRange();
      const sel = window.getSelection();

      // Move the range's start and end to the end of the element
      range.setStart(element, element.childNodes.length);
      range.collapse(true);

      // Remove any existing selection, and add the new range
      sel.removeAllRanges();
      sel.addRange(range);
    }

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

    const checkModal = () => {
      attempts++;
      const modal = document.querySelector(`[aria-labelledby="vXqyh"]`);
      if (modal) {
        resolve(modal);
      } else if (attempts >= maxAttempts) {
        reject(new Error("Modal did not open within the expected time"));
      } else {
        setTimeout(checkModal, interval);
      }
    };

    setTimeout(checkModal, interval);
  });
}

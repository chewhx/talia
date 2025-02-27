async function scanSLS() {
  if (!isSLSModalOpen()) {
    openSLSCreateAnnouncementModal();
    await waitForSLSModal();
  }

  return getSLSInputFields();
}

function waitForSLSModal(maxAttempts = 20, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkModal = () => {
      attempts++;
      const form = document.querySelector(".cv-form");
      if (form) {
        resolve(form);
      } else if (attempts >= maxAttempts) {
        reject(new Error("Modal did not open within the expected time"));
      } else {
        setTimeout(checkModal, interval);
      }
    };

    setTimeout(checkModal, interval);
  });
}

function getSLSInputFields() {
  const form = document.querySelector(".cv-form");
  const fields = [];

  if (!form) {
    throw new Error("Modal form not found even after waiting");
  }

  // Helper function to get relevant attributes
  const getRelevantAttributes = (element) => {
    const attrs = {
      id: element.id,
      class: element.className,
      type: element.type,
      name: element.name,
      placeholder: element.placeholder,
      "data-value": element.dataset.value,
      role: element.getAttribute("role"),
      "aria-label": element.getAttribute("aria-label"),
    };
    // Remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, v]) => v != null)
    );
  };

  // Function to process an element
  const processElement = (element, category) => {
    if (element) {
      const attributes = getRelevantAttributes(element);
      fields.push({
        category,
        element: element.tagName.toLowerCase(),
        attributes,
        id: attributes.id || `${category}-${fields.length}`, // Use id if available, otherwise generate a unique id
      });
    }
  };

  // Receiver section
  const receiverSection = form.querySelector(".field-group.sender-receiver");
  if (receiverSection) {
    processElement(
      receiverSection.querySelector(".student-group-filter"),
      "receiver-filter"
    );
    processElement(
      receiverSection.querySelector(".bx--dropdown[data-value]"),
      "receiver-dropdown"
    );
  }

  // Add recipient button
  processElement(form.querySelector(".cv-button"), "add-recipient");

  // Title
  processElement(form.querySelector(".field-set.title input"), "title");

  // Start Date and Time
  const startDateSection = form.querySelector(".field-set.start-date");
  if (startDateSection) {
    processElement(
      startDateSection.querySelector('input[type="text"]'),
      "startDate"
    );
    processElement(
      startDateSection.querySelector('input[type="time"]'),
      "startTime"
    );
  }

  const richTextEditorElement = form.querySelector(".rich-text-editor");
  if (richTextEditorElement) {
    const editorBody = richTextEditorElement.querySelector(".mce-content-body");
    const editorId = editorBody.id;
    fields.push({
      category: "message",
      element: "tinymce",
      attributes: { id: editorId },
      id: editorId, // Use the TinyMCE editor's id
    });
  }

  return fields;
}

async function fillSLS(formData) {
  if (!isSLSModalOpen()) {
    openSLSCreateAnnouncementModal();
    await waitForSLSModal();
  }

  if (!formData) {
    return false;
  }

  formData.forEach((data) => {
    if (!data || !data.id || !data.value) {
      return;
    }

    const { id, value } = data;
    const element = document.getElementById(id);

    if (element) {
      if (element.attributes.hasOwnProperty("contenteditable")) {
        // Check if tinymce is available
        if (typeof tinymce !== "undefined" && tinymce.get(id)) {
          const editor = tinymce.get(id);
          editor.setContent(value);
        } else {
          // Fallback method if tinymce is not available
          element.innerHTML = value;

          // If you need to trigger any events or updates, you can do it here
          // For example:
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else {
        element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else {
      console.error(`Field with id ${id} not found`);
    }
  });
}

// Usage
// const formFields = categorizeFormFields();

function isSLSModalOpen() {
  const modal = document.getElementsByClassName("announcement-editor");
  return !!modal[0];
}

function openSLSCreateAnnouncementModal() {
  const createAnnModal = document.getElementsByClassName("create-announcement");
  createAnnModal[0].click();
}

/* Field Format */
// [
//   {
//       "category": "receiver-filter",
//       "element": "div",
//       "attributes": {
//           "id": "",
//           "class": "cv-multi-select bx--multi-select__wrapper bx--list-box__wrapper bx--multi-select--filterable student-group-filter 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 multi-select-white"
//       },
//       "id": "receiver-filter-0"
//   },
//   {
//       "category": "add-recipient",
//       "element": "button",
//       "attributes": {
//           "id": "",
//           "class": "cv-button bx--btn bx--btn--tertiary bx--btn--field",
//           "type": "submit",
//           "name": "",
//           "role": "button"
//       },
//       "id": "add-recipient-1"
//   },
//   {
//       "category": "title",
//       "element": "input",
//       "attributes": {
//           "id": "uid-ad0ce357-6ce1-480b-b84c-66b96619fd5d",
//           "class": "bx--text-input",
//           "type": "text",
//           "name": "",
//           "placeholder": "Title"
//       },
//       "id": "uid-ad0ce357-6ce1-480b-b84c-66b96619fd5d"
//   },
//   {
//       "category": "start-date",
//       "element": "input",
//       "attributes": {
//           "id": "uid-c34972da-6053-46d7-a4d4-24e8d2b838ee-input-1",
//           "class": "bx--date-picker__input flatpickr-input",
//           "type": "text",
//           "name": "",
//           "placeholder": "dd MMM yyyy"
//       },
//       "id": "uid-c34972da-6053-46d7-a4d4-24e8d2b838ee-input-1"
//   },
//   {
//       "category": "start-time",
//       "element": "input",
//       "attributes": {
//           "id": "uid-af40f2c1-f788-49c5-a4d2-2f83c7edd0ce",
//           "class": "bx--text-input",
//           "type": "time",
//           "name": "",
//           "placeholder": ""
//       },
//       "id": "uid-af40f2c1-f788-49c5-a4d2-2f83c7edd0ce"
//   },
//   {
//       "category": "message",
//       "element": "tinymce",
//       "attributes": {
//           "id": "tiny-vue_45863134941740404593206"
//       },
//       "id": "tiny-vue_45863134941740404593206"
//   }
// ]

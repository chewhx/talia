function scanFormFields() {
  // Helper function to find associated label
  function findLabel(element) {
    // First try for explicit label
    let label =
      element.id && document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();

    // Check for wrapping label
    label = element.closest("label");
    if (label) {
      // Get text content excluding nested input text
      const clone = label.cloneNode(true);
      const inputs = clone.getElementsByTagName("input");
      for (let input of inputs) {
        input.remove();
      }
      return clone.textContent.trim();
    }

    // Check for aria-label
    if (element.getAttribute("aria-label")) {
      return element.getAttribute("aria-label");
    }

    // Check for placeholder as fallback
    if (element.placeholder) {
      return element.placeholder;
    }

    return "";
  }

  // Helper function to find fieldset legend
  function findFieldsetLegend(element) {
    const fieldset = element.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend) {
        return legend.textContent.trim();
      }
    }
    return "";
  }

  // Get all input elements, selects, and textareas
  const inputs = document.querySelectorAll("input, select, textarea");

  // Initialize groups object to store related fields
  const groups = {
    text: [],
    number: [],
    email: [],
    password: [],
    radio: {},
    checkbox: {},
    select: [],
    textarea: [],
    date: [],
    file: [],
    other: [],
  };

  // Process each input element
  inputs.forEach((input) => {
    // Get field context
    const fieldData = {
      // element: input,
      id: input.id,
      name: input.name,
      type: input.type || input.tagName.toLowerCase(),
      label: findLabel(input),
      required: input.required,
      value: input.value,
      disabled: input.disabled,
    };

    // Group by type
    switch (input.tagName.toLowerCase()) {
      case "select":
        fieldData.options = Array.from(input.options).map((opt) => ({
          value: opt.value,
          text: opt.text,
          selected: opt.selected,
        }));
        groups.select.push(fieldData);
        break;

      case "textarea":
        groups.textarea.push(fieldData);
        break;

      case "input":
        switch (input.type) {
          case "radio":
            const radioName = input.name || "unnamed";
            if (!groups.radio[radioName]) {
              groups.radio[radioName] = {
                name: radioName,
                label: findFieldsetLegend(input) || findLabel(input),
                options: [],
              };
            }
            groups.radio[radioName].options.push({
              value: input.value,
              label: findLabel(input),
              checked: input.checked,
            });
            break;

          case "checkbox":
            const checkboxName = input.name || "unnamed";
            if (!groups.checkbox[checkboxName]) {
              groups.checkbox[checkboxName] = {
                name: checkboxName,
                label: findFieldsetLegend(input) || findLabel(input),
                options: [],
              };
            }
            groups.checkbox[checkboxName].options.push({
              value: input.value,
              label: findLabel(input),
              checked: input.checked,
            });
            break;

          case "text":
          case "number":
          case "email":
          case "password":
          case "date":
          case "file":
            groups[input.type].push(fieldData);
            break;

          default:
            groups.other.push(fieldData);
        }
        break;
    }
  });

  return groups;
}

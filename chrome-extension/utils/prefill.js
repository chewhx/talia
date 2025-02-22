function fillFormFields(formData) {
  // Helper function to find an element by its attributes
  function findElement(attributes) {
    const selector = Object.entries(attributes)
      .map(([key, value]) => `[${key}="${value}"]`)
      .join("");
    return document.querySelector(selector);
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

  // For radio/checkbox
  function triggerClick(element) {
    if (element) element.click();
  }

  // Fill text inputs
  formData.text.forEach((field) => {
    const element = findElement({ id: field.id, name: field.name });
    if (element) {
      element.value = field.value;
      element.disabled = field.disabled;
      triggerChange(element);
    }
  });

  // Fill radio buttons
  Object.values(formData.radio).forEach((radioGroup) => {
    radioGroup.options.forEach((option) => {
      const element = findElement({
        name: radioGroup.name,
        value: option.value,
      });
      if (element) {
        element.checked = option.checked;
        triggerClick();
      }
    });
  });

  // Fill checkboxes
  Object.values(formData.checkbox).forEach((checkboxGroup) => {
    checkboxGroup.options.forEach((option) => {
      const element = findElement({
        name: checkboxGroup.name,
        value: option.value,
      });
      if (element) {
        element.checked = option.checked;
        triggerClick();
      }
    });
  });

  // Fill select fields
  formData.select.forEach((field) => {
    const element = findElement({ id: field.id, name: field.name });
    if (element) {
      element.value = field.value;
      element.disabled = field.disabled;
      triggerChange();
    }
  });

  // Fill textarea
  formData.textarea.forEach((field) => {
    const element = findElement({ id: field.id, name: field.name });
    if (element) {
      element.value = field.value;
      element.disabled = field.disabled;
      triggerChange();
    }
  });

  // Fill other fields (e.g., tel)
  formData.other.forEach((field) => {
    const element = findElement({ id: field.id, name: field.name });
    if (element) {
      element.value = field.value;
      element.disabled = field.disabled;
      triggerChange();
    }
  });
}

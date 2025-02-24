function fillGoogleClassroom(
  placeholder = "Announce something to your class", // Fixed placeholder
  newValue = "Demo purpose" // Can be richtext
) {
  // Find the element with the matching aria-label
  const element = document.querySelector(`[aria-label="${placeholder}"]`);

  if (element) {
    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    // Create a new text node with the new value
    const textNode = document.createTextNode(newValue);

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

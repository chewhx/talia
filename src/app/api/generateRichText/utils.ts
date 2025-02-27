import { generateJSON } from "@tiptap/html";
import { Extensions, Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";

const CustomTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) =>
              element.style.textAlign || this.options.defaultAlignment,
            renderHTML: (attributes) => {
              if (attributes.textAlign === this.options.defaultAlignment) {
                return {};
              }

              return { class: `text-align-${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

// Import your existing getSupportedExtensions function or use this one
export const getSupportedExtensions = (placeholder?: string): Extensions => {
  const supportedExtension = [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    Underline,
    CustomTextAlign.configure({
      types: ["paragraph", "orderedList", "bulletList"],
    }),
    ListItem,
    OrderedList,
    BulletList,
    CharacterCount,
    History,
  ];
  if (placeholder) {
    supportedExtension.push(
      Placeholder.configure({
        placeholder: placeholder,
      }) as Extension
    );
  }
  return supportedExtension;
};

/**
 * Parse HTML or plain text to Tiptap JSON using your custom extensions
 * @param content HTML or plain text content
 * @param isHTML Whether the content is HTML
 * @param placeholder Optional placeholder for the Placeholder extension
 * @returns Tiptap compatible JSON document
 */
export function parseToTiptap(
  content: string,
  isHTML = false,
  placeholder?: string
): any {
  if (!content) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  try {
    // Use the same extensions as your editor
    const extensions = getSupportedExtensions(placeholder);

    if (isHTML) {
      // Parse HTML directly
      return generateJSON(content, extensions);
    } else {
      // Convert plain text to HTML first
      const paragraphs = content.split("\n\n");
      const htmlContent = paragraphs
        .map((para) => {
          // Replace single newlines with <br> tags
          const withLineBreaks = para.replace(/\n/g, "<br>");
          return `<p>${withLineBreaks}</p>`;
        })
        .join("");

      // Parse the HTML to JSON
      return generateJSON(htmlContent, extensions);
    }
  } catch (error) {
    console.error("Error parsing content to Tiptap:", error);
    // Return a valid empty document if parsing fails
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
}

/**
 * Example usage:
 *
 * // Parse HTML
 * const htmlContent = '<p>This is <strong>bold</strong> text</p>';
 * const tiptapJSON = parseToTiptap(htmlContent, true);
 *
 * // Parse plain text
 * const plainText = 'Hello\nWorld\n\nNew paragraph';
 * const tiptapJSON = parseToTiptap(plainText);
 *
 * // Use with editor
 * editor.commands.setContent(tiptapJSON);
 */

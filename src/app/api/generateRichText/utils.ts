import { Extension, Extensions } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
import Document from "@tiptap/extension-document";
import History from "@tiptap/extension-history";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { generateJSON } from "@tiptap/html";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// // Simplified conversion function
// export function convertTextToTipTapContent(
//   text: string,
//   extensions: Extensions
// ): string {
//   // Step 1: Preprocess the text
//   const processedText = text
//     // Replace double newlines with paragraph breaks
//     .replace(/\n\n/g, "</p><p>")
//     // Convert single newlines to <br>
//     .replace(/\n/g, "<br>")
//     // Convert markdown-style bold
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//     // Wrap in paragraph tags if not already wrapped
//     .split("</p><p>")
//     .map((para) => `<p>${para}</p>`)
//     .join("");

//   // Step 2: Wrap in a document structure
//   const htmlContent = `<div>${processedText}</div>`;

//   return htmlContent;
// }

// // Example usage function
// export function prepareContentForTipTap(
//   originalText: string,
//   supportedExtensions: Extensions
// ) {
//   try {
//     // Convert text to HTML
//     const htmlContent = convertTextToTipTapContent(
//       originalText,
//       supportedExtensions
//     );

//     // Use TipTap's generateHTML to ensure compatibility
//     const generatedContent = generateHTML(
//       {
//         type: "doc",
//         content: [
//           {
//             type: "paragraph",
//             content: [{ type: "text", text: originalText }],
//           },
//         ],
//       },
//       supportedExtensions
//     );

//     return htmlContent;
//   } catch (error) {
//     console.error("Error preparing content:", error);
//     return "";
//   }
// }

export function convertTextToTipTapContent(
  text: string,
  extensions: Extensions
): string {
  // Preprocess the text
  const processedText = text
    // Replace double newlines with paragraph breaks
    .replace(/\n\n/g, "</p><p>")
    // Convert single newlines to <br>
    .replace(/\n/g, "<br>")
    // Convert markdown-style bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Wrap in paragraph tags if not already wrapped
    .split("</p><p>")
    .map((para) => `<p>${para}</p>`)
    .join("");

  return processedText;
}

// Prepare content for TipTap editor
export function prepareContentForTipTap(
  originalText: string,
  supportedExtensions: Extensions
) {
  try {
    // Convert text to HTML
    const htmlContent = convertTextToTipTapContent(
      originalText,
      supportedExtensions
    );

    return htmlContent;
  } catch (error) {
    console.error("Error preparing content:", error);
    return "";
  }
}

////////////////////////////////////////////////////////
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
      const preservedContent = content.replace(/\n/g, "<br/>");
      // const preprocessHTML = (html: string) => {
      //   // Split by double newlines to ensure paragraph separation
      //   const paragraphs = html.split(/\n\n/).map((p) => p.trim());

      //   // Wrap each part with <p> tags, even empty ones
      //   return paragraphs.map((p) => (p ? `<p>${p}</p>` : `<p></p>`)).join("");
      // };
      return generateJSON(preservedContent, extensions);

      // const processedMessages = `<p>${content.replace(/\n\n/g, "</p><p>")}</p>`;

      // const editor = new Editor({
      //   extensions: [StarterKit],
      //   content: content,
      // });

      // const json = editor.getJSON();
      // console.log({ json });
      // return json;
    } else {
      // Improved plain text to HTML conversion
      const paragraphs = content.split(/\n\n+/);
      const htmlContent = paragraphs
        .map((paragraph) => {
          const withLineBreaks = paragraph.replace(/\n/g, "<br>");
          return `<p>${withLineBreaks}</p>`;
        })
        .join("\n");

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

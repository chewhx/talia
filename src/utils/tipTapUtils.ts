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

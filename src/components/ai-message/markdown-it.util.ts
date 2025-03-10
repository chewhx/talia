import MarkdownIt from "markdown-it";

// Plugin to convert '\n' line breaks into empty paragraphs
function lineBreakToEmptyParagraph(md: MarkdownIt) {
  md.core.ruler.push("line_break_to_empty_paragraph", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Process only block tokens that contain text (inline tokens)
      if (token.type === "inline") {
        const children = token.children || [];
        const newChildren = [];

        for (let j = 0; j < children.length; j++) {
          const childToken = children[j];

          if (childToken.type === "text") {
            // Split the text token content by '\n' line breaks
            const parts = childToken.content.split("\n");

            // Add each part as a text token, followed by an empty paragraph
            parts.forEach((part, index) => {
              if (part) {
                // Create a new text token for non-empty parts
                const textToken = new state.Token("text", "", 0);
                textToken.content = part;
                newChildren.push(textToken);
              }

              // After each line break, insert an empty paragraph
              if (index < parts.length - 1) {
                const emptyParagraphToken = new state.Token(
                  "html_inline",
                  "",
                  0
                );
                emptyParagraphToken.content = "<p></p>";
                newChildren.push(emptyParagraphToken);
              }
            });
          } else {
            newChildren.push(childToken);
          }
        }

        token.children = newChildren;
      }
    }
  });
}

// Initialize markdown-it and use the plugin
const md = new MarkdownIt({ breaks: true, html: true, typographer: true });

export { md };

type TiptapNode = Record<string, any>;

export function removeEmptyListItems(doc: TiptapNode): TiptapNode {
  // Recursively filter out empty listItems
  const filterEmptyParagraphs = (nodes: TiptapNode[]): TiptapNode[] => {
    return nodes
      .map((node) => {
        // Recursively process child nodes if the node has content
        if (node.content) {
          node.content = filterEmptyParagraphs(node.content);
        }
        return node;
      })
      .filter((node) => {
        // Check for 'listItem' type with empty paragraph content
        if (node.type === "listItem" && node.content) {
          // Check if the only content is an empty paragraph
          const isEmptyParagraph =
            node.content.length === 1 &&
            node.content[0].type === "paragraph" &&
            (!node.content[0].content || node.content[0].content.length === 0);
          return !isEmptyParagraph;
        }
        return true; // Keep other nodes
      });
  };

  // Process the document's content recursively
  if (doc.content) {
    doc.content = filterEmptyParagraphs(doc.content);
  }

  return doc;
}

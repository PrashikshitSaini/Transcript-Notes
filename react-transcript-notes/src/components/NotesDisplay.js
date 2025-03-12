import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const NotesDisplay = ({ notes }) => {
  // Check for empty notes or placeholder messages
  const hasContent =
    notes &&
    !notes.includes("No speech detected") &&
    !notes.includes("No transcript provided");

  return (
    <div className="notes-display">
      <h3>Generated Notes:</h3>
      <div className="notes-area markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          children={notes}
          components={{
            // Enhanced heading styling
            h1: ({ node, ...props }) => (
              <h1
                style={{
                  color: "#0366d6",
                  borderBottom: "2px solid #0366d6",
                  paddingBottom: "8px",
                  marginBottom: "20px",
                }}
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                style={{
                  color: "#2188ff",
                  borderBottom: "1px solid #e1e4e8",
                  paddingBottom: "6px",
                }}
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                style={{
                  color: "#0366d6",
                  fontWeight: "600",
                }}
                {...props}
              />
            ),
            // Enhanced list styling
            ul: ({ node, ...props }) => (
              <ul
                style={{
                  listStyleType: "disc",
                  paddingLeft: "20px",
                }}
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                style={{
                  listStyleType: "decimal",
                  paddingLeft: "20px",
                }}
                {...props}
              />
            ),
            li: ({ node, children, ...props }) => (
              <li
                style={{
                  marginBottom: "8px",
                  lineHeight: "1.6",
                  color: "#e0e0e0", // Improved contrast for list items
                }}
                {...props}
              >
                {children}
              </li>
            ),
            // Enhanced blockquote
            blockquote: ({ node, ...props }) => (
              <blockquote
                style={{
                  borderLeft: "4px solid #0366d6",
                  paddingLeft: "16px",
                  color: "#e0e0e0", // Improved contrast for blockquotes
                  fontStyle: "italic",
                  backgroundColor: "rgba(3, 102, 214, 0.1)",
                  padding: "10px 15px",
                  borderRadius: "0 4px 4px 0",
                }}
                {...props}
              />
            ),
            // Emphasized styling
            em: ({ node, ...props }) => (
              <em
                style={{
                  fontStyle: "italic",
                  color: "#e0e0e0", // Improved contrast for italic text
                }}
                {...props}
              />
            ),
            // Bold styling
            strong: ({ node, ...props }) => (
              <strong
                style={{
                  fontWeight: "bold",
                  color: "#ffffff", // Improved contrast for bold text
                  backgroundColor: "rgba(110, 86, 207, 0.2)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                }}
                {...props}
              />
            ),
            // Enhanced link styling
            a: ({ node, ...props }) => (
              <a
                style={{
                  color: "#58a6ff", // Brighter blue for better visibility
                  textDecoration: "none",
                  borderBottom: "1px dotted #58a6ff",
                }}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            // Enhanced code styling
            code: ({ inline, ...props }) =>
              inline ? (
                <code
                  style={{
                    backgroundColor: "rgba(110, 86, 207, 0.2)",
                    padding: "2px 4px",
                    borderRadius: "3px",
                    fontSize: "85%",
                    color: "#e0e0e0", // Improved contrast for inline code
                    fontFamily:
                      "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
                  }}
                  {...props}
                />
              ) : (
                <code
                  style={{
                    display: "block",
                    padding: "16px",
                    overflow: "auto",
                    fontSize: "85%",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    color: "#e0e0e0", // Improved contrast for code blocks
                    borderRadius: "6px",
                    border: "1px solid #333",
                  }}
                  {...props}
                />
              ),
            // Add specific styling for paragraphs to ensure high contrast
            p: ({ node, ...props }) => (
              <p
                style={{
                  color: "#e0e0e0", // Bright text for high contrast
                  marginBottom: "1rem",
                  lineHeight: "1.6",
                }}
                {...props}
              />
            ),
          }}
        />
      </div>
      <details>
        <summary>View Raw Markdown</summary>
        <textarea
          className="raw-markdown"
          value={notes}
          readOnly
          placeholder="Notes will appear here after transcription and processing."
        />
      </details>
    </div>
  );
};

export default NotesDisplay;

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const NotesDisplay = ({ notes }) => {
  // Check if notes is empty or contains the "no speech detected" message
  const isEmptyOrNoSpeech =
    !notes ||
    notes.includes("No speech detected") ||
    notes.includes("No transcript provided");

  // Enhanced empty state display
  const emptyStateContent = `
# Waiting for Your Voice

## Ready to Generate Notes
This tool transforms your speech or audio files into well-organized notes.

### How to Get Started
1. **Use the microphone** to record your voice
2. **Upload an audio file** from your device
3. **Wait for processing** to complete

> Your transcribed notes will appear here in a beautifully formatted style.

![Microphone Icon](https://img.icons8.com/color/96/000000/microphone.png)

*Speak clearly and at a normal pace for best results.*
  `;

  return (
    <div className="notes-display">
      <h3>Generated Notes:</h3>
      <div className="notes-area markdown-content">
        {isEmptyOrNoSpeech ? (
          <div className="empty-state">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              children={emptyStateContent}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    style={{ color: "#0366d6", textAlign: "center" }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2 style={{ color: "#0366d6" }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ color: "#2f80ed" }} {...props} />
                ),
                img: ({ node, ...props }) => (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <img {...props} alt="Microphone" />
                  </div>
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: "4px solid #0366d6",
                      background: "#f1f8ff",
                    }}
                    {...props}
                  />
                ),
                // ...other component styling...
              }}
            />
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            children={notes}
            components={{
              // Customize heading elements
              h1: ({ node, ...props }) => (
                <h1 style={{ color: "#0366d6" }} {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 style={{ color: "#0366d6" }} {...props} />
              ),
              // Customize links
              a: ({ node, ...props }) => (
                <a
                  style={{ color: "#0366d6", textDecoration: "none" }}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              // Customize emphasis
              em: ({ node, ...props }) => (
                <em
                  style={{ fontStyle: "italic", color: "#24292e" }}
                  {...props}
                />
              ),
              // Customize strong
              strong: ({ node, ...props }) => (
                <strong
                  style={{ fontWeight: "bold", color: "#24292e" }}
                  {...props}
                />
              ),
              // Enhance blockquotes
              blockquote: ({ node, ...props }) => (
                <blockquote
                  style={{
                    borderLeft: "4px solid #0366d6",
                    background: "#f1f8ff",
                    padding: "10px 15px",
                  }}
                  {...props}
                />
              ),
              // Make lists more attractive
              ul: ({ node, ...props }) => (
                <ul
                  style={{ listStyleType: "disc", color: "#24292e" }}
                  {...props}
                />
              ),
              // Enhance code blocks
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code
                    style={{
                      background: "#f0f0f0",
                      padding: "2px 4px",
                      borderRadius: "3px",
                    }}
                    {...props}
                  />
                ) : (
                  <code
                    style={{
                      display: "block",
                      background: "#f6f8fa",
                      padding: "16px",
                      borderRadius: "6px",
                      overflowX: "auto",
                    }}
                    {...props}
                  />
                ),
            }}
          />
        )}
      </div>
      <details>
        <summary>View Raw Markdown</summary>
        <textarea
          className="raw-markdown"
          value={notes || emptyStateContent}
          readOnly
          placeholder="Notes will appear here after transcription and processing."
        />
      </details>
    </div>
  );
};

export default NotesDisplay;

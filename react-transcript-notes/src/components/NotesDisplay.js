import React from "react";
import ReactMarkdown from "react-markdown";

const NotesDisplay = ({ notes }) => {
  return (
    <div className="notes-display">
      <h3>Generated Notes:</h3>
      <div className="notes-area markdown-content">
        <ReactMarkdown>{notes}</ReactMarkdown>
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

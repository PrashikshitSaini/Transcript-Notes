const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure storage for temporarily storing audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Simple endpoint for audio files - since transcription will happen client-side
app.post("/api/upload-audio", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const filePath = req.file.path;

    // Return file path for client to access if needed
    res.json({
      success: true,
      filename: req.file.filename,
      message:
        "File uploaded successfully. Process the transcription in the browser.",
    });

    // Optional: Clean up file after some time
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error removing temporary file:", err);
      }
    }, 300000); // Remove after 5 minutes
  } catch (error) {
    console.error("Error handling audio upload:", error);
    res
      .status(500)
      .json({ error: "Error handling audio upload", message: error.message });
  }
});

// API endpoint for generating notes with Gemini API
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "No transcript provided" });
    }

    const GEMINI_API_KEY = process.env.API_KEY;

    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "API_KEY is not configured on the server" });
    }

    // Modified prompt to specifically request Markdown formatting
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate comprehensive, well-organized notes from this transcript. 
                Format the response in proper Markdown syntax with:
                - Headers and subheaders (# and ##) for main topics and subtopics
                - Bullet points (- or *) for lists
                - **Bold** for important terms or concepts
                - *Italics* for emphasis
                - > Blockquotes for significant quotes or statements
                - Proper spacing between sections
                
                Here is the transcript: ${transcript}`,
              },
            ],
          },
        ],
      }
    );

    // Extract the response text
    const notes =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Could not generate notes. The API response format was unexpected.";

    res.json({ notes });
  } catch (error) {
    console.error("Error generating notes:", error);
    res.status(500).json({
      error: "Error generating notes",
      message: error.response?.data?.error?.message || error.message,
    });
  }
});

// Serve React static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "react-transcript-notes/build")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "react-transcript-notes/build", "index.html")
    );
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Audio transcription will be handled in the browser using Web Speech API`
  );
});

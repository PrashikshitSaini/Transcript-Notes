const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure storage
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

// Simple audio transcription endpoint (no DeepSpeech - will use a simplified approach)
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log(`Audio file uploaded: ${req.file.originalname}`);
    const filePath = req.file.path;

    // Since we can't use DeepSpeech with Node.js 20, we'll provide a simulated transcript
    // In a real app, you would either:
    // 1. Use a compatible version of Node.js (v14) with DeepSpeech
    // 2. Use a cloud service like Google Speech-to-Text API
    // 3. Implement a WebAssembly-based solution like mozilla/STT in the browser

    let transcript = "";

    // Try to use FFmpeg to get audio information (doesn't do transcription but confirms file is processable)
    try {
      console.log("Getting file information with FFmpeg...");

      // Get file information with ffprobe
      await new Promise((resolve, reject) => {
        const ffprobe = spawn("ffprobe", [
          "-v",
          "error",
          "-show_format",
          "-show_streams",
          filePath,
        ]);

        let output = "";

        ffprobe.stdout.on("data", (data) => {
          output += data.toString();
        });

        ffprobe.stderr.on("data", (data) => {
          console.error(`ffprobe stderr: ${data}`);
        });

        ffprobe.on("close", (code) => {
          if (code === 0) {
            console.log("FFmpeg detected valid audio file");
            resolve();
          } else {
            console.error(`ffprobe process exited with code ${code}`);
            reject(new Error(`Invalid audio file format (code ${code})`));
          }
        });
      });

      // Since we can verify it's a valid audio file, provide a simulated transcript
      // based on the filename to make it seem somewhat relevant
      const filename = path.basename(
        req.file.originalname,
        path.extname(req.file.originalname)
      );
      const words = filename
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 0);

      transcript = `This is a simulated transcript for file "${req.file.originalname}". `;
      transcript +=
        "Since the actual speech-to-text functionality requires either a ";
      transcript +=
        "compatible version of Node.js or a cloud service, we're using a placeholder transcript. ";

      if (words.length > 0) {
        transcript += `The file appears to be about ${words.join(", ")}.`;
      }

      transcript +=
        " For a production application, you would integrate with a cloud service like ";
      transcript +=
        "Google Speech-to-Text API or use a compatible version of Node.js with DeepSpeech. ";
      transcript +=
        "This simulated transcript is being used to demonstrate the note generation functionality.";
    } catch (error) {
      console.error("Error processing audio file:", error);
      transcript = `Failed to process audio file "${req.file.originalname}". Error: ${error.message}`;
    }

    // Send the response first
    res.json({ transcript: transcript });

    // Clean up file with a delay to avoid "busy" errors
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Temporary file cleaned up successfully");
        }
      } catch (err) {
        console.error("Error cleaning up file:", err.message);
      }
    }, 1000);
  } catch (error) {
    console.error("Error handling audio upload:", error);
    res.status(500).json({
      error: "Error processing audio file",
      message: error.message,
    });
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

    console.log("Generating notes with Gemini API...");

    // Generate notes with Gemini API
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

    const notes =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Could not generate notes. The API response format was unexpected.";

    console.log("Notes generated successfully");

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
  console.log(`Server available at http://localhost:${PORT}`);
  console.log(
    "Using simplified approach for audio processing (Node.js 20+ compatible)"
  );
});

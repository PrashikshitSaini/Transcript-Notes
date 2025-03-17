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

    // NEW: Use DeepSeek if configured
    if (process.env.USE_DEEPSEEK === "true") {
      const { spawn } = require("child_process");
      const path = require("path");
      const pyScript = path.join(__dirname, "deepseek_notes.py");

      // Enhanced prompt for the Python script
      const enhancedTranscript = `Create visually engaging, well-structured notes from this transcript:

${transcript}

Use varied Markdown formatting:
- Create a prominent main title with # and subtitles with ## and ###
- Use *italic* for emphasis and definitions
- Highlight key terms with **bold**
- Create bullet lists with - for main points
- Use numbered lists (1., 2.) for sequential information or steps
- Create > blockquotes for important quotes or statements
- Use dividers (---) to separate major sections
- Include code blocks for technical content if relevant
- Use tables for comparing information when appropriate`;

      // FIX: Properly pass environment variables to the Python process
      console.log("Spawning DeepSeek Python process with API key...");
      const pyProcess = spawn("python", [pyScript, enhancedTranscript], {
        env: {
          ...process.env,
          // Explicitly pass the DeepSeek API key to the child process
          REACT_APP_DEEPSEEK_API_KEY: process.env.REACT_APP_DEEPSEEK_API_KEY,
        },
      });

      let notes = "";
      let errorOutput = "";

      pyProcess.stdout.on("data", (data) => {
        notes += data.toString();
      });

      pyProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
        // Log error output for debugging
        console.error(`Python error output: ${data.toString()}`);
      });

      return pyProcess.on("close", (code) => {
        if (code === 0) {
          console.log("DeepSeek notes generation completed successfully");
          return res.json({ notes });
        } else {
          console.error(`DeepSeek process failed with code ${code}`);
          return res.status(500).json({
            error: "DeepSeek notes generation failed",
            message: errorOutput || "Unknown Python process error",
          });
        }
      });
    }

    const GEMINI_API_KEY = process.env.API_KEY;

    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "API_KEY is not configured on the server" });
    }

    console.log("Generating notes with Gemini API...");

    // Generate notes with Gemini API - Enhanced prompt
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Create visually engaging, well-structured notes from this transcript.

Use varied Markdown formatting:
- Create a prominent main title with # and subtitles with ## and ###
- Use *italic* for emphasis and definitions
- Highlight key terms with **bold**
- Create bullet lists with - for main points
- Use numbered lists (1., 2.) for sequential information or steps
- Create > blockquotes for important quotes or statements
- Use dividers (---) to separate major sections
- Include code blocks with \`\`\` for technical content if relevant
- Use tables for comparing information when appropriate

Be sure to:
- Vary the formatting throughout (don't just use bullets for everything)
- Create a logical structure with clear sections
- Highlight 3-5 key concepts with bold text 
- Use blockquotes for direct quotes from the transcript
- Keep the notes concise but comprehensive

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

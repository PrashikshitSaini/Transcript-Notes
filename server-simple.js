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

// Check if FFmpeg is installed
let ffmpegAvailable = false;
try {
  const result = require("child_process").spawnSync("ffmpeg", ["-version"]);
  ffmpegAvailable = result.status === 0;
  console.log(ffmpegAvailable ? "FFmpeg detected ✓" : "FFmpeg not found ⚠️");
} catch (err) {
  console.log("FFmpeg not found ⚠️");
}

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

// Simple audio transcription endpoint - NO DEPENDENCIES ON DEEPSPEECH OR FFMPEG
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log(`Audio file uploaded: ${req.file.originalname}`);
    const filePath = req.file.path;

    // Generate a transcript (simplified approach that doesn't require FFmpeg)
    let transcript = "";
    let duration = "unknown duration";
    let fileInfo = {};

    // If FFmpeg is available, try to get file information
    if (ffmpegAvailable) {
      try {
        console.log("Getting audio info with FFmpeg...");

        const ffprobeResult = await new Promise((resolve, reject) => {
          const ffprobe = spawn("ffprobe", [
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-print_format",
            "json",
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
              try {
                const info = JSON.parse(output);
                resolve(info);
              } catch (e) {
                reject(
                  new Error(`Could not parse FFmpeg output: ${e.message}`)
                );
              }
            } else {
              reject(new Error(`ffprobe exited with code ${code}`));
            }
          });

          // Handle spawn error (e.g. ffprobe not found)
          ffprobe.on("error", (err) => {
            console.error("FFprobe spawn error:", err);
            reject(new Error(`Error executing ffprobe: ${err.message}`));
          });
        });

        fileInfo = ffprobeResult;

        // Get audio duration if available
        if (ffprobeResult.format && ffprobeResult.format.duration) {
          const seconds = parseFloat(ffprobeResult.format.duration);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.round(seconds % 60);
          duration = `${minutes} minute${
            minutes !== 1 ? "s" : ""
          } and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
        }
      } catch (error) {
        console.error("Error getting audio info with FFmpeg:", error);
        // Continue without FFmpeg info
      }
    } else {
      console.log("FFmpeg not available, skipping audio analysis");
    }

    // Create a simulated transcript using file info
    const filename = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname)
    );
    const words = filename
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    transcript = `This is a simulated transcript for audio file "${req.file.originalname}" (${duration}). `;

    if (words.length > 0) {
      transcript += `The filename suggests this audio might be about: ${words.join(
        ", "
      )}. `;
    }

    transcript +=
      "The following is a sample transcript to demonstrate the functionality: ";
    transcript +=
      "In this recording, we discussed the implementation of speech recognition technologies ";
    transcript +=
      "and their applications in various domains. There are several methods for converting ";
    transcript +=
      "speech to text, including cloud-based APIs like Google Speech-to-Text, on-device ";
    transcript +=
      "solutions like Mozilla's DeepSpeech, and browser-based approaches using the Web Speech API. ";
    transcript +=
      "Each approach has its trade-offs in terms of accuracy, privacy, and cost. ";
    transcript +=
      "For production applications, a hybrid approach might be ideal, using browser-based ";
    transcript +=
      "recognition for live transcription and server-side processing for uploaded files.\n\n";

    // Add note about FFmpeg if it's not available
    if (!ffmpegAvailable) {
      transcript +=
        "\nNOTE: FFmpeg is not installed or not found in your PATH. ";
      transcript +=
        "With FFmpeg installed, more detailed audio analysis would be possible. ";
      transcript +=
        "For installation instructions, see: https://ffmpeg.org/download.html";
    }

    // Send the transcript response
    res.json({ transcript: transcript });

    // Clean up file after a small delay to avoid "busy" errors
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Temporary file cleaned up");
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
  console.log("Using simplified approach for audio processing");

  if (!ffmpegAvailable) {
    console.log("");
    console.log("⚠️  FFmpeg not found. For better audio analysis:");
    console.log("1. Install FFmpeg from https://ffmpeg.org/download.html");
    console.log("2. Make sure FFmpeg is in your system PATH");
    console.log("3. Restart this server after installation");
  }
});

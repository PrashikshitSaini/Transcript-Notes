const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { spawn } = require("child_process");
const vosk = require("vosk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Check if Vosk model exists
const modelPath = path.join(__dirname, "vosk-model-small-en-us-0.15");
const modelExists = fs.existsSync(modelPath);
console.log(
  modelExists
    ? "✓ Vosk model found"
    : "⚠️ Vosk model not found - please run download-vosk-model.js first"
);

// Set up Vosk recognizer if model exists
let recognizer;
if (modelExists) {
  try {
    vosk.setLogLevel(0); // Disable logs
    const model = new vosk.Model(modelPath);
    console.log("✓ Vosk model loaded successfully");

    // We'll create recognizer instances as needed for each file
  } catch (err) {
    console.error("❌ Error loading Vosk model:", err.message);
  }
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

// Audio transcription with Vosk
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log(`Audio file uploaded: ${req.file.originalname}`);
    const filePath = req.file.path;

    // Check if model exists
    if (!modelExists) {
      return res.status(503).json({
        error: "Vosk model not installed",
        transcript:
          "Transcription failed: Vosk model not found. Please run 'node download-vosk-model.js' first.",
      });
    }

    // Convert file to WAV format for Vosk using ffmpeg
    console.log("Converting file to WAV format...");
    const wavPath = `${filePath}.wav`;

    try {
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i",
          filePath,
          "-ar",
          "16000", // Sample rate
          "-ac",
          "1", // Mono
          "-f",
          "wav", // Format
          wavPath,
        ]);

        ffmpeg.stderr.on("data", (data) => {
          console.log(`ffmpeg: ${data}`);
        });

        ffmpeg.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}`));
        });

        ffmpeg.on("error", (err) => {
          reject(new Error(`Failed to run ffmpeg: ${err.message}`));
        });
      });

      console.log("File converted successfully");

      // Now transcribe with Vosk
      console.log("Transcribing with Vosk...");

      // Read the WAV file
      const buffer = fs.readFileSync(wavPath);

      // Process with vosk
      const model = new vosk.Model(modelPath);

      // Create recognizer
      const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });

      // Process in chunks
      const chunkSize = 4000; // Process 4000 bytes at a time
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        const isEnd = i + chunkSize >= buffer.length;

        rec.acceptWaveform(chunk);

        // Get partial results if needed
        // const partialResult = rec.partialResult();
        // console.log("Partial:", partialResult);
      }

      // Get final result
      const result = rec.finalResult();
      const transcript = result.text || "No speech detected in the audio file.";

      console.log("Transcription completed");

      // Clean up
      rec.free();
      model.free();

      // Clean up temporary files
      fs.unlinkSync(filePath);
      fs.unlinkSync(wavPath);

      // Return the transcript
      res.json({ transcript });
    } catch (error) {
      console.error("Error processing audio:", error);

      // Clean up any files if they exist
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      // Return error
      res.status(500).json({
        error: "Error processing audio file",
        message: error.message,
      });
    }
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

  if (!modelExists) {
    console.log("\n⚠️  Vosk model not found!");
    console.log("Please run: node download-vosk-model.js");
    console.log("Then restart the server");
  } else {
    console.log("Vosk is ready for audio file transcription");
  }

  console.log("Web Speech API used for live microphone transcription");
});

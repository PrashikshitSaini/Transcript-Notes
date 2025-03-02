const fs = require("fs");
const path = require("path");
const https = require("https");
const { createWriteStream } = require("fs");
const { extract } = require("node-stream-zip");

// Model URL - Using the small English model for faster download
const MODEL_URL =
  "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip";
const MODEL_DIR = path.join(__dirname, "vosk-model-small-en-us-0.15");
const ZIP_PATH = path.join(__dirname, "vosk-model.zip");

console.log("Vosk model downloader");
console.log("This will download and extract the Vosk small English model");
console.log("Model size: ~40MB");
console.log("--------------------------------------------------");

// Download the model
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}`);
    console.log(
      `This may take a few minutes depending on your internet speed...`
    );

    const file = createWriteStream(outputPath);
    let receivedBytes = 0;
    let totalBytes = 0;
    let lastLoggedPercent = 0;

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download, status code: ${response.statusCode}`)
          );
          return;
        }

        totalBytes = parseInt(response.headers["content-length"], 10);

        response.on("data", (chunk) => {
          receivedBytes += chunk.length;
          const percent = Math.floor((receivedBytes / totalBytes) * 100);

          // Log progress every 10%
          if (percent >= lastLoggedPercent + 10) {
            console.log(`Downloaded ${percent}%`);
            lastLoggedPercent = Math.floor(percent / 10) * 10;
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`Download completed: ${outputPath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Extract zip file
async function extractZip(zipPath, outputDir) {
  console.log(`Extracting ${zipPath} to ${outputDir}...`);

  // First check and create the output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use node-stream-zip for extraction
  const StreamZip = require("node-stream-zip");

  return new Promise((resolve, reject) => {
    const zip = new StreamZip.async({ file: zipPath });

    zip
      .extract(null, outputDir)
      .then(() => {
        console.log("Extraction complete");
        return zip.close();
      })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

// Main function
async function main() {
  try {
    // Check if model already exists
    if (fs.existsSync(MODEL_DIR) && fs.readdirSync(MODEL_DIR).length > 0) {
      console.log("Vosk model already exists. Skipping download.");
      return;
    }

    // Download the model
    await downloadFile(MODEL_URL, ZIP_PATH);

    // Extract the zip
    await extractZip(ZIP_PATH, __dirname);

    // Clean up the zip file
    fs.unlinkSync(ZIP_PATH);

    console.log("Vosk model installation complete!");
    console.log(`Model location: ${MODEL_DIR}`);
    console.log('\nYou can now start the server with "npm start"');
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();

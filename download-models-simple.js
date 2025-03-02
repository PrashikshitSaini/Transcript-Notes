const fs = require("fs");
const path = require("path");
const https = require("https");

function downloadFile(url, outputPath) {
  console.log(`Downloading ${url} to ${outputPath}...`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https
      .get(url, (response) => {
        // Check if response is successful
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        // Get the total size for progress reporting
        const totalSize = parseInt(response.headers["content-length"], 10);
        let downloadedSize = 0;
        let lastReportedPercent = 0;

        // Pipe the download to the file
        response.pipe(file);

        // Track progress
        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const percent = Math.round((downloadedSize / totalSize) * 100);

          // Report progress every 10%
          if (percent >= lastReportedPercent + 10) {
            lastReportedPercent = percent - (percent % 10);
            console.log(`Download progress: ${percent}%`);
          }
        });

        // Handle completion
        file.on("finish", () => {
          file.close();
          console.log(`Download complete: ${outputPath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {}); // Delete the file if there's an error
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

async function main() {
  try {
    const modelsDir = path.join(__dirname, "models");

    // Create models directory if it doesn't exist
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // Download model files
    const modelUrl =
      "https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm";
    const scorerUrl =
      "https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer";

    const modelPath = path.join(modelsDir, "deepspeech-0.9.3-models.pbmm");
    const scorerPath = path.join(modelsDir, "deepspeech-0.9.3-models.scorer");

    // Only download if files don't exist
    if (!fs.existsSync(modelPath)) {
      console.log(
        "Downloading DeepSpeech model file. This may take a while..."
      );
      await downloadFile(modelUrl, modelPath);
    } else {
      console.log(`Model file already exists: ${modelPath}`);
    }

    if (!fs.existsSync(scorerPath)) {
      console.log(
        "Downloading DeepSpeech scorer file. This may take a while..."
      );
      await downloadFile(scorerUrl, scorerPath);
    } else {
      console.log(`Scorer file already exists: ${scorerPath}`);
    }

    console.log("All models downloaded successfully!");
  } catch (error) {
    console.error("Error downloading models:", error);
    process.exit(1);
  }
}

main();

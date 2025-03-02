const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createWriteStream } = require("fs");
const { pipeline } = require("stream/promises");
const { createGunzip } = require("zlib");
const { Extract } = require("unzipper");

async function downloadFile(url, outputPath) {
  console.log(`Downloading ${url} to ${outputPath}...`);

  const { data } = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const writer = createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    data.pipe(writer);

    let error = null;
    writer.on("error", (err) => {
      error = err;
      writer.close();
      reject(err);
    });

    writer.on("close", () => {
      if (!error) {
        console.log(`Download complete: ${outputPath}`);
        resolve(true);
      }
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
      await downloadFile(modelUrl, modelPath);
    } else {
      console.log(`Model file already exists: ${modelPath}`);
    }

    if (!fs.existsSync(scorerPath)) {
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

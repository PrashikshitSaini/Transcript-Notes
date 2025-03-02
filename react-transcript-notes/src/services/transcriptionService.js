import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Use the free Web Speech API for transcription or server-side Vosk for uploaded files
export const transcribeAudio = async (audioFile) => {
  if (!audioFile || !(audioFile instanceof File)) {
    throw new Error("A valid audio file is required");
  }

  // For actual voice recording (when using the mic), we'll use Web Speech API
  if (audioFile.name === "recording.wav") {
    return (
      window.recordedTranscript ||
      "No transcript was recorded. Please try recording again."
    );
  }

  try {
    // For uploaded audio files, send to server for processing with Vosk
    const formData = new FormData();
    formData.append("audio", audioFile);

    console.log("Sending audio file to server for Vosk transcription...");

    // Server-side transcription with Vosk
    const response = await axios.post(`${API_URL}/upload-audio`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Increase timeout for larger files
      timeout: 120000, // 2 minutes timeout for large files
    });

    // If server responds with a transcript
    if (response.data && response.data.transcript) {
      console.log("Transcription received from server");
      return response.data.transcript;
    }

    throw new Error("No transcript returned from server");
  } catch (error) {
    console.error("Error transcribing audio:", error);

    // Return a more helpful error message
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Transcription timed out. The file may be too large or the server is busy."
      );
    } else if (error.response) {
      throw new Error(
        `Server error: ${
          error.response.data.error || error.response.statusText
        }`
      );
    } else if (error.request) {
      throw new Error(
        "Server not responding. Make sure the server is running."
      );
    } else {
      throw new Error(`Transcription error: ${error.message}`);
    }
  }
};

// This function is called by the RecordingControls component when live recording happens
export const setupLiveTranscription = () => {
  window.recordedTranscript = "";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      supported: false,
      error: "Speech recognition not supported in this browser",
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = window.recordedTranscript || "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    window.recordedTranscript = finalTranscript;

    // You can display interim results if wanted
    if (window.onInterimTranscript) {
      window.onInterimTranscript(interimTranscript);
    }
  };

  return {
    supported: true,
    recognition,
  };
};

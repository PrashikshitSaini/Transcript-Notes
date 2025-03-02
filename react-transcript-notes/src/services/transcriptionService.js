import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Use the free Web Speech API for transcription
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

  // For audio file upload, we can try browser-based transcription with Web Speech API
  return new Promise((resolve, reject) => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(
        new Error(
          "Speech recognition not supported in this browser. Try Chrome or Edge."
        )
      );
      return;
    }

    // Create audio element to play the file
    const audio = new Audio();
    const fileURL = URL.createObjectURL(audioFile);
    audio.src = fileURL;

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let transcript = "";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      // Don't reject - we still want to return whatever we've captured
    };

    recognition.onend = () => {
      if (transcript.trim()) {
        resolve(transcript);
      } else {
        resolve(`This is an uploaded audio file. Web Speech API has limitations with pre-recorded audio. 
                For the best results, please use the microphone recording feature directly.
                
                Sample transcript for demonstration: 
                "Today we discussed the implementation of speech recognition technologies 
                and their integration with note-taking applications. The key challenges 
                include browser compatibility and the need for server-side processing for 
                more advanced features."`);
      }
    };

    // Start audio and recognition
    audio.onplay = () => {
      recognition.start();
    };

    audio.onended = () => {
      recognition.stop();
    };

    // Handle errors
    audio.onerror = (e) => {
      console.error("Audio error", e);
      reject(new Error("Error playing audio file"));
    };

    // Play the audio file
    audio.play().catch((err) => {
      console.error("Error playing audio", err);
      reject(
        new Error(
          "Browser prevented audio playback. Try a different browser or use the microphone directly."
        )
      );
    });

    // Safety timeout - stop after max duration
    setTimeout(() => {
      if (recognition) {
        recognition.stop();
      }
    }, 300000); // 5 min max
  });
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

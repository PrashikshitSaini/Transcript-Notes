import React, { useRef, useState, useEffect } from "react";
import { ReactMic } from "react-mic";
import {
  transcribeAudio,
  setupLiveTranscription,
} from "../services/transcriptionService";
import { generateNotes } from "../services/notesGenerationService";

const RecordingControls = ({
  isRecording,
  isPaused,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onNotesGenerated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReactMicSupported, setIsReactMicSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Set up Web Speech API for live transcription
  useEffect(() => {
    const { supported, recognition, error } = setupLiveTranscription();

    if (!supported) {
      console.error("Speech recognition not supported:", error);
      setIsReactMicSupported(false);
      return;
    }

    recognitionRef.current = recognition;

    // Set up handler for interim results
    window.onInterimTranscript = (text) => {
      setInterimTranscript(text);
    };

    // Check general media support
    const checkMediaSupport = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Media not supported:", err);
        setIsReactMicSupported(false);
      }
    };

    checkMediaSupport();

    return () => {
      // Clean up
      window.onInterimTranscript = null;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);

  // Control recognition based on recording state
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isRecording && !isPaused) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition might already be started
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
  }, [isRecording, isPaused]);

  const onData = (recordedBlob) => {
    // Not storing streaming data to avoid excessive memory usage
  };

  const onStop = async (recordedBlob) => {
    try {
      setIsProcessing(true);

      // Convert blob to file
      const audioFile = new File([recordedBlob.blob], "recording.wav", {
        type: "audio/wav",
      });

      // The transcription is already captured through Web Speech API
      // We'll use the recorded transcript from the window object
      const transcript =
        window.recordedTranscript || "No speech detected. Please try again.";

      // Generate notes from transcript
      const notes = await generateNotes(transcript);

      onNotesGenerated(notes);
    } catch (error) {
      console.error("Error processing recording:", error);
      onNotesGenerated("Error processing recording: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        setIsProcessing(true);

        // Show processing message to user
        onNotesGenerated("Processing your audio file... Please wait.");

        // Transcribe audio file silently in background
        const transcript = await transcribeAudio(file);

        // Generate notes from transcript
        const notes = await generateNotes(transcript);

        onNotesGenerated(notes);
      } catch (error) {
        console.error("Error processing file:", error);
        onNotesGenerated("Error processing file: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleShortRecording = () => {
    if (isRecording) return;
    // Reset transcript for new recording
    window.recordedTranscript = "";
    onStartRecording();
    setTimeout(() => {
      if (isRecording) {
        onStopRecording();
      }
    }, 10000); // 10 seconds for short recording
  };

  const handleLongRecording = () => {
    if (isRecording) return;
    // Reset transcript for new recording
    window.recordedTranscript = "";
    onStartRecording();
    // Long recording relies on user to stop manually
  };

  return (
    <div className="recording-controls">
      {isReactMicSupported ? (
        <>
          <ReactMic
            record={isRecording && !isPaused}
            className="sound-wave"
            onStop={onStop}
            onData={onData}
            strokeColor="#000000"
            backgroundColor="#FF4081"
            mimeType="audio/wav"
          />
          {isRecording && !isPaused && interimTranscript && (
            <div className="interim-transcript">
              <em>Currently transcribing: {interimTranscript}</em>
            </div>
          )}
        </>
      ) : (
        <div className="sound-wave-placeholder">
          Microphone access not available in this browser. Please try using the
          file upload option instead.
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleShortRecording}
          disabled={isRecording || isProcessing || !isReactMicSupported}
        >
          Record from Mic
        </button>

        <label className="file-label">
          Select Audio File
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/wav,audio/mp3,audio/m4a"
            className="file-input"
            disabled={isRecording || isProcessing}
          />
        </label>

        <button
          onClick={handleLongRecording}
          disabled={isRecording || isProcessing}
        >
          Record 30 Minutes
        </button>

        <button
          onClick={onPauseRecording}
          disabled={!isRecording || isPaused || isProcessing}
        >
          Pause Recording
        </button>

        <button
          onClick={onResumeRecording}
          disabled={!isRecording || !isPaused || isProcessing}
        >
          Resume Recording
        </button>

        <button
          onClick={onStopRecording}
          disabled={!isRecording || isProcessing}
        >
          Stop Recording
        </button>
      </div>

      {isProcessing && <p>Processing... Please wait</p>}
    </div>
  );
};

export default RecordingControls;

# Transcript Notes Application

A web application for recording audio, transcribing speech, and generating comprehensive notes using AI.

## Overview

This application combines browser-based speech recognition with Google's Gemini AI to create a powerful note-taking tool. Record audio through your microphone or upload audio files, and the app will transcribe the content and generate well-organized Markdown notes.

## Features

- **Voice Recording**: Record audio directly from your microphone
- **Real-time Transcription**: See text as you speak with the Web Speech API
- **File Upload Support**: Upload existing audio files for transcription
- **AI-Powered Notes**: Generate comprehensive notes from transcripts using Gemini AI
- **Markdown Formatting**: Notes are formatted in Markdown for clean, structured presentation
- **Recording Controls**: Pause, resume, and stop recording as needed
- **Timer Display**: Track recording duration in real-time

## Technology Stack

- **Frontend**: React 16 with custom components
- **Backend**: Node.js with Express
- **Transcription**: Web Speech API (browser-based, free)
- **AI Notes Generation**: Google Gemini API
- **Markdown Rendering**: React Markdown

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm installed
- Chrome or Edge browser (for best Web Speech API support)
- Google Gemini API key

### Installation

1. **Clone the repository or download the files**

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install React dependencies**

   ```bash
   cd react-transcript-notes
   npm install --legacy-peer-deps
   ```

4. **Configure API keys**
   - Create a `.env` file in the root directory:
     ```
     API_KEY=your_gemini_api_key
     ```
   - Create a `.env` file in the `react-transcript-notes` directory:
     ```
     REACT_APP_GEMINI_API_KEY=your_gemini_api_key
     ```

### Running the Application

1. **Start the backend server**

   ```bash
   npm start
   ```

2. **Start the React frontend** (in a new terminal window)

   ```bash
   cd react-transcript-notes
   npm start
   ```

3. **Access the application**
   Open your browser to http://localhost:3000

## Usage Guide

1. **Quick Recording**: Click "Record from Mic" for a 10-second recording
2. **Long Recording**: Click "Record 30 Minutes" for an extended session
3. **Upload Audio**: Use "Select Audio File" to transcribe existing recordings
4. **Control Recording**: Use pause/resume/stop buttons while recording
5. **View Notes**: Generated notes will appear in Markdown format below
6. **View Raw Markdown**: Expand the details section to see raw Markdown code

## Troubleshooting

- **Microphone Access**: Ensure your browser has permission to access your microphone
- **Audio Not Transcribing**: Try Chrome or Edge browsers for best transcription results
- **Note Generation Fails**: Verify your Gemini API key is correctly set
- **React-Mic Errors**: Ensure you've installed with --legacy-peer-deps flag
- **Server Connection Errors**: Confirm the server is running on port 5000

## Limitations

- Web Speech API works best with clear speech and good microphone quality
- Transcription of uploaded files is limited by browser capabilities
- Long recordings (>30min) may experience browser limitations
- Transcription quality varies by browser and language

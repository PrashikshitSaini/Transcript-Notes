import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox
import speech_recognition as sr
import requests
import threading
import time  # for timing

try:
    import pyaudio
except ImportError:
    messagebox.showerror("Error", "PyAudio is not installed. Please install it using 'pip install pyaudio'.")

import google.generativeai as genai

GEMINI_API_KEY = "API_KEys"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# Global variables for timer and recording control
record_long_active = False
record_start_time = None
recording_paused = False

def record_audio():
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            messagebox.showinfo("Recording", "Recording... Speak now!")
            print("Microphone initialized. Listening...")
            audio_data = recognizer.listen(source, timeout=10)
            print("Audio data captured.")
        transcript = recognizer.recognize_google(audio_data)
        print("Transcription completed.")
        notes = generate_notes_with_gemini(transcript)
        display_notes(notes)
    except AttributeError as e:
        messagebox.showerror("Error", "PyAudio is not installed. Please install it using 'pip install pyaudio'.")
    except sr.WaitTimeoutError:
        messagebox.showerror("Error", "Listening timed out while waiting for phrase to start.")
    except Exception as e:
        messagebox.showerror("Error", str(e))

def record_long_audio():
    global record_long_active, recording_paused
    recognizer = sr.Recognizer()
    collected_frames = []
    active_time = 0  # seconds of actual recording (not paused)
    with sr.Microphone() as source:
        sample_rate = source.SAMPLE_RATE
        sample_width = source.SAMPLE_WIDTH
        # Record until we accumulate 1800 sec (30 min) of audio (active recording time)
        while active_time < 1800:
            if not record_long_active:
                break  # Stop recording if user pressed stop
            if recording_paused:
                time.sleep(1)
                continue
            segment_start = time.time()
            try:
                # Record in segments (max 5 sec each)
                audio_segment = recognizer.listen(source, phrase_time_limit=5)
                collected_frames.append(audio_segment.frame_data)
            except sr.WaitTimeoutError:
                pass
            segment_end = time.time()
            active_time += (segment_end - segment_start)
    if collected_frames:
        combined_audio = b"".join(collected_frames)
        audio_data = sr.AudioData(combined_audio, sample_rate, sample_width)
        transcript = recognizer.recognize_google(audio_data)
        print("Transcription of 30-minute recording completed.")
        notes = generate_notes_with_gemini(transcript)
        display_notes(notes)
    else:
        messagebox.showerror("Error", "No audio data was recorded.")
    record_long_active = False

def record_long_audio_thread():
    global record_long_active, record_start_time, recording_paused
    if record_long_active:
        return  # Prevent double-clicking while already recording
    record_long_active = True
    recording_paused = False
    record_start_time = time.time()
    threading.Thread(target=record_long_audio, daemon=True).start()
    update_timer()

def update_timer():
    global record_long_active, record_start_time, recording_paused
    if record_long_active:
        if recording_paused:
            timer_label.config(text="Recording paused.")
        else:
            elapsed = int(time.time() - record_start_time)
            timer_label.config(text=f"Recording Time: {elapsed} sec")
        root.after(1000, update_timer)
    else:
        timer_label.config(text="Recording finished.")

def pause_recording():
    global recording_paused
    recording_paused = True
    timer_label.config(text="Recording paused.")

def resume_recording():
    global recording_paused
    recording_paused = False

def stop_recording():
    global record_long_active
    record_long_active = False
    timer_label.config(text="Recording stopped.")

def select_audio_file():
    file_path = filedialog.askopenfilename(title="Select Audio File", filetypes=[("Audio Files", "*.wav *.mp3")])
    if not file_path:
        return
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(file_path) as source:
            audio_data = recognizer.record(source)
        transcript = recognizer.recognize_google(audio_data)
        notes = generate_notes_with_gemini(transcript)
        display_notes(notes)
    except Exception as e:
        messagebox.showerror("Error", str(e))

def generate_notes_with_gemini(transcript):
    response = model.generate_content(transcript)
    return response.text

def display_notes(notes):
    text_area.config(state=tk.NORMAL)
    text_area.delete("1.0", tk.END)
    text_area.insert(tk.END, notes)
    text_area.config(state=tk.DISABLED)

# Setup basic UI
root = tk.Tk()
root.title("Transcript & Notes App")

button_frame = tk.Frame(root)
button_frame.pack(pady=10)

record_btn = tk.Button(button_frame, text="Record from Mic", command=record_audio)
record_btn.grid(row=0, column=0, padx=5)

file_btn = tk.Button(button_frame, text="Select Audio File", command=select_audio_file)
file_btn.grid(row=0, column=1, padx=5)

long_record_btn = tk.Button(button_frame, text="Record 30 Minutes", command=record_long_audio_thread)
long_record_btn.grid(row=0, column=2, padx=5)

pause_btn = tk.Button(button_frame, text="Pause Recording", command=pause_recording)
pause_btn.grid(row=0, column=3, padx=5)

resume_btn = tk.Button(button_frame, text="Resume Recording", command=resume_recording)
resume_btn.grid(row=0, column=4, padx=5)

stop_btn = tk.Button(button_frame, text="Stop Recording", command=stop_recording)
stop_btn.grid(row=0, column=5, padx=5)

# Timer label for long recording
timer_label = tk.Label(root, text="Not recording")
timer_label.pack(pady=5)

text_area = scrolledtext.ScrolledText(root, width=60, height=20, state=tk.DISABLED)
text_area.pack(padx=10, pady=10)

root.mainloop()

import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox
import speech_recognition as sr
import requests

try:
    import pyaudio
except ImportError:
    messagebox.showerror("Error", "PyAudio is not installed. Please install it using 'pip install pyaudio'.")

import google.generativeai as genai

GEMINI_API_KEY = "API_KEYS"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

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

text_area = scrolledtext.ScrolledText(root, width=60, height=20, state=tk.DISABLED)
text_area.pack(padx=10, pady=10)

root.mainloop()

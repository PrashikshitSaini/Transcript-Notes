import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox
import speech_recognition as sr
import requests

def record_audio():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        messagebox.showinfo("Recording", "Recording... Speak now!")
        audio_data = recognizer.listen(source)
    try:
        transcript = recognizer.recognize_google(audio_data)
        notes = generate_notes_with_gemini(transcript)
        display_notes(notes)
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
    # Simulate API call to Gemini and return organized notes.
    return "Simulated notes from Gemini API based on transcript."

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

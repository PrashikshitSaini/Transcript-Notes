#!/usr/bin/env python3
import sys
import os
from openai import OpenAI
import logging
import http.client

# Enable HTTP debugging to see the exact request/response
http.client.HTTPConnection.debuglevel = 1
logging.basicConfig(level=logging.DEBUG)

if len(sys.argv) != 2:
    print("Usage: python deepseek_notes.py <transcript>")
    sys.exit(1)

transcript = sys.argv[1]

# Use your DeepSeek API key from environment variables
deepseek_api_key = os.getenv("REACT_APP_DEEPSEEK_API_KEY")
if not deepseek_api_key:
    print("Error: DEEPSEEK_API_KEY is not set", file=sys.stderr)
    sys.exit(1)

print(f"API key found (length: {len(deepseek_api_key)})", file=sys.stderr)

# Initialize OpenAI client with DeepSeek API - exactly as in docs
client = OpenAI(api_key=deepseek_api_key, base_url="https://api.deepseek.com")

# Prepare messages using the transcript
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": f"Generate comprehensive, well-organized notes from this transcript:\n\n{transcript}\n\nFormat the response in Markdown using headers, bullet lists, **bold**, *italics* and > blockquotes."}
]

try:
    print("Sending request to DeepSeek API...", file=sys.stderr)
    
    # Use the exact parameters from the documentation
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=False
    )
    
    print("Response received successfully!", file=sys.stderr)
    print(response.choices[0].message.content)
    
except Exception as e:
    print(f"DeepSeek API call failed: {str(e)}", file=sys.stderr)
    
    # Print the type of exception for more detailed debugging
    print(f"Exception type: {type(e)}", file=sys.stderr)
    
    # Check for OpenAI specific error details
    if hasattr(e, 'response'):
        try:
            print(f"Status code: {e.response.status_code}", file=sys.stderr)
            print(f"Response body: {e.response.text}", file=sys.stderr)
        except:
            pass
    
    sys.exit(1)

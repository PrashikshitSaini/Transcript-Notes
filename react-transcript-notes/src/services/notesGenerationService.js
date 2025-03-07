import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const generateNotes = async (transcript) => {
  if (!transcript) {
    return "No transcript provided. Please record or upload audio first.";
  }

  try {
    // First try to use the local server
    const response = await axios.post(`${API_URL}/generate-notes`, {
      transcript,
    });
    if (response.data && response.data.notes) {
      return response.data.notes;
    }
    throw new Error("Invalid response from notes generation server");
  } catch (serverError) {
    console.error(
      "Server error, falling back to direct API call:",
      serverError
    );

    // Check if DeepSeek API key is provided
    const deepseekApiKey = process.env.REACT_APP_DEEPSEEK_API_KEY;
    if (deepseekApiKey) {
      try {
        // Fix: Use the correct DeepSeek API endpoint format that's OpenAI-compatible
        const deepseekResponse = await axios.post(
          "https://api.deepseek.com/v1/chat/completions",
          {
            model: "deepseek-chat",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              {
                role: "user",
                content: `Generate comprehensive, well-organized on point notes with no excessive inputs from your but only from this transcript without altering the speaker's content:
            
Transcript: ${transcript}

Format the response in proper Markdown syntax with headers, subheaders, bullet lists, **bold**, *italics*, and > blockquotes.`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${deepseekApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Fix: Extract content from the proper location in the response
        if (deepseekResponse.data?.choices?.[0]?.message?.content) {
          return deepseekResponse.data.choices[0].message.content;
        }
        return "Could not generate notes via DeepSeek. The API response format was unexpected.";
      } catch (deepseekError) {
        console.error("Error using DeepSeek API:", deepseekError);
        return (
          "Error generating notes via DeepSeek: " +
          (deepseekError.response?.data?.error?.message ||
            deepseekError.message) +
          "\n\nPlease check your API key and internet connection."
        );
      }
    } else {
      // Fallback to Gemini direct API call if DeepSeek key is not set
      try {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
          return "ERROR: No API key is set in environment variables.";
        }
        const directResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Generate comprehensive, well-organized notes from this transcript without changing much of the speaker's content.
Format the response in Markdown with headers, bullet lists, **bold**, *italics*, and > blockquotes.

Transcript: ${transcript}`,
                  },
                ],
              },
            ],
          }
        );

        if (directResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return directResponse.data.candidates[0].content.parts[0].text;
        } else {
          return "Could not generate notes. The API response format was unexpected.";
        }
      } catch (error) {
        console.error("Error generating notes:", error);
        return (
          "Error generating notes: " +
          (error.response?.data?.error?.message || error.message) +
          "\n\nPlease check your API key and internet connection."
        );
      }
    }
  }
};

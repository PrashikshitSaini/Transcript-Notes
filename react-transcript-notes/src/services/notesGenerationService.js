import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Enhanced prompt for more visually engaging notes
const enhancedPrompt = `Create visually engaging, well-structured notes from this transcript.

Use varied Markdown formatting:
- Create a prominent main title with # and subtitles with ## and ###
- Use *italic* for emphasis and definitions
- Highlight key terms with **bold**
- Create bullet lists with - for main points
- Use numbered lists (1., 2.) for sequential information or steps
- Create > blockquotes for important quotes or statements
- Use dividers (---) to separate major sections
- Include code blocks with \`\`\` for technical content if relevant
- Use tables for comparing information when appropriate

Be sure to:
- Vary the formatting throughout (don't just use bullets for everything)
- Create a logical structure with clear sections
- Highlight 3-5 key concepts with bold text
- Use blockquotes for direct quotes from the transcript
- Keep the notes concise but comprehensive

Here's the transcript: `;

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
        const deepseekResponse = await axios.post(
          "https://api.deepseek.com/v1/chat/completions",
          {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "You are a skilled note taker who creates visually engaging and well-formatted markdown notes without adding any extra content.",
              },
              {
                role: "user",
                content: enhancedPrompt + transcript,
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
      // Fallback to Gemini with enhanced prompt
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
                    text: enhancedPrompt + transcript,
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

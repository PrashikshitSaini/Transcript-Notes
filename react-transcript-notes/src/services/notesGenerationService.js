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

    // Fall back to direct API call if server fails
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      if (!apiKey) {
        return "ERROR: GEMINI_API_KEY is not set in environment variables.";
      }

      // Modified prompt to specifically request Markdown formatting
      const directResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Generate comprehensive, well-organized notes from this transcript.
                  Format the response in proper Markdown syntax with:
                  - Headers and subheaders (# and ##) for main topics and subtopics
                  - Bullet points (- or *) for lists
                  - **Bold** for important terms or concepts
                  - *Italics* for emphasis
                  - > Blockquotes for significant quotes or statements
                  - Proper spacing between sections
                  
                  Here is the transcript: ${transcript}`,
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
};

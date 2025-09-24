
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface EditImageResult {
    imageUrl: string | null;
    text: string | null;
}

export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<EditImageResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let imageUrl: string | null = null;
    let text: string | null = null;
    
    // The response is in response.candidates[0].content.parts
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                text = part.text;
            }
        }
    } else {
        // Fallback for cases where the top-level response might have the text.
        text = response.text;
    }


    if (!imageUrl) {
      console.warn("API response did not contain an image.", response);
    }

    return { imageUrl, text };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
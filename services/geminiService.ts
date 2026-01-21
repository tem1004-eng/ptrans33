
import { GoogleGenAI } from "@google/genai";

export const transcribeAudio = async (file: File): Promise<string> => {
  // Initialize AI client inside the function to ensure it uses the latest environment state
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Optimized for multimodal tasks like audio
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type || 'audio/mp3',
              data: base64Data,
            },
          },
          {
            text: "Please transcribe this audio accurately. If it's a conversation, distinguish between speakers by adding 'Speaker A:', 'Speaker B:', etc. Output ONLY the transcription text in the language detected in the audio. Do not include any introductory or concluding remarks.",
          },
        ],
      },
      config: {
        temperature: 0.1, // High precision
      }
    });

    const transcriptionText = response.text;
    if (!transcriptionText) {
      throw new Error("Transcription generated an empty response.");
    }

    return transcriptionText;
  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    // Provide a more user-friendly error message
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("API 키 인증에 실패했습니다. 시스템 설정을 확인해주세요.");
    }
    throw new Error(error.message || "오디오 변환 중 오류가 발생했습니다.");
  }
};

import { GoogleGenAI, Modality, Type } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateText = async (prompt: string) => {
  const response = await ai.models.generateContent({
    // FIX: Updated model name to 'gemini-flash-lite-latest' as per guidelines for 'gemini lite or flash lite'.
    model: 'gemini-flash-lite-latest',
    contents: prompt,
  });
  return response.text;
};

export const generateGroundedAnswer = async (prompt: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return response;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image data found in response");
};


export const generateImage = async (prompt: string, aspectRatio: string) => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

export const suggestTasksForCase = async (caseTitle: string): Promise<{description: string}[]> => {
    const prompt = `ในฐานะผู้ช่วยด้านเอกสารแรงงานของไทย สำหรับเคสงานหัวข้อ "${caseTitle}" โปรดแนะนำรายการสิ่งที่ต้องทำ (checklist) ที่จำเป็นทั้งหมดเป็นภาษาไทย ส่งข้อมูลกลับมาในรูปแบบ JSON array of objects โดยแต่ละ object มี key เป็น "description"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING
                        },
                    },
                },
            },
        },
    });

    try {
        const jsonString = response.text;
        const tasks = JSON.parse(jsonString);
        return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return [];
    }
};

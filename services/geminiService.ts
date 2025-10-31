
import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedFeedback } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        sentiment: {
            type: Type.STRING,
            description: "The overall sentiment of the feedback. Can be 'Positive', 'Negative', or 'Neutral'.",
        },
        summary: {
            type: Type.STRING,
            description: "A concise one-sentence summary of the feedback.",
        },
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            },
            description: "A list of 3-5 main keywords from the feedback.",
        },
    },
    required: ["sentiment", "summary", "keywords"],
};

export const analyzeFeedback = async (feedbackText: string): Promise<AnalyzedFeedback | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following customer feedback and provide the sentiment, a summary, and keywords. Feedback: "${feedbackText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedData: AnalyzedFeedback = JSON.parse(jsonString);
        return parsedData;

    } catch (error) {
        console.error("Error analyzing feedback with Gemini API:", error);
        return null;
    }
};

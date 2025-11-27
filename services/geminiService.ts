import { GoogleGenAI, Modality } from "@google/genai";
import { UrgencyLevel, ReminderData, SafetyImageResponse } from '../types';
import { decode, decodeAudioData } from './utils';

// Singleton instance to be reused
let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing from environment variables.");
      throw new Error("API Key not found");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

/**
 * Generates a persuasive and urgent reminder text based on the remaining time.
 */
export const generateReminderText = async (urgency: UrgencyLevel, daysLeft: number, hoursLeft: number): Promise<string> => {
  const ai = getGenAI();
  
  let prompt = "";
  switch (urgency) {
    case UrgencyLevel.CRITICAL:
      prompt = `Create a VERY short, extremely urgent warning message (max 20 words) in Chinese.
      Context: The user MUST complete their Safety Management Course by November 30.
      Current Status: Only ${hoursLeft} hours remaining!
      Tone: Alarming, commanding, authoritative. Use exclamation marks.`;
      break;
    case UrgencyLevel.HIGH:
      prompt = `Create a short, urgent reminder (max 25 words) in Chinese.
      Context: Safety Management Course deadline is November 30.
      Current Status: Only ${daysLeft} days left. Time is running out fast.
      Tone: Serious, pressing.`;
      break;
    case UrgencyLevel.MEDIUM:
      prompt = `Create a friendly but firm reminder (max 30 words) in Chinese.
      Context: Don't forget the Safety Management Course deadline on November 30.
      Current Status: ${daysLeft} days remaining.
      Tone: Professional, encouraging action.`;
      break;
    case UrgencyLevel.LOW:
      prompt = `Create a polite reminder (max 30 words) in Chinese.
      Context: Plan to take the Safety Management Course before November 30.
      Current Status: Plenty of time (${daysLeft} days), but good to start early.
      Tone: Informative, calm.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "请立即完成安全课程！";
  } catch (error) {
    console.error("Error generating text:", error);
    return "请注意：安全课程需要在11月30日前完成。";
  }
};

/**
 * Generates TTS audio for the reminder.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  const ai = getGenAI();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually clear and authoritative
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) return null;

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );
    
    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

/**
 * Generates a safety-related background or poster image.
 */
export const generateSafetyImage = async (urgency: UrgencyLevel): Promise<SafetyImageResponse> => {
  const ai = getGenAI();

  // Changed to request "Anime Style" to fit "Animation Mode" request
  const basePrompt = "A high-quality, dramatic Japanese anime style illustration background (Makoto Shinkai style). Wide angle.";
  let specificDetails = "";

  if (urgency === UrgencyLevel.CRITICAL || urgency === UrgencyLevel.HIGH) {
    specificDetails = "The image depicts a futuristic industrial control room turning RED with warnings. A large digital clock in the background shows time running out. Atmosphere is tense, urgent, and shadowy. Red, orange and black color palette.";
  } else {
    specificDetails = "The image depicts a bright, hopeful industrial city of the future. A large calendar hologram shows 'Nov 30'. A safety worker in anime style looks at the horizon confidently. Blue, white, and cyan color palette. Clear skies.";
  }

  try {
    // Using gemini-2.5-flash-image ("banana") as requested to avoid permissions issues
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: `${basePrompt} ${specificDetails} --no text` }]
        },
        // No imageSize config for banana model
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            return {
                imageUrl: `data:image/png;base64,${base64EncodeString}`,
                description: "Generated Anime Style Safety Image"
            };
        }
    }
    return { imageUrl: null, description: "Failed to generate" };

  } catch (error) {
    console.error("Error generating image:", error);
    return { imageUrl: null, description: "Error" };
  }
};
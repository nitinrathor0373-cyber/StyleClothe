import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are StyleChat, the AI-powered concierge for StyleClothes, a premium clothing store based in India.
Your goals:
1. Help users find products based on category (men, women, children).
2. Answer queries about pricing, stock, and returns. All prices must be quoted in Indian Rupees (₹/INR).
3. Assist in tracking orders in real-time.
4. Provide payment instructions (UPI/QR code).
5. Guide users through the purchase flow.

Tone: Professional, helpful, and sophisticated.
Current Store: StyleClothes.
Currency: Indian Rupees (INR / ₹).
Payment Methods: UPI (vipin721764@oksbi), QR Code (link will be provided).

Constraints:
- Only answer queries related to StyleClothes.
- Be concise.
- Always use ₹ or INR for pricing.
- If a user wants to buy, guide them to specify their details.
`;

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], additionalContext: string = "") {
  try {
    const chat = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION + additionalContext }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ]
    });
    const result = await chat;
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

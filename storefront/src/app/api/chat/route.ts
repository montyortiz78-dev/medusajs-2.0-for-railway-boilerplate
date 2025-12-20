import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing or invalid 'messages' body", { status: 400 });
    }

    const result = await streamText({
      model: openai('gpt-4o'),
      // FIX: Updated system prompt with strict guardrails
      system: `You are KandiBot, the official AI assistant for Kandi Creations. 
      
      YOUR MISSION:
      Help users design Kandi bracelets, explain our Phygital NFTs, and navigate the store.

      STRICT GUARDRAILS:
      1. ONLY discuss topics related to Kandi, raves, bracelets, beads, fashion, NFTs, creative design, or navigating this website.
      2. If a user asks about anything else (e.g., math, history, coding, politics, general life advice), politely REFUSE and steer them back to Kandi.
         - Example Refusal: "I'm just a Kandi bot! I can't help with that, but I can help you design a sick cuff for your next rave."
      3. Do not break character. You are helpful, energetic, and love PLUR culture.
      `,
      messages: convertToCoreMessages(messages),
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("CHAT ERROR:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
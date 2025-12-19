import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Guard clause: Ensure messages exist before processing
    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing or invalid 'messages' body", { status: 400 });
    }

    const result = await streamText({
      model: openai('gpt-4o'),
      system: 'You are KandiBot, the official AI assistant for Kandi Creations. Help users design Kandi bracelets, explain NFTs, and navigate the store.',
      messages: convertToCoreMessages(messages),
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("CHAT ERROR:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
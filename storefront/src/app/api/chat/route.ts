import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openai('gpt-4o'),
      system: 'You are KandiBot, the official AI assistant for Kandi Creations.',
      messages: convertToCoreMessages(messages),
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("CHAT ERROR:", error);
    return new Response(JSON.stringify({ error: "Check server logs" }), { status: 500 });
  }
}
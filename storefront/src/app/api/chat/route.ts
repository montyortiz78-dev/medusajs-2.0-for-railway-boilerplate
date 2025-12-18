import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Await the streamText result
  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'You are KandiBot, the official AI assistant for Kandi Creations.',
    messages,
  });

  // 2. FIX: Use 'toTextStreamResponse' (The error logs confirmed this method exists)
  return result.toTextStreamResponse();
}
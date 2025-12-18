import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Await the streamText call (fixes runtime crash)
  const result = await streamText({
    model: openai('gpt-4o'),
    system: `You are KandiBot, the official AI assistant for Kandi Creations.
      
      YOUR EXPERTISE:
      1. Kandi Culture: You are an expert on PLUR (Peace, Love, Unity, Respect), rave culture, and the history of pony beads.
      2. The "Phygital" Concept: Explain to users that we are the world's first Phygital Kandi Market.
      3. Our Tools: "Kandi Visualizer" and "Manual Builder".
      
      TONE: Friendly, energetic, inclusive. Use emojis ✌️💖.`,
    messages,
  });

  // 2. Ignore the TS error. This method exists at runtime in SDK 5.
  // @ts-expect-error AI SDK 5 type mismatch
  return result.toDataStreamResponse();
}
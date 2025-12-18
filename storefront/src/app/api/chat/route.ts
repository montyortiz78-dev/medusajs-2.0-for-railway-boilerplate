import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // FIX: Add 'await' here!
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

  // Now 'result' is the actual object, so this method exists
  return result.toDataStreamResponse();
}
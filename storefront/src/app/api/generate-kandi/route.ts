import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Allow the AI up to 60 seconds to think
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Check if the Key exists in the environment
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("❌ ERROR: Google API Key is missing from Environment Variables!");
      return Response.json({ error: "Server Config Error: Missing API Key" }, { status: 500 });
    }

    // 2. Get the user's vibe
    const { vibe } = await req.json();
    console.log(`🤖 Generating Kandi for vibe: "${vibe}"...`);

    // 3. Call Google Gemini
    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: z.object({
        kandiName: z.string().describe("A creative, rave-inspired name for this bracelet"),
        vibeStory: z.string().describe("A 1-2 sentence backstory about the vibe of this piece"),
        pattern: z.array(
          z.object({
            type: z.enum(["pony", "star", "heart", "skull", "flower"]),
            color: z.enum(["neon-pink", "neon-green", "electric-blue", "hot-orange", "bright-yellow", "purple", "black", "white", "glow-in-dark"]),
          })
        ).min(10).max(25),
      }),
      prompt: `
        You are a Kandi Kid from 1999. 
        Create a bracelet design for this vibe: "${vibe}".
        Be creative! Use a mix of colors and shapes.
      `,
    });

    console.log("✅ Generation Successful!");
    return Response.json(result.object);

  } catch (error: any) {
    // Log the EXACT error from Google so we can debug it
    console.error("❌ AI GENERATION FAILED:", error);
    
    // Return the specific error message to the frontend
    return Response.json({ 
      error: "AI Generation Failed", 
      details: error.message || "Unknown Error" 
    }, { status: 500 });
  }
}
import { z } from 'zod';

export const maxDuration = 30;

// Three "Fake" AI vibes to rotate through so it feels dynamic
const MOCK_DESIGNS = [
  {
    kandiName: "Neon Glitch Goddess",
    vibeStory: "A cyberpunk dreamscape inspired by 1999 server rooms and neon rain.",
    pattern: [
      { type: "pony", color: "neon-pink" }, { type: "pony", color: "black" },
      { type: "star", color: "electric-blue" }, { type: "pony", color: "neon-green" },
      { type: "pony", color: "black" }, { type: "pony", color: "neon-pink" },
      { type: "heart", color: "white" }, { type: "pony", color: "electric-blue" },
      { type: "pony", color: "neon-green" }, { type: "skull", color: "glow-in-dark" },
      { type: "pony", color: "black" }, { type: "pony", color: "neon-pink" }
    ]
  },
  {
    kandiName: "Alien Slime Superstar",
    vibeStory: "Radioactive vibes from Area 51. Glowing green meets deep purple space dust.",
    pattern: [
      { type: "pony", color: "neon-green" }, { type: "pony", color: "purple" },
      { type: "skull", color: "neon-green" }, { type: "pony", color: "black" },
      { type: "pony", color: "purple" }, { type: "pony", color: "neon-green" },
      { type: "star", color: "glow-in-dark" }, { type: "pony", color: "purple" },
      { type: "pony", color: "black" }, { type: "pony", color: "neon-green" }
    ]
  },
  {
    kandiName: "Sunset Boulevard",
    vibeStory: "Cruising down the strip with hot orange sunsets and bright yellow palm trees.",
    pattern: [
      { type: "pony", color: "hot-orange" }, { type: "pony", color: "bright-yellow" },
      { type: "flower", color: "white" }, { type: "pony", color: "hot-orange" },
      { type: "pony", color: "bright-yellow" }, { type: "pony", color: "hot-orange" },
      { type: "heart", color: "neon-pink" }, { type: "pony", color: "white" },
      { type: "pony", color: "bright-yellow" }, { type: "pony", color: "hot-orange" }
    ]
  }
];

export async function POST(req: Request) {
  // 1. Fake a short delay (so the user thinks AI is thinking)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 2. Pick a random design from our list
  const randomDesign = MOCK_DESIGNS[Math.floor(Math.random() * MOCK_DESIGNS.length)];

  // 3. Send it back!
  return Response.json(randomDesign);
}
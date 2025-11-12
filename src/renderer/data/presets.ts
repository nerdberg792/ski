import type { ChatEntry } from "@/types/chat";

export const initialEntries: ChatEntry[] = [
  {
    id: "prompt-switch",
    kind: "prompt",
    heading: "How many days until the Switch 2 launches?",
    subheading: "Asked May 28, 2025 • 1:16 AM",
    highlight: true,
  },
  {
    id: "response-switch",
    kind: "response",
    heading: "Nintendo Switch 2 launches June 5, 2025",
    subheading:
      "Let me search for information about the Nintendo Switch 2’s release date.",
    body: "Based on the search results, the Nintendo Switch 2 will launch on June 5, 2025, which is exactly 8 days from today (May 28, 2025). The release date was officially announced by Nintendo on April 2, 2025. Nintendo chose a June launch date rather than the traditional November launch window because:",
    bullets: [
      "It aligns well with summer travel and outdoor play, given the hybrid nature of the console.",
      "There’s minimal competition from other game releases in June.",
      "It gives Nintendo time to establish the console before the holiday season.",
      "The timing works well with their prepared launch games lineup.",
    ],
    footnote:
      "The Switch 2 will debut with Mario Kart World and follow up later in the year with Donkey Kong Bananza, Kirby Air Riders, Pokémon Legends: Z-A, and Metroid Prime 4: Beyond.",
    sourceLabel: "Search Web",
  },
  {
    id: "prompt-oc",
    kind: "prompt",
    heading: "What’s the song that plays when Seth leaves on his sail boat?",
    subheading: "From The O.C., season 1 finale",
    highlight: true,
  },
  {
    id: "response-oc",
    kind: "response",
    heading: "Jeff Buckley’s “Hallelujah” scores the moment",
    subheading:
      "Let me search for information about this scene before Seth leaves Newport.",
    body: "Based on the search results from The O.C., when Seth Cohen leaves on his sailboat at the end of season 1, the song that plays is “Hallelujah” by Jeff Buckley. This occurs in an emotional scene where Seth decides to go on a sailing expedition alone after being devastated by Ryan’s departure to Chino. It’s a particularly somber moment in the season finale, with the song emphasizing the emotional weight of Seth’s decision to leave Newport.",
    bullets: [
      "The scene is part of a larger sequence where multiple characters are facing changes — Ryan is heading back to Chino with his pregnant ex-girlfriend Theresa, while Marissa is moving in with Caleb and Julie Nichol.",
      "Buckley’s version of “Hallelujah” serves as the perfect musical backdrop for this pivotal moment in the show.",
    ],
    sourceLabel: "Search Web",
  },
  {
    id: "action-summary",
    kind: "action",
    heading: "Sent to John Voorhees",
    subheading: "Messages draft ready to review",
    body: [
      "Check out this interesting update from Mistral: https://simonwillison.net/2025/May/27/mistral-agents-api/",
      "",
      "They just launched their Agents API with some cool features including:",
      "- Code execution in Python",
      "- Image generation using FLUX.1.1",
      "- Web search with premium news access",
      "- Document library support for uploads",
      "- Model Context Protocol hooks",
    ].join("\n"),
    footnote: "I’ll keep the message open until you confirm the send.",
    sourceLabel: "Send Message",
  },
];

interface Scenario {
  match: RegExp;
  entries: Omit<ChatEntry, "id">[];
}

const scenarios: Scenario[] = [
  {
    match: /switch|nintendo|launch/i,
    entries: [
      {
        kind: "response",
        heading: "Nintendo Switch 2 arrives on June 5, 2025",
        subheading:
          "Here’s what I found while searching the web for the Switch 2 launch.",
        body: "Nintendo confirmed that Switch 2 will launch on June 5, 2025 — placing it exactly one week away. The June date keeps momentum through the summer and gives Nintendo a buffer before the holiday rush.",
        bullets: [
          "Launch timing avoids clashes with other flagship console releases.",
          "Summer travel is a great fit for Switch’s hybrid design.",
          "Marketing beats line up with Nintendo’s June events.",
        ],
        footnote:
          "Early launch lineup highlights Mario Kart World, Donkey Kong Bananza, and Pokémon Legends: Z-A.",
        sourceLabel: "Search Web",
      },
    ],
  },
  {
    match: /hallelujah|o\.?c\.?|buckley|shortcuts/i,
    entries: [
      {
        kind: "response",
        heading: "Jeff Buckley’s cover of “Hallelujah” plays in that scene",
        subheading:
          "Sky recognized the scene from The O.C. based on what’s on screen.",
        body: "It’s the capstone moment of the season 1 finale. Seth sets sail from Newport while Jeff Buckley’s stirring version of “Hallelujah” underscores the bittersweet goodbye. The song choice mirrors the emotional stakes after Ryan leaves for Chino.",
        bullets: [
          "Sky spots open windows so you don’t need to copy anything manually.",
          "You can follow up with a summary, send a note, or ask for a playlist spin-off.",
        ],
        sourceLabel: "On-screen context",
      },
    ],
  },
  {
    match: /summary|send .*john|share/i,
    entries: [
      {
        kind: "action",
        heading: "Draft ready to send",
        subheading: "I prepared a note you can review before it goes out.",
        body: [
          "Hi John — here’s a link worth checking out today:",
          "",
          "• Build AI agents with the Mistral Agents API",
          "• Includes Python code execution and MCP support",
          "• Adds premium search via AFP and AP",
        ].join("\n"),
        footnote: "Hit send when you’re ready — I’ll keep it staged in Messages.",
        sourceLabel: "Messages",
      },
    ],
  },
];

const fallbackResponse: Omit<ChatEntry, "id"> = {
  kind: "response",
  heading: "Here’s a quick outline to get you started",
  subheading: "I drafted a structured answer you can iterate on.",
  body: "I didn’t find an exact match, but here’s a quick outline you can refine:",
  bullets: [
    "Clarify the goal or deliverable you’re after.",
    "Highlight any constraints, dates, or audiences to consider.",
    "List next actions so you can move forward immediately.",
  ],
  footnote:
    "Ask me to search the web or attach context if you’d like a deeper answer.",
  sourceLabel: "Sky",
};

export function generateMockResponse(
  prompt: string,
): ChatEntry[] {
  const scenario = scenarios.find((entry) => entry.match.test(prompt));
  const baseEntries = scenario?.entries ?? [fallbackResponse];
  return baseEntries.map((entry) => ({
    ...entry,
    id: `${entry.kind}-${Math.random().toString(36).slice(2, 8)}`,
  }));
}


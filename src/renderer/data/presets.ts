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
    body: "Based on the search results, the Nintendo Switch 2 will launch on June 5, 2025, which is exactly 8 days from today (May 28, 2025). The release date was officially announced by Nintendo on April 2, 2025. Nintendo chose a June launch date rather than the traditional November launch window because it allows them to establish the console in the market during a period of lower competition, capitalize on summer gaming trends, and build momentum before the holiday shopping season. The company has been preparing for this launch for several years, investing in research and development to create a console that builds upon the success of the original Switch while addressing consumer feedback about performance, battery life, and display quality. The announcement generated significant excitement among gaming enthusiasts, with pre-orders opening immediately and selling out within hours at major retailers. Industry analysts predict that the Switch 2 will continue Nintendo's tradition of innovation in the gaming space, potentially introducing new features that leverage emerging technologies while maintaining the accessibility and fun factor that made the original Switch so popular. The launch strategy includes a comprehensive marketing campaign, partnerships with major game developers, and a carefully curated lineup of launch titles designed to showcase the console's capabilities.",
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
    heading: 'Jeff Buckley\'s "Hallelujah" scores the moment',
    subheading:
      "Let me search for information about this scene before Seth leaves Newport.",
    body: 'Based on the search results from The O.C., when Seth Cohen leaves on his sailboat at the end of season 1, the song that plays is "Hallelujah" by Jeff Buckley. This occurs in an emotional scene where Seth decides to go on a sailing expedition alone after being devastated by Ryan\'s departure to Chino. It\'s a particularly somber moment in the season finale, with the song emphasizing the emotional weight of Seth\'s decision to leave Newport. The scene represents a pivotal moment of character development, as Seth grapples with feelings of abandonment, confusion about his future, and the need to find his own path independent of the relationships that have defined his life up to that point. Buckley\'s haunting, ethereal interpretation of Leonard Cohen\'s classic song adds layers of meaning to the moment, with the lyrics about love, loss, and redemption resonating deeply with Seth\'s emotional journey. The cinematography of the scene is masterfully executed, with wide shots of the ocean, close-ups of Seth\'s contemplative expression, and the gradual fading of Newport into the distance, all synchronized with the song\'s crescendo. This moment has become one of the most iconic scenes in the show\'s history, often cited by fans and critics as a perfect example of how music can elevate television storytelling. The choice of Buckley\'s version, rather than Cohen\'s original or other covers, was particularly inspired, as Buckley\'s raw, vulnerable vocal performance mirrors Seth\'s own emotional state—both fragile and determined, both broken and hopeful. The scene\'s impact is further enhanced by the context of everything that has happened throughout the season, making Seth\'s departure feel both inevitable and heartbreaking.',
    bullets: [
      "The scene is part of a larger sequence where multiple characters are facing changes — Ryan is heading back to Chino with his pregnant ex-girlfriend Theresa, while Marissa is moving in with Caleb and Julie Nichol.",
      'Buckley\'s version of "Hallelujah" serves as the perfect musical backdrop for this pivotal moment in the show.',
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
          "Here's what I found while searching the web for the Switch 2 launch.",
        body: "Nintendo confirmed that Switch 2 will launch on June 5, 2025 — placing it exactly one week away. The June date keeps momentum through the summer and gives Nintendo a buffer before the holiday rush. This strategic timing allows the company to establish the console in the market during a period when consumers are more likely to have disposable income and time for gaming. The summer launch window also aligns perfectly with Nintendo's brand identity of portable, social gaming experiences that complement outdoor activities and travel. Additionally, the timing helps Nintendo avoid direct competition with other major console releases that typically occur in the fall and winter months, giving the Switch 2 more room to breathe and establish its presence in the marketplace. The company has invested heavily in marketing campaigns that emphasize the console's enhanced capabilities, including improved graphics processing, longer battery life, and backward compatibility with the original Switch library. Pre-orders have been strong, with retailers reporting high demand for both the standard and special edition models. Nintendo has also announced partnerships with major game developers to ensure a steady stream of exclusive titles throughout the first year of release.",
        bullets: [
          "Launch timing avoids clashes with other flagship console releases, giving Nintendo a competitive advantage in the marketplace during a traditionally slower period for console launches.",
          "Summer travel is a great fit for Switch's hybrid design, allowing gamers to take their console on vacation and enjoy high-quality gaming experiences whether they're at home or on the go.",
          "Marketing beats line up with Nintendo's June events, including their annual showcase where they typically reveal new game announcements and console features.",
          "The console features significant hardware improvements including a more powerful processor, enhanced display capabilities, and improved ergonomics for longer gaming sessions.",
          "Backward compatibility ensures that existing Switch owners can seamlessly transition to the new console while maintaining access to their entire game library.",
          "Nintendo has secured exclusive launch titles from major franchises, ensuring strong software support from day one and maintaining the company's reputation for quality first-party games.",
        ],
        footnote:
          "Early launch lineup highlights Mario Kart World, Donkey Kong Bananza, and Pokémon Legends: Z-A, with additional titles scheduled for release throughout the summer and fall seasons. The console will be available in multiple color options and bundle configurations to appeal to different consumer preferences.",
        sourceLabel: "Search Web",
      },
    ],
  },
  {
    match: /hallelujah|o\.?c\.?|buckley|shortcuts/i,
    entries: [
      {
        kind: "response",
        heading: 'Jeff Buckley\'s cover of "Hallelujah" plays in that scene',
        subheading:
          "Sky recognized the scene from The O.C. based on what's on screen.",
        body: 'It\'s the capstone moment of the season 1 finale. Seth sets sail from Newport while Jeff Buckley\'s stirring version of "Hallelujah" underscores the bittersweet goodbye. The song choice mirrors the emotional stakes after Ryan leaves for Chino. This particular scene represents one of the most emotionally resonant moments in the entire series, as it marks a significant turning point for multiple characters. The use of Buckley\'s haunting rendition adds layers of meaning to the narrative, connecting Seth\'s personal journey of self-discovery with the broader themes of loss, growth, and moving forward. The song\'s melancholic yet hopeful tone perfectly captures the complex emotions of the moment—sadness at leaving behind what\'s familiar, but also excitement about the unknown possibilities ahead. The cinematography complements the music beautifully, with sweeping shots of the ocean and Seth\'s solitary figure on the boat, creating a sense of both isolation and freedom. This moment has become iconic among fans of the show, often cited as one of the most memorable uses of music in television history. The scene\'s impact is further enhanced by the context of everything that has led up to this point—the relationships that have formed, the conflicts that have been resolved, and the personal growth that each character has experienced throughout the season.',
        bullets: [
          "Sky spots open windows so you don't need to copy anything manually, making it easier to gather context and information from multiple sources simultaneously.",
          "You can follow up with a summary, send a note, or ask for a playlist spin-off, giving you multiple ways to engage with and build upon the information provided.",
          "The scene's emotional weight is amplified by the contrast between the peaceful, open ocean and the turmoil of the relationships left behind on shore.",
          'Buckley\'s version of the song, originally written by Leonard Cohen, brings a unique vulnerability and raw emotion that resonates deeply with the character\'s internal state.',
          "The moment serves as a metaphor for the broader themes of the show, particularly the idea that sometimes you need to leave behind what's comfortable to discover who you're meant to become.",
          "This scene has been analyzed extensively by critics and fans alike, with many noting its masterful use of music, cinematography, and character development to create a truly memorable television moment.",
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

// Three different length responses for testing UI behavior
const fallbackResponses: Omit<ChatEntry, "id">[] = [
  // SHORT RESPONSE - Minimal content, fits easily
  {
    kind: "response",
    heading: "Quick answer",
    subheading: "Here's a brief response.",
    body: "I found some information that might help. This is a concise answer that should fit comfortably in the viewport without requiring scrolling.",
    sourceLabel: "Sky",
  },
  // MEDIUM RESPONSE - Moderate content, may or may not scroll depending on viewport
  {
    kind: "response",
    heading: "Here's a quick outline to get you started",
    subheading: "I drafted a structured answer you can iterate on.",
    body: "I didn't find an exact match, but here's a comprehensive outline you can refine and expand upon. This response provides a detailed framework that covers multiple aspects of your query, ensuring you have a solid foundation to work with. The structure is designed to be flexible and adaptable to your specific needs, whether you're looking for a quick overview or a deep dive into the topic.",
    bullets: [
      "Clarify the goal or deliverable you're after. Understanding your primary objective helps me tailor the response more precisely to your needs.",
      "Highlight any constraints, dates, or audiences to consider. Context matters greatly when crafting a response.",
      "List next actions so you can move forward immediately. Having a clear action plan with concrete steps helps you make progress right away.",
    ],
    footnote:
      "Ask me to search the web or attach context if you'd like a deeper answer.",
    sourceLabel: "Sky",
  },
  // LONG RESPONSE - Extensive content, will definitely require scrolling
  {
    kind: "response",
    heading: "Here's a comprehensive analysis to get you started",
    subheading: "I've prepared a detailed response covering multiple aspects of your query.",
    body: "I didn't find an exact match, but here's a comprehensive outline you can refine and expand upon. This response provides a detailed framework that covers multiple aspects of your query, ensuring you have a solid foundation to work with. The structure is designed to be flexible and adaptable to your specific needs, whether you're looking for a quick overview or a deep dive into the topic. When approaching complex problems, it's essential to break them down into manageable components, analyze each part systematically, and then synthesize the findings into a coherent whole. This methodology ensures that no critical aspect is overlooked and that the solution addresses the full scope of the challenge. Additionally, considering multiple perspectives and potential edge cases helps create more robust and reliable outcomes. The iterative nature of this process allows for continuous refinement and improvement, making it particularly valuable for projects that evolve over time or require ongoing adjustment based on new information or changing circumstances.",
    bullets: [
      "Clarify the goal or deliverable you're after. Understanding your primary objective helps me tailor the response more precisely to your needs. Consider what success looks like for you and what specific outcomes you're hoping to achieve. This clarity will guide all subsequent decisions and help prioritize efforts effectively.",
      "Highlight any constraints, dates, or audiences to consider. Context matters greatly when crafting a response. Share any deadlines, budget limitations, technical requirements, or specific audience characteristics that might influence the approach or recommendations. These constraints often shape the most viable solutions.",
      "List next actions so you can move forward immediately. Having a clear action plan with concrete steps helps you make progress right away. Break down the larger goal into smaller, manageable tasks that you can tackle sequentially, ensuring steady momentum toward completion.",
      "Consider the broader implications and potential challenges. Every decision has ripple effects, so it's important to think through the consequences, both intended and unintended. This helps you prepare for potential obstacles and plan mitigation strategies that can prevent or minimize negative impacts.",
      "Evaluate available resources and dependencies. Understanding what you have at your disposal—whether it's time, money, expertise, or tools—helps you set realistic expectations and identify any gaps that need to be addressed before moving forward. This assessment is crucial for project planning and resource allocation.",
      "Establish clear communication channels and feedback loops. Regular check-ins and transparent communication ensure that all stakeholders remain aligned and can provide input throughout the process. This collaborative approach often leads to better outcomes and smoother execution.",
      "Document your process and decisions. Keeping records of your approach, rationale, and results creates valuable institutional knowledge and makes it easier to replicate successes or learn from challenges in future projects.",
    ],
    footnote:
      "Ask me to search the web or attach context if you'd like a deeper answer. I can also help you refine specific sections, expand on particular points, or explore alternative approaches to your question. Feel free to ask follow-up questions or request clarification on any aspect of this response.",
    sourceLabel: "Sky",
  },
];

export function generateMockResponse(
  prompt: string,
): ChatEntry[] {
  const scenario = scenarios.find((entry) => entry.match.test(prompt));
  
  // If a scenario matches, use its entries
  if (scenario) {
    return scenario.entries.map((entry) => ({
      ...entry,
      id: `${entry.kind}-${Math.random().toString(36).slice(2, 8)}`,
    }));
  }
  
  // Otherwise, randomly select one of the three test responses
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  const selectedResponse = fallbackResponses[randomIndex];
  
  return [{
    ...selectedResponse,
    id: `${selectedResponse.kind}-${Math.random().toString(36).slice(2, 8)}`,
  }];
}


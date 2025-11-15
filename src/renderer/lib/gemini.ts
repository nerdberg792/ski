import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Action } from "@/types/actions";
import { getAllActions } from "./actions";

let geminiClient: GoogleGenerativeAI | null = null;
let apiKey: string | null = null;

export function initializeGemini(key: string): void {
  apiKey = key;
  // Initialize with API key
  // Using gemini-2.5-flash - latest stable model with enhanced reasoning capabilities
  geminiClient = new GoogleGenerativeAI(key);
}

export function isGeminiInitialized(): boolean {
  return geminiClient !== null && apiKey !== null;
}

export interface GeminiStreamChunk {
  text: string;
  isComplete: boolean;
  proposedAction?: {
    actionId: string;
    parameters?: Record<string, string | number | boolean>;
  };
}

export interface GeminiStreamOptions {
  onChunk: (chunk: GeminiStreamChunk) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export async function streamGeminiResponse(
  prompt: string,
  options: GeminiStreamOptions,
): Promise<void> {
  if (!geminiClient) {
    throw new Error("Gemini client not initialized. Call initializeGemini first.");
  }

  // Get available actions for function calling (needed for fallback)
  const actions = getAllActions();
  console.log("🛠️ [Gemini] Available actions/tools:", actions.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    parameters: a.parameters?.map(p => ({ name: p.name, type: p.type, required: p.required })),
  })));
  
  const functionDeclarations = actions.map((action) => {
      const properties: Record<string, { type: SchemaType; description?: string }> = {};
      
      if (action.parameters) {
        for (const param of action.parameters) {
          let paramType: SchemaType = SchemaType.STRING;
          if (param.type === "number") {
            paramType = SchemaType.NUMBER;
          } else if (param.type === "boolean") {
            paramType = SchemaType.BOOLEAN;
          }
          
          properties[param.name] = {
            type: paramType,
            description: param.description,
          } as any; // Type assertion needed due to complex Schema union types
        }
      }
      
      return {
        name: action.id,
        description: action.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties,
          required: action.parameters?.filter((p) => p.required).map((p) => p.name) || [],
        },
      };
    });

  try {
    // Use gemini-2.5-flash - latest stable model with enhanced capabilities
    // Supports: function calling, streaming, batch API, caching, code execution
    // Token limits: 1,048,576 input, 65,536 output
    // Model identifier: gemini-2.5-flash (stable release)
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Configure chat with function calling tools
    // According to latest API docs, tools should be an array of FunctionDeclarationsTool objects
    const tools = functionDeclarations.length > 0 ? [{ functionDeclarations }] as any : undefined;
    console.log("🔌 [Gemini] Configuring chat with tools:", {
      toolCount: functionDeclarations.length,
      functionNames: functionDeclarations.map(f => f.name),
    });
    
    const chat = model.startChat({
      tools,
    });

    // Use sendMessageStream which maps to streamGenerateContent endpoint
    // This uses Server-Sent Events (SSE) for streaming responses
    console.log("📨 [Gemini] Sending prompt to Gemini:", {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      model: "gemini-2.5-flash",
    });
    
    const result = await chat.sendMessageStream(prompt);

    let fullText = "";
    let proposedAction: { actionId: string; parameters?: Record<string, string | number | boolean> } | undefined;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        options.onChunk({
          text: chunkText,
          isComplete: false,
        });
      }

      // Check for function calls (action proposals)
      const functionCalls = chunk.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const functionCall = functionCalls[0];
        proposedAction = {
          actionId: functionCall.name,
          parameters: functionCall.args as Record<string, string | number | boolean>,
        };
        
        // Log the function call request from Gemini
        console.log("🔧 [Gemini] Function call detected:", {
          actionId: functionCall.name,
          parameters: functionCall.args,
          fullFunctionCall: functionCall,
        });
        
        // Send the action proposal
        options.onChunk({
          text: "",
          isComplete: false,
          proposedAction,
        });
      }
    }

    // Signal completion
    options.onChunk({
      text: "",
      isComplete: true,
      proposedAction,
    });

    options.onComplete?.();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Log error details for debugging
    console.error("Gemini API Error:", {
      message: err.message,
      name: err.name,
    });
    
    options.onError?.(err);
    throw err;
  }
}

export async function getGeminiResponse(prompt: string): Promise<string> {
  if (!geminiClient) {
    throw new Error("Gemini client not initialized. Call initializeGemini first.");
  }

  // Use gemini-2.5-flash for non-streaming requests (latest stable model)
  const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}


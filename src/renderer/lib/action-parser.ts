import type { Action } from "@/types/actions";
import { getAction } from "./actions";

export interface ParsedAction {
  action: Action;
  parameters?: Record<string, string | number | boolean>;
  confidence?: number;
}

/**
 * Parse LLM response to detect action proposals
 * This looks for function calls or structured action mentions in the response
 */
export function parseActionFromResponse(
  text: string,
  proposedAction?: { actionId: string; parameters?: Record<string, string | number | boolean> },
): ParsedAction | null {
  // If we have a direct action proposal from Gemini function calling
  if (proposedAction) {
    const action = getAction(proposedAction.actionId);
    if (action) {
      return {
        action,
        parameters: proposedAction.parameters,
        confidence: 1.0,
      };
    }
  }

  // Fallback: Try to detect action mentions in text
  // This is a simple implementation - can be enhanced with more sophisticated parsing
  const actionKeywords: Record<string, string[]> = {
    "open-app": ["open", "launch", "start"],
    "set-volume": ["volume", "sound", "audio"],
    "toggle-do-not-disturb": ["do not disturb", "dnd", "focus", "notifications"],
    "chrome-get-open-tabs": ["list tabs", "show tabs", "chrome tabs", "browser tabs"],
    "chrome-open-tab": ["chrome", "google chrome", "open tab", "new tab", "browser"],
    "chrome-focus-tab": ["focus tab", "switch tab", "activate tab"],
    "chrome-close-tab": ["close tab", "quit tab", "browser close"],
    "chrome-reload-tab": ["reload tab", "refresh tab", "refresh page"],
    "chrome-create-window": ["new window", "chrome window", "browser window"],
    "chrome-create-window-to-website": ["open window", "open site", "launch website"],
    "chrome-create-tab": ["new tab", "blank tab"],
    "chrome-create-tab-to-website": ["open site", "open page", "go to URL"],
    "chrome-create-incognito-window": ["incognito", "private window", "chrome incognito"],
  };

  const lowerText = text.toLowerCase();
  
  for (const [actionId, keywords] of Object.entries(actionKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      const action = getAction(actionId);
      if (action) {
        return {
          action,
          confidence: 0.7, // Lower confidence for text-based detection
        };
      }
    }
  }

  return null;
}

/**
 * Extract parameters from text for a given action
 */
export function extractParameters(
  text: string,
  action: Action,
): Record<string, string | number | boolean> {
  const parameters: Record<string, string | number | boolean> = {};

  if (!action.parameters) {
    return parameters;
  }

  for (const param of action.parameters) {
    // Simple extraction - can be enhanced with NLP
    const paramRegex = new RegExp(`${param.name}[\\s:]+([^\\s,]+)`, "i");
    const match = text.match(paramRegex);
    
    if (match) {
      const value = match[1];
      if (param.type === "number") {
        parameters[param.name] = parseFloat(value) || 0;
      } else if (param.type === "boolean") {
        parameters[param.name] = value.toLowerCase() === "true" || value === "1";
      } else {
        parameters[param.name] = value;
      }
    } else if (param.default !== undefined) {
      parameters[param.name] = param.default;
    }
  }

  return parameters;
}


export interface Action {
  id: string;
  name: string;
  description: string;
  scriptPath?: string; // Optional for actions that don't use scripts (e.g., Spotify API calls)
  parameters?: ActionParameter[];
  category?: string;
  actionVerb?: string; // Custom verb for the action button (e.g., "Send", "Open", "Execute")
  iconName?: string; // Icon identifier for the action (e.g., "message", "browser", "terminal")
}

export interface ActionParameter {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required?: boolean;
  default?: string | number | boolean;
}

export interface ActionExecution {
  actionId: string;
  parameters?: Record<string, string | number | boolean>;
}

export interface ActionExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface PendingAction {
  id: string;
  action: Action;
  parameters?: Record<string, string | number | boolean>;
  promptWindowId?: string; // If action is associated with a prompt window
}


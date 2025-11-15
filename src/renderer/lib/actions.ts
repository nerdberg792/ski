import type { Action } from "@/types/actions";

// Action registry - stores all available actions
const actionsRegistry: Map<string, Action> = new Map();

// Initialize with sample actions (will be expanded with actual AppleScripts)
export function initializeActions(): void {
  // Sample actions - these will be replaced with actual AppleScripts from raycast/extensions
  // Script paths are relative to the project root
  const sampleActions: Action[] = [
    {
      id: "open-app",
      name: "Open Application",
      description: "Opens a specified application on macOS",
      scriptPath: "scripts/open-app.applescript",
      parameters: [
        {
          name: "appName",
          type: "string",
          description: "Name of the application to open",
          required: true,
        },
      ],
      category: "system",
    },
    {
      id: "set-volume",
      name: "Set Volume",
      description: "Sets the system volume to a specified level",
      scriptPath: "scripts/set-volume.applescript",
      parameters: [
        {
          name: "level",
          type: "number",
          description: "Volume level (0-100)",
          required: true,
        },
      ],
      category: "system",
    },
    {
      id: "toggle-do-not-disturb",
      name: "Toggle Do Not Disturb",
      description: "Toggles macOS Do Not Disturb mode",
      scriptPath: "scripts/toggle-dnd.applescript",
      category: "system",
    },
  ];

  sampleActions.forEach((action) => {
    actionsRegistry.set(action.id, action);
  });
}

export function getAction(id: string): Action | undefined {
  return actionsRegistry.get(id);
}

export function getAllActions(): Action[] {
  return Array.from(actionsRegistry.values());
}

export function getActionsByCategory(category: string): Action[] {
  return Array.from(actionsRegistry.values()).filter(
    (action) => action.category === category,
  );
}

// Search actions by name or description
export function searchActions(query: string): Action[] {
  const lowerQuery = query.toLowerCase();
  return Array.from(actionsRegistry.values()).filter(
    (action) =>
      action.name.toLowerCase().includes(lowerQuery) ||
      action.description.toLowerCase().includes(lowerQuery),
  );
}

// Initialize actions on module load
initializeActions();


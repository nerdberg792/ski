import { shell } from "electron";

/**
 * Search for a location in Apple Maps
 */
export function makeSearchURL(query: string): string {
  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }
  return `maps://?q=${encodeURIComponent(query)}`;
}

/**
 * Generate directions URL for Apple Maps
 */
export function makeDirectionsURL(
  origin: string,
  destination: string,
  transportType: string = "d",
): string {
  const params = new URLSearchParams();
  if (origin) {
    params.append("saddr", origin);
  }
  params.append("daddr", destination);
  params.append("dirflg", transportType);
  return `maps://?${params.toString()}`;
}

/**
 * Search for a location in Apple Maps
 */
export async function searchMaps(query: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = makeSearchURL(query);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to search Apple Maps: ${message}` };
  }
}

/**
 * Get directions between two locations
 */
export async function getDirections(
  destination: string,
  origin?: string,
  mode: string = "d",
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = makeDirectionsURL(origin || "", destination, mode);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to get directions: ${message}` };
  }
}

/**
 * Get directions to home
 */
export async function getDirectionsHome(
  homeAddress: string,
  mode: string = "d",
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = makeDirectionsURL("", homeAddress, mode);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to get directions home: ${message}` };
  }
}


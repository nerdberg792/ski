import { useMemo } from "react";
import type {
  AppleMapsSearchResult,
  AppleMapsDirectionsResult,
} from "../../types/apple-maps";

export interface UseAppleMapsResult {
  search: (query: string) => Promise<AppleMapsSearchResult>;
  directions: (payload: { destination: string; origin?: string; mode?: string }) => Promise<AppleMapsDirectionsResult>;
  directionsHome: (payload: { homeAddress: string; mode?: string }) => Promise<AppleMapsDirectionsResult>;
  isAvailable: boolean;
}

export function useAppleMaps(): UseAppleMapsResult {
  const skyAppleMaps = useMemo(() => window.sky?.appleMaps, []);

  const search = async (query: string): Promise<AppleMapsSearchResult> => {
    if (!skyAppleMaps) {
      return { success: false, error: "Apple Maps integration is not available" };
    }
    try {
      return await skyAppleMaps.search(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const directions = async (payload: {
    destination: string;
    origin?: string;
    mode?: string;
  }): Promise<AppleMapsDirectionsResult> => {
    if (!skyAppleMaps) {
      return { success: false, error: "Apple Maps integration is not available" };
    }
    try {
      return await skyAppleMaps.directions(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const directionsHome = async (payload: {
    homeAddress: string;
    mode?: string;
  }): Promise<AppleMapsDirectionsResult> => {
    if (!skyAppleMaps) {
      return { success: false, error: "Apple Maps integration is not available" };
    }
    try {
      return await skyAppleMaps.directionsHome(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    directions,
    directionsHome,
    isAvailable: Boolean(skyAppleMaps),
  };
}


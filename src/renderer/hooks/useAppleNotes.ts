import { useMemo } from "react";
import type {
  AppleNote,
  AppleNotesSearchResult,
  AppleNotesCreateResult,
  AppleNotesGetContentResult,
  AppleNotesUpdateResult,
} from "../../types/apple-notes";

export interface UseAppleNotesResult {
  search: (query: string) => Promise<AppleNotesSearchResult>;
  create: (payload: { content?: string; text?: string }) => Promise<AppleNotesCreateResult>;
  getContent: (noteId: string) => Promise<AppleNotesGetContentResult>;
  update: (payload: { noteId: string; content: string }) => Promise<AppleNotesUpdateResult>;
  isAvailable: boolean;
}

export function useAppleNotes(): UseAppleNotesResult {
  const skyAppleNotes = useMemo(() => window.sky?.appleNotes, []);

  const search = async (query: string): Promise<AppleNotesSearchResult> => {
    if (!skyAppleNotes) {
      return { notes: [], success: false, error: "Apple Notes integration is not available" };
    }
    try {
      return await skyAppleNotes.search(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { notes: [], success: false, error: message };
    }
  };

  const create = async (payload: { content?: string; text?: string }): Promise<AppleNotesCreateResult> => {
    if (!skyAppleNotes) {
      return { success: false, error: "Apple Notes integration is not available" };
    }
    try {
      return await skyAppleNotes.create(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const getContent = async (noteId: string): Promise<AppleNotesGetContentResult> => {
    if (!skyAppleNotes) {
      return { success: false, error: "Apple Notes integration is not available" };
    }
    try {
      return await skyAppleNotes.getContent(noteId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const update = async (payload: { noteId: string; content: string }): Promise<AppleNotesUpdateResult> => {
    if (!skyAppleNotes) {
      return { success: false, error: "Apple Notes integration is not available" };
    }
    try {
      return await skyAppleNotes.update(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    create,
    getContent,
    update,
    isAvailable: Boolean(skyAppleNotes),
  };
}


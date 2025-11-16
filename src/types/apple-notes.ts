export interface AppleNote {
  id: string;
  title: string;
  folder: string;
  snippet: string;
  modifiedAt?: string;
  account?: string;
}

export interface AppleNotesSearchResult {
  notes: AppleNote[];
  success: boolean;
  error?: string;
}

export interface AppleNotesCreateResult {
  success: boolean;
  error?: string;
  noteId?: string;
}

export interface AppleNotesGetContentResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface AppleNotesUpdateResult {
  success: boolean;
  error?: string;
}


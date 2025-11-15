import { useState, useCallback, useRef } from "react";
import {
  streamGeminiResponse,
  initializeGemini,
  isGeminiInitialized,
  type GeminiStreamChunk,
} from "@/lib/gemini";
import { getAction } from "@/lib/actions";
import type { Action } from "@/types/actions";

export interface UseGeminiResult {
  isStreaming: boolean;
  error: Error | null;
  streamResponse: (
    prompt: string,
    callbacks?: {
      onChunk?: (chunk: GeminiStreamChunk) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    },
  ) => Promise<void>;
  initialize: (apiKey: string) => void;
  initialized: boolean;
}

export interface UseGeminiOptions {
  onChunk?: (chunk: GeminiStreamChunk) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onActionProposed?: (action: Action, parameters?: Record<string, string | number | boolean>) => void;
}

export function useGemini(options: UseGeminiOptions = {}): UseGeminiResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initialize = useCallback((apiKey: string) => {
    try {
      initializeGemini(apiKey);
      setInitialized(isGeminiInitialized());
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setInitialized(false);
    }
  }, []);

  const streamResponse = useCallback(
    async (prompt: string, callbacks?: {
      onChunk?: (chunk: GeminiStreamChunk) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }) => {
      if (!isGeminiInitialized()) {
        const err = new Error("Gemini not initialized. Please provide API key.");
        setError(err);
        callbacks?.onError?.(err);
        options.onError?.(err);
        return;
      }

      setIsStreaming(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        await streamGeminiResponse(prompt, {
          onChunk: (chunk) => {
            if (chunk.proposedAction) {
              // Handle action proposal - get full action from registry
              const action = getAction(chunk.proposedAction.actionId);
              if (action) {
                console.log("📋 [useGemini] Action proposed:", {
                  actionId: chunk.proposedAction.actionId,
                  actionName: action.name,
                  actionDescription: action.description,
                  parameters: chunk.proposedAction.parameters,
                  fullAction: action,
                });
                options.onActionProposed?.(
                  action,
                  chunk.proposedAction.parameters,
                );
              } else {
                console.warn("⚠️ [useGemini] Action not found in registry:", chunk.proposedAction.actionId);
              }
            }
            // Always call both callbacks
            callbacks?.onChunk?.(chunk);
            options.onChunk?.(chunk);
          },
          onComplete: () => {
            setIsStreaming(false);
            callbacks?.onComplete?.();
            options.onComplete?.();
          },
          onError: (err) => {
            setIsStreaming(false);
            setError(err);
            callbacks?.onError?.(err);
            options.onError?.(err);
          },
        });
      } catch (err) {
        setIsStreaming(false);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        callbacks?.onError?.(error);
        options.onError?.(error);
      }
    },
    [options],
  );

  return {
    isStreaming,
    error,
    streamResponse,
    initialize,
    initialized,
  };
}


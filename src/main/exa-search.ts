import Exa from "exa-js";

let exaClient: Exa | null = null;

/**
 * Initialize the Exa client with API key
 */
export function initializeExa(apiKey: string): void {
    exaClient = new Exa(apiKey);
}

/**
 * Check if Exa client is initialized
 */
export function isExaInitialized(): boolean {
    return exaClient !== null;
}

export interface ExaSearchResult {
    url: string;
    title: string;
    text?: string;
    publishedDate?: string;
}

export interface ExaSearchResponse {
    results: ExaSearchResult[];
    query: string;
}

/**
 * Search the web using Exa's neural search
 */
export async function searchWeb(query: string): Promise<ExaSearchResponse> {
    if (!exaClient) {
        throw new Error("Exa client not initialized. Call initializeExa first.");
    }

    try {
        console.log("🔍 [Exa] Searching web for:", query);

        const searchResults = await exaClient.searchAndContents(query, {
            type: "auto",
            text: {
                maxCharacters: 4000,
            },
            numResults: 5,
        });

        console.log("✅ [Exa] Search completed, found", searchResults.results.length, "results");

        const results: ExaSearchResult[] = searchResults.results.map((result: any) => ({
            url: result.url,
            title: result.title,
            text: result.text,
            publishedDate: result.publishedDate,
        }));

        return {
            results,
            query,
        };
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("❌ [Exa] Search failed:", err.message);
        throw err;
    }
}

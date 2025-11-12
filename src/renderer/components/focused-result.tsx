import { Button } from "@/components/ui/button";
import { SearchResultCard } from "@/components/search-result-card";
import type { SearchResult } from "@/components/search-result-card";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusedResultProps {
  result: SearchResult;
  onBack: () => void;
}

export function FocusedResult({ result, onBack }: FocusedResultProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 rounded-full px-3 text-white/80")}
          onClick={onBack}
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(26px) saturate(180%)",
            WebkitBackdropFilter: "blur(26px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </Button>
      </div>
      <div className="flex-1 w-full flex justify-center">
        <div
          className="w-full max-w-4xl rounded-3xl p-3 md:p-4 shadow-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(30px) saturate(200%)",
            WebkitBackdropFilter: "blur(30px) saturate(200%)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.12)",
            minHeight: "60vh",
          }}
        >
          <SearchResultCard result={result} index={0} />
        </div>
      </div>
    </div>
  );
}



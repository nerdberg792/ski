import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  size: "small" | "medium" | "large" | "wide";
}

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  style?: React.CSSProperties;
  onSelect?: (id: string) => void;
}

const SIZE_CLASSES = {
  small: "col-span-1 row-span-1 min-h-[120px]",
  medium: "col-span-1 row-span-2 min-h-[240px]",
  large: "col-span-1 row-span-3 min-h-[360px]",
  wide: "col-span-2 row-span-2 min-h-[240px]",
};

const SNIPPET_CLAMP = {
  small: "line-clamp-2",
  medium: "line-clamp-4",
  large: "line-clamp-6",
  wide: "line-clamp-4",
};

export function SearchResultCard({ result, index, style, onSelect }: SearchResultCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-full",
        SIZE_CLASSES[result.size],
      )}
      style={{
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(26px) saturate(180%)",
        WebkitBackdropFilter: "blur(26px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
        ...style,
      }}
      onClick={() => {
        // Debug: ensure click is captured and propagates to App
        console.log("[SearchResultCard] click", { id: result.id, title: result.title });
        onSelect?.(result.id);
      }}
    >
      <CardHeader className="flex flex-col gap-2 pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle 
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight flex-1"
          >
            {result.title}
          </CardTitle>
          <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-800 transition-colors flex-shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-600 truncate">
            {result.source}
          </span>
          <span className="text-[10px] text-slate-400">
            •
          </span>
          <span className="text-[10px] text-slate-600 truncate max-w-[120px]">
            {result.url}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
        <p 
          className={cn("text-xs leading-relaxed text-slate-800", SNIPPET_CLAMP[result.size])}
        >
          {result.snippet}
        </p>
      </CardContent>
    </Card>
  );
}


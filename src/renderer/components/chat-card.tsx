import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChatEntry } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatCardProps {
  entry: ChatEntry;
  index: number;
  style?: React.CSSProperties;
}

const KIND_BADGE: Record<ChatEntry["kind"], string> = {
  prompt: "Prompt",
  response: "Result",
  action: "Action",
};

export function ChatCard({ entry, index, style }: ChatCardProps) {
  const badgeText = entry.sourceLabel ?? KIND_BADGE[entry.kind];
  return (
    <Card
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden bg-slate-900 shadow-lg",
        "animate-fade-in animate-slide-up",
        entry.highlight && "bg-slate-800 shadow-xl",
      )}
      style={{ animationDelay: `${index * 40}ms`, ...style }}
    >
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={entry.highlight ? "vibrant" : "default"}>
            {badgeText}
          </Badge>
          {entry.timestamp ? (
            <span className="text-xs text-slate-500">
              {entry.timestamp}
            </span>
          ) : null}
        </div>
        <CardTitle>
          {entry.heading}
        </CardTitle>
        {entry.subheading ? (
          <CardDescription>
            {entry.subheading}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entry.body ? (
          entry.kind === "action" ? (
            <pre 
              className="whitespace-pre-wrap rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              {entry.body}
            </pre>
          ) : (
            <p className="text-sm leading-relaxed text-slate-800">
              {entry.body}
            </p>
          )
        ) : null}
        {entry.bullets ? (
          <ul className="flex flex-col gap-1.5">
            {entry.bullets.map((bullet, bulletIndex) => (
              <li
                key={`${entry.id}-bullet-${bulletIndex}`}
                className="flex items-start gap-2 text-sm text-slate-800"
              >
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs text-slate-900">
                  {bulletIndex + 1}
                </span>
                <span className="leading-relaxed">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {entry.footnote ? (
          <p className="text-xs text-slate-600">
            {entry.footnote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}


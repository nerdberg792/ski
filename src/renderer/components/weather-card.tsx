import { Card, CardContent } from "@/components/ui/card";
import { Sun } from "lucide-react";

export function WeatherCard() {
  return (
    <Card 
      className="bg-white shadow-lg"
      style={{
        background: "white",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <CardContent className="flex items-center justify-center p-6 min-h-[120px]">
        <Sun className="h-16 w-16 text-black" strokeWidth={2.5} />
      </CardContent>
    </Card>
  );
}


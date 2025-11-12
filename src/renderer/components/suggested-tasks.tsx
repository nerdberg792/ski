import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  time?: string;
  completed: boolean;
}

const tasks: Task[] = [
  { id: "1", title: "Review project proposal", time: "9:00 AM", completed: false },
  { id: "2", title: "Team standup meeting", time: "10:30 AM", completed: false },
  { id: "3", title: "Finish quarterly report", completed: true },
  { id: "4", title: "Schedule dentist appointment", completed: false },
];

export function SuggestedTasks() {
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-black">Suggested Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-xs text-black",
                task.completed && "line-through text-gray-500"
              )}>
                {task.title}
              </div>
              {task.time && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-[10px] text-gray-500">{task.time}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


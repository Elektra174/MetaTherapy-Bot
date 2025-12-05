import { MessageSquare, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  mode: "therapy" | "analysis" | "welcome";
  onStartSession?: () => void;
}

export function EmptyState({ mode, onStartSession }: EmptyStateProps) {
  if (mode === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Brain className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">
          Добро пожаловать в МПТ Терапевт
        </h2>
        <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
          AI-помощник для практикующих психологов в методе Мета-персональной терапии. 
          Начните новую терапевтическую сессию или загрузите описание сессии для анализа.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={onStartSession} data-testid="button-start-session">
            <MessageSquare className="w-4 h-4 mr-2" />
            Начать сессию
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "therapy") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Готов к работе</h3>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          Опишите запрос клиента или начните диалог. МПТ-терапевт проведет сессию 
          в соответствии со скриптами и принципами Мета-персональной терапии.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Анализ сессий</h3>
      <p className="text-muted-foreground max-w-sm leading-relaxed">
        Опишите проведенную сессию, и МПТ-терапевт проанализирует ее 
        с точки зрения метода МПТ, даст рекомендации и разбор.
      </p>
    </div>
  );
}

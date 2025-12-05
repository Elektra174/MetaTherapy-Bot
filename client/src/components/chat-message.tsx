import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@shared/schema";
import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      data-testid={`message-${message.id}`}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-base leading-relaxed",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border border-card-border"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        {message.scriptReference && (
          <div className="mt-1 px-3 py-1.5 bg-muted/50 rounded-md border-l-2 border-primary/50">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {message.scriptReference}
            </span>
          </div>
        )}
        
        <span className="text-xs text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

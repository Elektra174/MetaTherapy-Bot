import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Session } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  FileText, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionListProps {
  sessions: Session[];
  currentSessionId?: string;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: (mode: "therapy" | "analysis") => void;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: SessionListProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }
    
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const therapySessions = sessions.filter(s => s.mode === "therapy");
  const analysisSessions = sessions.filter(s => s.mode === "analysis");

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <Button 
          onClick={() => onNewSession("therapy")} 
          className="w-full justify-start gap-2"
          data-testid="button-new-therapy-session"
        >
          <Plus className="h-4 w-4" />
          Новая сессия
        </Button>
        <Button 
          onClick={() => onNewSession("analysis")} 
          variant="outline"
          className="w-full justify-start gap-2"
          data-testid="button-new-analysis-session"
        >
          <FileText className="h-4 w-4" />
          Анализ сессии
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {therapySessions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Терапевтические сессии
              </h4>
              <div className="space-y-1">
                {therapySessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onSelect={() => onSelectSession(session)}
                    onDelete={() => onDeleteSession(session.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {analysisSessions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Анализ сессий
              </h4>
              <div className="space-y-1">
                {analysisSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onSelect={() => onSelectSession(session)}
                    onDelete={() => onDeleteSession(session.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет сохраненных сессий
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  formatDate: (timestamp: number) => string;
}

function SessionItem({ session, isActive, onSelect, onDelete, formatDate }: SessionItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "hover-elevate active-elevate-2"
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      data-testid={`session-item-${session.id}`}
    >
      <div className="shrink-0">
        {session.mode === "therapy" ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{session.title}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {session.status === "completed" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          <span>{formatDate(session.updatedAt)}</span>
        </div>
      </div>

      <div className={cn(
        "shrink-0 transition-opacity",
        showDelete ? "opacity-100" : "opacity-0"
      )}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-delete-session-${session.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить сессию?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Сессия "{session.title}" будет удалена навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

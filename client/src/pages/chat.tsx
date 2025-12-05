import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Session, ChatMessage as ChatMessageType } from "@shared/schema";
import {
  getSessions,
  getSession,
  saveSession,
  deleteSession,
  createNewSession,
  addMessageToSession,
} from "@/lib/session-storage";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { EmptyState } from "@/components/empty-state";
import { TypingIndicator } from "@/components/typing-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { KnowledgeBaseDialog } from "@/components/knowledge-base-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, sessionId, mode, history }: { 
      message: string; 
      sessionId: string; 
      mode: "therapy" | "analysis";
      history: Array<{ role: "user" | "assistant"; content: string }>;
    }) => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        sessionId,
        mode,
        history,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (currentSession) {
        const updatedSession = getSession(currentSession.id);
        if (updatedSession) {
          addMessageToSession(updatedSession.id, {
            role: "assistant",
            content: data.response,
            scriptReference: data.scriptReference,
          });
          setCurrentSession(getSession(currentSession.id) || null);
          setSessions(getSessions());
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось получить ответ от терапевта",
        variant: "destructive",
      });
    },
  });

  const handleNewSession = (mode: "therapy" | "analysis") => {
    const session = createNewSession(mode);
    setCurrentSession(session);
    setSessions(getSessions());
  };

  const handleSelectSession = (session: Session) => {
    setCurrentSession(session);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setSessions(getSessions());
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!currentSession) {
      const newSession = createNewSession("therapy");
      setCurrentSession(newSession);
      setSessions(getSessions());
      
      addMessageToSession(newSession.id, {
        role: "user",
        content,
      });

      const updatedSession = getSession(newSession.id);
      setCurrentSession(updatedSession || null);
      setSessions(getSessions());

      chatMutation.mutate({
        message: content,
        sessionId: newSession.id,
        mode: newSession.mode,
        history: [],
      });
      return;
    }

    const existingHistory = currentSession.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    addMessageToSession(currentSession.id, {
      role: "user",
      content,
    });

    const updatedSession = getSession(currentSession.id);
    setCurrentSession(updatedSession || null);
    setSessions(getSessions());

    chatMutation.mutate({
      message: content,
      sessionId: currentSession.id,
      mode: currentSession.mode,
      history: existingHistory,
    });
  };

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar
          sessions={sessions}
          currentSessionId={currentSession?.id}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewSession={handleNewSession}
          onOpenKnowledgeBase={() => setShowKnowledgeBase(true)}
        />
        
        <SidebarInset className="flex flex-col">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {currentSession && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    {currentSession.mode === "therapy" ? (
                      <>
                        <MessageSquare className="h-3 w-3" />
                        Сессия
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3" />
                        Анализ
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {currentSession.title}
                  </span>
                </div>
              )}
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {!currentSession ? (
              <EmptyState 
                mode="welcome" 
                onStartSession={() => handleNewSession("therapy")}
              />
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="max-w-3xl mx-auto">
                    {currentSession.messages.length === 0 ? (
                      <EmptyState mode={currentSession.mode} />
                    ) : (
                      <div className="space-y-1">
                        {currentSession.messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))}
                        {chatMutation.isPending && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="shrink-0 max-w-3xl mx-auto w-full">
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={chatMutation.isPending}
                    placeholder={
                      currentSession.mode === "therapy"
                        ? "Опишите запрос или ситуацию клиента..."
                        : "Опишите проведенную сессию для анализа..."
                    }
                  />
                </div>
              </>
            )}
          </main>
        </SidebarInset>
      </div>

      <KnowledgeBaseDialog
        open={showKnowledgeBase}
        onOpenChange={setShowKnowledgeBase}
      />
    </SidebarProvider>
  );
}

import { Brain, BookOpen, Settings } from "lucide-react";
import { useLocation } from "wouter";
import type { Session } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SessionList } from "@/components/session-list";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  sessions: Session[];
  currentSessionId?: string;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: (mode: "therapy" | "analysis") => void;
  onOpenKnowledgeBase: () => void;
}

export function AppSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  onOpenKnowledgeBase,
}: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">МПТ Терапевт</h1>
            <p className="text-xs text-muted-foreground">AI-помощник</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          onNewSession={onNewSession}
        />
      </SidebarContent>
      
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onOpenKnowledgeBase}
              data-testid="button-knowledge-base"
            >
              <BookOpen className="h-4 w-4" />
              <span>База знаний МПТ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

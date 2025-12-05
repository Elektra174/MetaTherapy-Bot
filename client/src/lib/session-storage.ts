import type { Session, ChatMessage } from "@shared/schema";

const SESSIONS_KEY = "mpt-therapist-sessions";

export function getSessions(): Session[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): Session | undefined {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function createNewSession(mode: "therapy" | "analysis" = "therapy"): Session {
  const now = Date.now();
  const session: Session = {
    id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
    title: mode === "therapy" ? "Новая сессия" : "Анализ сессии",
    messages: [],
    createdAt: now,
    updatedAt: now,
    mode,
    status: "active",
  };
  saveSession(session);
  return session;
}

export function addMessageToSession(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const session = getSession(sessionId);
  if (!session) throw new Error("Session not found");
  
  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  session.messages.push(newMessage);
  session.updatedAt = Date.now();
  
  if (session.messages.length === 1 && message.role === "user") {
    session.title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
  }
  
  saveSession(session);
  return newMessage;
}

export function updateSessionTitle(sessionId: string, title: string): void {
  const session = getSession(sessionId);
  if (!session) return;
  
  session.title = title;
  session.updatedAt = Date.now();
  saveSession(session);
}

export function completeSession(sessionId: string): void {
  const session = getSession(sessionId);
  if (!session) return;
  
  session.status = "completed";
  session.updatedAt = Date.now();
  saveSession(session);
}

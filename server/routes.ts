import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mptKnowledgeBase, mptSystemPrompt, mptAnalysisPrompt } from "./mpt-knowledge";
import { chatRequestSchema, analysisRequestSchema } from "@shared/schema";
import { z } from "zod";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

interface CerebrasMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const chatRequestWithHistorySchema = chatRequestSchema.extend({
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

async function callCerebrasAPI(messages: CerebrasMessage[]): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  
  if (!apiKey) {
    throw new Error("API ключ Cerebras не настроен. Пожалуйста, добавьте CEREBRAS_API_KEY в секреты.");
  }

  try {
    const response = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages,
        max_tokens: 8192,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cerebras API error:", errorText);
      
      if (response.status === 401) {
        throw new Error("Неверный API ключ. Проверьте настройки CEREBRAS_API_KEY.");
      } else if (response.status === 429) {
        throw new Error("Превышен лимит запросов. Пожалуйста, подождите немного и попробуйте снова.");
      } else if (response.status === 503 || response.status === 502) {
        throw new Error("Сервис временно недоступен. Пожалуйста, попробуйте позже.");
      } else {
        throw new Error(`Ошибка сервиса AI (${response.status}). Попробуйте позже.`);
      }
    }

    const data = await response.json() as CerebrasResponse;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Получен пустой ответ от AI. Попробуйте переформулировать запрос.");
    }
    
    return content;
  } catch (error) {
    if (error instanceof Error && error.message.includes("fetch")) {
      throw new Error("Не удалось подключиться к сервису AI. Проверьте интернет-соединение.");
    }
    throw error;
  }
}

function findRelevantScripts(message: string, limit: number = 3) {
  const searchTerms = message.toLowerCase().split(/\s+/).filter(term => term.length > 3);
  
  const scoredScripts = mptKnowledgeBase.map(script => {
    let score = 0;
    const titleLower = script.title.toLowerCase();
    const contentLower = script.content.toLowerCase();
    const categoryLower = script.category.toLowerCase();
    
    for (const term of searchTerms) {
      if (titleLower.includes(term)) score += 10;
      if (categoryLower.includes(term)) score += 5;
      if (script.tags.some(tag => tag.toLowerCase().includes(term))) score += 7;
      if (contentLower.includes(term)) score += 2;
    }
    
    const keyTerms = ['стратегия', 'потребност', 'идентичност', 'запрос', 'эмоци', 'тело', 'интеграц', 'метапозиц', 'сессия', 'принцип'];
    for (const key of keyTerms) {
      if (message.toLowerCase().includes(key)) {
        if (titleLower.includes(key) || contentLower.includes(key) || script.tags.some(t => t.toLowerCase().includes(key))) {
          score += 5;
        }
      }
    }
    
    return { script, score };
  });
  
  return scoredScripts
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.script);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/knowledge-base", (_req: Request, res: Response) => {
    res.json(mptKnowledgeBase);
  });

  app.get("/api/knowledge-base/search", (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    if (!query.trim()) {
      res.json(mptKnowledgeBase);
      return;
    }
    
    const results = findRelevantScripts(query, 10);
    res.json(results);
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const validatedData = chatRequestWithHistorySchema.parse(req.body);
      const { message, mode, history = [] } = validatedData;

      const systemPrompt = mode === "therapy" ? mptSystemPrompt : mptAnalysisPrompt;

      const relevantScripts = findRelevantScripts(message, 2);

      let contextInfo = "";
      if (relevantScripts.length > 0) {
        contextInfo = "\n\n---\nРелевантные скрипты МПТ для контекста:\n" + 
          relevantScripts.map(s => `### ${s.title}\n${s.content.slice(0, 800)}`).join("\n\n");
      }

      const messages: CerebrasMessage[] = [
        {
          role: "system",
          content: systemPrompt + contextInfo,
        },
      ];

      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      messages.push({
        role: "user",
        content: message,
      });

      const responseContent = await callCerebrasAPI(messages);

      const scriptReference = relevantScripts.length > 0 
        ? relevantScripts[0].title 
        : undefined;

      res.json({
        response: responseContent,
        scriptReference,
      });
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const validatedData = analysisRequestSchema.parse(req.body);
      const { sessionTranscript } = validatedData;

      const messages: CerebrasMessage[] = [
        {
          role: "system",
          content: mptAnalysisPrompt,
        },
        {
          role: "user",
          content: `Пожалуйста, проанализируй следующую терапевтическую сессию и дай профессиональную обратную связь с точки зрения метода МПТ:\n\n${sessionTranscript}`,
        },
      ];

      const responseContent = await callCerebrasAPI(messages);

      res.json({
        analysis: responseContent,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ошибка анализа сессии";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    const hasApiKey = !!process.env.CEREBRAS_API_KEY;
    res.json({ 
      status: hasApiKey ? "ok" : "missing_api_key",
      timestamp: new Date().toISOString(),
      scriptsCount: mptKnowledgeBase.length,
    });
  });

  return httpServer;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mptSystemPrompt, mptAnalysisPrompt } from "./mpt-knowledge";
import { chatRequestSchema, analysisRequestSchema, createScriptSchema } from "@shared/schema";
import { getAllScripts, addScript, deleteScript, searchScripts, findRelevantScriptsForChat } from "./script-storage";
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/knowledge-base", async (_req: Request, res: Response) => {
    try {
      const scripts = await getAllScripts();
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      res.status(500).json({ error: "Ошибка загрузки базы знаний" });
    }
  });

  app.get("/api/knowledge-base/search", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || "";
      const results = await searchScripts(query, 10);
      res.json(results);
    } catch (error) {
      console.error("Error searching scripts:", error);
      res.status(500).json({ error: "Ошибка поиска" });
    }
  });

  app.post("/api/knowledge-base", async (req: Request, res: Response) => {
    try {
      const validatedData = createScriptSchema.parse(req.body);
      const newScript = await addScript(validatedData);
      res.status(201).json(newScript);
    } catch (error) {
      console.error("Error adding script:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0]?.message || "Ошибка валидации" });
      } else {
        res.status(500).json({ error: "Ошибка добавления скрипта" });
      }
    }
  });

  app.delete("/api/knowledge-base/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id.startsWith("custom-")) {
        res.status(400).json({ error: "Можно удалять только пользовательские скрипты" });
        return;
      }

      const success = await deleteScript(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Скрипт не найден" });
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      res.status(500).json({ error: "Ошибка удаления скрипта" });
    }
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const validatedData = chatRequestWithHistorySchema.parse(req.body);
      const { message, mode, history = [] } = validatedData;

      const systemPrompt = mode === "therapy" ? mptSystemPrompt : mptAnalysisPrompt;

      const relevantScripts = await findRelevantScriptsForChat(message, 2);

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

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const hasApiKey = !!process.env.CEREBRAS_API_KEY;
      const scripts = await getAllScripts();
      res.json({ 
        status: hasApiKey ? "ok" : "missing_api_key",
        timestamp: new Date().toISOString(),
        scriptsCount: scripts.length,
      });
    } catch (error) {
      res.json({ 
        status: "error",
        timestamp: new Date().toISOString(),
        scriptsCount: 0,
      });
    }
  });

  return httpServer;
}

import { db } from "./db";
import { customScripts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { mptKnowledgeBase } from "./mpt-knowledge";
import type { MPTScript } from "@shared/schema";
import { randomUUID } from "crypto";

export async function getAllScripts(): Promise<MPTScript[]> {
  const customFromDb = await db.select().from(customScripts);
  
  const customMapped: MPTScript[] = customFromDb.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    content: s.content,
    tags: s.tags.split(",").map((t) => t.trim()).filter(Boolean),
    isCustom: true,
  })) as MPTScript[];

  const staticWithFlag = mptKnowledgeBase.map((s) => ({
    ...s,
    isCustom: false,
  })) as MPTScript[];

  return [...staticWithFlag, ...customMapped];
}

export async function addScript(data: {
  title: string;
  category: string;
  content: string;
  tags: string[];
}): Promise<MPTScript> {
  const id = `custom-${randomUUID()}`;
  const tagsStr = data.tags.join(",");

  await db.insert(customScripts).values({
    id,
    title: data.title,
    category: data.category,
    content: data.content,
    tags: tagsStr,
  });

  return {
    id,
    title: data.title,
    category: data.category,
    content: data.content,
    tags: data.tags,
  };
}

export async function deleteScript(id: string): Promise<boolean> {
  if (!id.startsWith("custom-")) {
    return false;
  }

  const result = await db.delete(customScripts).where(eq(customScripts.id, id)).returning();
  return result.length > 0;
}

export async function searchScripts(query: string, limit = 10): Promise<MPTScript[]> {
  const allScripts = await getAllScripts();
  
  if (!query.trim()) {
    return allScripts;
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);

  const scoredScripts = allScripts.map((script) => {
    let score = 0;
    const titleLower = script.title.toLowerCase();
    const contentLower = script.content.toLowerCase();
    const categoryLower = script.category.toLowerCase();

    for (const term of searchTerms) {
      if (titleLower.includes(term)) score += 10;
      if (categoryLower.includes(term)) score += 5;
      if (script.tags.some((tag) => tag.toLowerCase().includes(term))) score += 7;
      if (contentLower.includes(term)) score += 2;
    }

    return { script, score };
  });

  return scoredScripts
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.script);
}

export async function findRelevantScriptsForChat(message: string, limit = 3): Promise<MPTScript[]> {
  const allScripts = await getAllScripts();
  const searchTerms = message.toLowerCase().split(/\s+/).filter((term) => term.length > 3);

  const scoredScripts = allScripts.map((script) => {
    let score = 0;
    const titleLower = script.title.toLowerCase();
    const contentLower = script.content.toLowerCase();
    const categoryLower = script.category.toLowerCase();

    for (const term of searchTerms) {
      if (titleLower.includes(term)) score += 10;
      if (categoryLower.includes(term)) score += 5;
      if (script.tags.some((tag) => tag.toLowerCase().includes(term))) score += 7;
      if (contentLower.includes(term)) score += 2;
    }

    const keyTerms = ['стратегия', 'потребност', 'идентичност', 'запрос', 'эмоци', 'тело', 'интеграц', 'метапозиц', 'сессия', 'принцип'];
    for (const key of keyTerms) {
      if (message.toLowerCase().includes(key)) {
        if (titleLower.includes(key) || contentLower.includes(key) || script.tags.some((t) => t.toLowerCase().includes(key))) {
          score += 5;
        }
      }
    }

    return { script, score };
  });

  return scoredScripts
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.script);
}

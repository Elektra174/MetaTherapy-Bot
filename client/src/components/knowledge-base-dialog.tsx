import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MPTScript } from "@shared/schema";

interface KnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnowledgeBaseDialog({ open, onOpenChange }: KnowledgeBaseDialogProps) {
  const [search, setSearch] = useState("");
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newScript, setNewScript] = useState({
    title: "",
    category: "",
    content: "",
    tags: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: scripts, isLoading, error } = useQuery<MPTScript[]>({
    queryKey: ["/api/knowledge-base"],
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; content: string; tags: string[] }) => {
      const response = await apiRequest("POST", "/api/knowledge-base", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setShowAddForm(false);
      setNewScript({ title: "", category: "", content: "", tags: "" });
      toast({
        title: "Успешно",
        description: "Скрипт добавлен в базу знаний",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить скрипт",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/knowledge-base/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({
        title: "Успешно",
        description: "Скрипт удален",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить скрипт",
        variant: "destructive",
      });
    },
  });

  const handleAddScript = () => {
    const tagsArray = newScript.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!newScript.title || !newScript.category || !newScript.content || tagsArray.length === 0) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({
      title: newScript.title,
      category: newScript.category,
      content: newScript.content,
      tags: tagsArray,
    });
  };

  const filteredScripts = scripts?.filter((script) => {
    const searchLower = search.toLowerCase();
    return (
      script.title.toLowerCase().includes(searchLower) ||
      script.content.toLowerCase().includes(searchLower) ||
      script.category.toLowerCase().includes(searchLower) ||
      script.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const groupedScripts = filteredScripts?.reduce((acc, script) => {
    const category = script.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(script);
    return acc;
  }, {} as Record<string, MPTScript[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              База знаний МПТ
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-2"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddForm ? "Отмена" : "Добавить скрипт"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showAddForm && (
          <div className="px-6 py-4 border-b bg-muted/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  placeholder="Название скрипта"
                  value={newScript.title}
                  onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Input
                  id="category"
                  placeholder="Например: Основные скрипты"
                  value={newScript.category}
                  onChange={(e) => setNewScript({ ...newScript, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                placeholder="стратегия, потребности, метапозиция"
                value={newScript.tags}
                onChange={(e) => setNewScript({ ...newScript, tags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Содержание скрипта</Label>
              <Textarea
                id="content"
                placeholder="Введите содержание скрипта..."
                value={newScript.content}
                onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                rows={6}
              />
            </div>
            <Button
              onClick={handleAddScript}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? "Добавление..." : "Добавить скрипт"}
            </Button>
          </div>
        )}

        <div className="px-6 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по скриптам и методикам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-scripts"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-destructive/50 mb-4" />
              <p className="text-destructive">Ошибка загрузки базы знаний</p>
              <p className="text-sm text-muted-foreground mt-1">Попробуйте обновить страницу</p>
            </div>
          ) : groupedScripts && Object.keys(groupedScripts).length > 0 ? (
            <div className="space-y-6 py-4">
              {Object.entries(groupedScripts).map(([category, categoryScripts]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryScripts.map((script) => (
                      <ScriptCard
                        key={script.id}
                        script={script}
                        isExpanded={expandedScript === script.id}
                        onToggle={() => setExpandedScript(
                          expandedScript === script.id ? null : script.id
                        )}
                        onDelete={() => deleteMutation.mutate(script.id)}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {search ? "Ничего не найдено" : "База знаний пуста"}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ScriptCardProps {
  script: MPTScript;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ScriptCard({ script, isExpanded, onToggle, onDelete, isDeleting }: ScriptCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`script-card-${script.id}`}>
      <div className="flex items-center">
        <button
          className="flex-1 flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{script.title}</h4>
              {script.isCustom && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Пользовательский
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {script.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {script.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{script.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </button>
        {script.isCustom && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t">
          <div className="prose prose-sm dark:prose-invert max-w-none mt-3">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 p-4 rounded-md font-sans">
              {script.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen, X, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MPTScript } from "@shared/schema";

interface KnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnowledgeBaseDialog({ open, onOpenChange }: KnowledgeBaseDialogProps) {
  const [search, setSearch] = useState("");
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

  const { data: scripts, isLoading } = useQuery<MPTScript[]>({
    queryKey: ["/api/knowledge-base"],
    enabled: open,
  });

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
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            База знаний МПТ
          </DialogTitle>
        </DialogHeader>

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
}

function ScriptCard({ script, isExpanded, onToggle }: ScriptCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`script-card-${script.id}`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover-elevate active-elevate-2"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{script.title}</h4>
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

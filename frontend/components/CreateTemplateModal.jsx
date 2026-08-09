"use client";

import { useState, useEffect } from "react";
import { Sparkles, FileText, Lightbulb, BookOpen, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const TEMPLATE_CATEGORIES = [
  "General",
  "Research",
  "Coding",
  "Writing",
  "Data Analysis",
];

export default function TemplatePopover({
  children,
  onCreateTemplate,
  editingTemplate = null,
}) {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [category, setCategory] = useState("General");

  useEffect(() => {
    if (editingTemplate) {
      setTemplateName(editingTemplate.name || "");
      setTemplateContent(editingTemplate.content || "");
      setCategory(editingTemplate.category || "General");
      setOpen(true);
    }
  }, [editingTemplate]);

  const isEditing = !!editingTemplate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (templateName.trim() && templateContent.trim()) {
      const templateData = {
        name: templateName.trim(),
        content: templateContent.trim(),
        category,
        snippet:
          templateContent.trim().slice(0, 100) +
          (templateContent.trim().length > 100 ? "..." : ""),
        createdAt: editingTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        onCreateTemplate({ ...templateData, id: editingTemplate.id });
      } else {
        onCreateTemplate(templateData);
      }

      handleClose();
    }
  };

  const handleClose = () => {
    setTemplateName("");
    setTemplateContent("");
    setCategory("General");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0 bg-white/95 dark:bg-[#0C0C0D]/95 border border-zinc-200/90 dark:border-zinc-800/90 backdrop-blur-2xl shadow-2xl rounded-2xl text-foreground">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-[14.5px] font-extrabold text-foreground leading-none">
                {isEditing ? "Edit Prompt Template" : "Create Prompt Template"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Save reusable prompts & instructions for 1-click execution in chat or / popup.
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Create or edit a prompt template
          </DialogDescription>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">
              Template Title
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="E.g. Competitive Analysis Matrix"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-[13px] font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-2xs"
              autoFocus
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Category Tag
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer select-none border",
                    category === cat
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Template Content / Prompt
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {templateContent.length} chars
              </span>
            </div>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder="Enter your structured prompt template text..."
              rows={5}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-2xs resize-none scrollbar-thin font-normal leading-relaxed"
            />
          </div>

          {/* Hint Card */}
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3.5 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-[11.5px] text-muted-foreground leading-relaxed">
              <span className="font-bold block text-foreground mb-0.5">
                Slash Setup Trigger
              </span>
              Type <code className="px-1 py-0.5 rounded bg-muted text-primary font-mono text-[10px] font-bold">/templates/</code> in the chat input anytime to insert this prompt instantly.
            </div>
          </div>

          <DialogFooter className="mt-5 flex sm:justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!templateName.trim() || !templateContent.trim()}
              className="flex-1 rounded-xl h-9 text-xs font-bold shadow-2xs cursor-pointer"
            >
              {isEditing ? "Update Template" : "Save Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

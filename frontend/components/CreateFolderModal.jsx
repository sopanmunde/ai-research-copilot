"use client";

import { useState } from "react";
import { FolderPlus, Lightbulb, FolderHeart, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

const FOLDER_COLORS = [
  { id: "default", name: "Theme Primary", colorClass: "bg-primary" },
  { id: "blue", name: "Sapphire Blue", colorClass: "bg-blue-500" },
  { id: "purple", name: "Amethyst Purple", colorClass: "bg-purple-500" },
  { id: "emerald", name: "Cyber Emerald", colorClass: "bg-emerald-500" },
  { id: "amber", name: "Sunset Amber", colorClass: "bg-amber-500" },
  { id: "rose", name: "Rose Crimson", colorClass: "bg-rose-500" },
];

export default function FolderPopover({ children, onCreateFolder }) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("default");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim(), selectedColor);
      setFolderName("");
      setSelectedColor("default");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 bg-white/95 dark:bg-[#0C0C0D]/95 border border-zinc-200/90 dark:border-zinc-800/90 backdrop-blur-2xl shadow-2xl rounded-2xl text-foreground">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <FolderPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-[14.5px] font-extrabold text-foreground leading-none">
                Create Workspace Folder
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Organize chats, prompt templates, and docs into custom groups.
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Create a new workspace folder
          </DialogDescription>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="E.g. Q3 Financial Research"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-[13px] font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-2xs"
              autoFocus
            />
          </div>

          {/* Color tag picker */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Folder Accent Tag
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              {FOLDER_COLORS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedColor(col.id)}
                  title={col.name}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all cursor-pointer flex items-center justify-center border border-black/10 dark:border-white/10",
                    col.colorClass,
                    selectedColor === col.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : "opacity-80 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3.5 border border-primary/20">
            <FolderHeart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-[11.5px] text-muted-foreground leading-relaxed">
              <span className="font-bold block text-foreground mb-0.5">
                Workspace Folders
              </span>
              Group related conversations and prompt templates to keep your sidebar organized and easy to navigate.
            </div>
          </div>

          <DialogFooter className="mt-5 flex sm:justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 rounded-xl h-9 text-xs font-bold shadow-2xs cursor-pointer"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

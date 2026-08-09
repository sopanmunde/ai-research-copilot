"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "./ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Trash2, HelpCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModernConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive", // 'destructive', 'warning', 'info'
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-[400px] rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#0C0C0D]/95 backdrop-blur-2xl p-6 shadow-2xl gap-5 flex flex-col items-center overflow-hidden text-foreground">
        {/* Top glowing gradient strip */}
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-[4px] pointer-events-none rounded-t-3xl",
            variant === "destructive"
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-600"
              : variant === "warning"
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
              : "bg-gradient-to-r from-primary via-primary/80 to-primary"
          )}
        />

        <AlertDialogHeader className="flex flex-col items-center gap-3.5 text-center sm:text-center w-full">
          {/* Circular Glowing Icon Shell */}
          <div
            className={cn(
              "flex h-13 w-13 items-center justify-center rounded-2xl shrink-0 border relative transition-all duration-200 shadow-sm",
              variant === "destructive"
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 ring-4 ring-red-500/10"
                : variant === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 ring-4 ring-amber-500/10"
                : "bg-primary/10 border-primary/30 text-primary ring-4 ring-primary/10"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-2xl blur-md opacity-30 pointer-events-none",
                variant === "destructive"
                  ? "bg-red-500"
                  : variant === "warning"
                  ? "bg-amber-500"
                  : "bg-primary"
              )}
            />
            {variant === "destructive" ? (
              <Trash2 className="h-6 w-6 relative z-10 animate-bounce" />
            ) : variant === "warning" ? (
              <AlertTriangle className="h-6 w-6 relative z-10" />
            ) : (
              <ShieldAlert className="h-6 w-6 relative z-10" />
            )}
          </div>

          <div className="space-y-2 w-full">
            <AlertDialogTitle className="text-base font-extrabold text-foreground tracking-tight leading-snug">
              {title}
            </AlertDialogTitle>
            
            {/* Warning Message Box */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-3 text-[12.5px] text-muted-foreground leading-relaxed text-center">
              <AlertDialogDescription className="text-[12.5px] text-muted-foreground leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Footer Buttons */}
        <AlertDialogFooter className="flex flex-row gap-2.5 w-full sm:justify-stretch">
          <AlertDialogPrimitive.Cancel asChild>
            <button
              onClick={onClose}
              className="flex items-center justify-center flex-1 rounded-xl h-10 text-xs font-bold border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-[0.98] outline-none select-none"
            >
              {cancelText}
            </button>
          </AlertDialogPrimitive.Cancel>

          <AlertDialogPrimitive.Action asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm?.();
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 flex-1 rounded-xl h-10 text-xs font-bold text-white shadow-md cursor-pointer transition-all duration-150 active:scale-[0.98] outline-none select-none",
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                  : "bg-primary text-primary-foreground shadow-primary/20"
              )}
            >
              {variant === "destructive" && <Trash2 className="h-3.5 w-3.5" />}
              <span>{confirmText}</span>
            </button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

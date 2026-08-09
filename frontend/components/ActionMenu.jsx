"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActionMenu({
  items = [],
  children,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  className = "",
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 cursor-pointer outline-none"
            aria-label="Open menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "min-w-[155px] rounded-xl p-1.5 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#0C0C0D]/95 backdrop-blur-xl shadow-xl transition-all z-50",
          className
        )}
      >
        {items.map((item, i) => {
          if (item.separator) {
            return <DropdownMenuSeparator key={i} className="my-1 bg-zinc-200/60 dark:bg-zinc-800/60" />;
          }

          const Icon = item.icon;

          return (
            <DropdownMenuItem
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick?.(e);
              }}
              variant={item.danger ? "destructive" : "default"}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold cursor-pointer transition-colors outline-none select-none",
                item.danger
                  ? "text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600"
                  : "text-zinc-700 dark:text-zinc-300 focus:bg-zinc-100 dark:focus:bg-zinc-800/80 focus:text-zinc-950 dark:focus:text-zinc-50"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />}
              <span className="flex-1 leading-none">{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

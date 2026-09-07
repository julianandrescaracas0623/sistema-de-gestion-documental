"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/shared/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/lib/utils";

const STORAGE_PREFIX = "collapse:";

function readStored(storageId: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageId);
    if (raw === "open") return true;
    if (raw === "closed") return false;
  } catch {
    // private mode / disabled storage — fall through
  }
  return fallback;
}

/**
 * A `Card` whose body collapses/expands from its header, remembering the state
 * per `storageId` in `localStorage`. The content stays mounted while collapsed
 * (`forceMount` + `hidden`) so tables inside keep their selection/sort state.
 */
export function CollapsibleCard({
  storageId,
  title,
  actions,
  defaultOpen = true,
  children,
  contentClassName,
  className,
}: {
  storageId: string;
  /** Header label; include any leading icon element here. */
  title: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  contentClassName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(readStored(storageId, defaultOpen));
  }, [storageId, defaultOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_PREFIX + storageId, next ? "open" : "closed");
    } catch {
      // ignore
    }
  };

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
          <CollapsibleTrigger className="group focus-visible:ring-ring/50 -mx-1 flex items-center gap-2 rounded-md px-1 py-0.5 text-base font-semibold outline-none focus-visible:ring-2">
            <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=closed]:-rotate-90" aria-hidden />
            {title}
          </CollapsibleTrigger>
          {actions !== undefined ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        <CollapsibleContent
          forceMount
          className={cn("data-[state=closed]:hidden", contentClassName)}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

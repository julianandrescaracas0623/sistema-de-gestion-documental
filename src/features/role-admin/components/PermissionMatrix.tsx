"use client";

import {
  FileText,
  FolderOpen,
  ShieldCheck,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PermissionCatalogRow } from "@/features/role-admin/queries/permissions.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

export interface PermissionMatrixProps {
  permissions: PermissionCatalogRow[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}

const moduleConfig: Record<string, { label: string; icon: LucideIcon }> = {
  users: { label: "Usuarios", icon: Users },
  roles: { label: "Roles", icon: ShieldCheck },
  documents: { label: "Documentos", icon: FileText },
  categories: { label: "Categorías", icon: FolderOpen },
  tags: { label: "Etiquetas", icon: Tag },
};

function groupByModule(permissions: PermissionCatalogRow[]): Map<string, PermissionCatalogRow[]> {
  const map = new Map<string, PermissionCatalogRow[]>();
  for (const p of permissions) {
    const list = map.get(p.module) ?? [];
    list.push(p);
    map.set(p.module, list);
  }
  return map;
}

export function PermissionMatrix({
  permissions,
  selectedKeys,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const grouped = groupByModule(permissions);

  const toggle = (key: string) => {
    if (disabled) return;
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  };

  const toggleModule = (modulePerms: PermissionCatalogRow[], selectAll: boolean) => {
    if (disabled) return;
    const keys = modulePerms.map((p) => p.key);
    if (selectAll) {
      onChange([...new Set([...selectedKeys, ...keys])]);
    } else {
      onChange(selectedKeys.filter((k) => !keys.includes(k)));
    }
  };

  return (
    <div className="space-y-4" data-testid="permission-matrix">
      {[...grouped.entries()].map(([module, perms]) => {
        const config = moduleConfig[module] ?? { label: module, icon: ShieldCheck };
        const Icon = config.icon;
        const selectedInModule = perms.filter((p) => selectedKeys.includes(p.key)).length;
        const allSelected = selectedInModule === perms.length;

        return (
          <section
            key={module}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="text-primary size-4" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                  <p className="text-muted-foreground text-xs">
                    {String(selectedInModule)} de {String(perms.length)} permisos activos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={allSelected ? "default" : "secondary"} className="tabular-nums">
                  {selectedInModule}/{perms.length}
                </Badge>
                {!disabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      toggleModule(perms, !allSelected);
                    }}
                  >
                    {allSelected ? "Quitar todos" : "Seleccionar todos"}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {perms.map((perm) => {
                const checked = selectedKeys.includes(perm.key);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      toggle(perm.key);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-all",
                      checked
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-muted/40",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background"
                      )}
                      aria-hidden
                    >
                      {checked ? (
                        <svg viewBox="0 0 12 12" className="size-2.5 fill-current">
                          <path d="M10.2 2.4 4.8 8.4 1.8 5.4l1.2-1.2 1.8 1.8 4.2-4.8z" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{perm.name}</span>
                      {perm.description !== null && perm.description !== "" ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {perm.description}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/70 mt-1 block font-mono text-[10px]">
                        {perm.key}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

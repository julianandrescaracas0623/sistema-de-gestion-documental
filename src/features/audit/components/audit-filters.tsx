"use client";

import { Filter, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { actionLabel } from "@/features/audit/lib/audit-labels";
import { buildAuditQuery, type AuditSearchParams } from "@/features/audit/lib/audit-search-params";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";

interface AuditFiltersProps {
  params: AuditSearchParams;
  actions: string[];
}

export function AuditFilters({ params, actions }: AuditFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actor, setActor] = useState(params.actor);
  const [action, setAction] = useState(params.action);
  const [dateFrom, setDateFrom] = useState(params.dateFrom);
  const [dateTo, setDateTo] = useState(params.dateTo);

  useEffect(() => {
    setActor(params.actor);
    setAction(params.action);
    setDateFrom(params.dateFrom);
    setDateTo(params.dateTo);
  }, [params.actor, params.action, params.dateFrom, params.dateTo]);

  const submit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = buildAuditQuery({
      actor,
      action,
      dateFrom,
      dateTo,
      pageSize: params.pageSize,
    });
    startTransition(() => {
      router.push(`/admin/actividad${query}` as Route);
    });
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="text-primary size-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="actor">Usuario (correo)</Label>
            <Input
              id="actor"
              value={actor}
              onChange={(e) => {
                setActor(e.target.value);
              }}
              placeholder="parte del correo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Acción</Label>
            <Select
              id="action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
              }}
            >
              <option value="">Todas</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {actionLabel(a)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Desde</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              max={dateTo !== "" ? dateTo : undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              min={dateFrom !== "" ? dateFrom : undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
              }}
            />
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={isPending} loading={isPending}>
              <Search className="size-4" />
              Aplicar
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/actividad">Limpiar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

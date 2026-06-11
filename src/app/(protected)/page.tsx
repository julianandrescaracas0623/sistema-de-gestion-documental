import {
  FileText,
  FolderOpen,
  Tag,
  Upload,
  Users,
  Clock,
  Files,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { countDocuments, listRecentDocuments } from "@/features/documents/queries/documents.queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { getSession } from "@/shared/lib/auth/get-session";
import { hasPermission } from "@/shared/lib/auth/permissions";
import { createClient } from "@/shared/lib/supabase/server";

export default async function HomePage() {
  const session = await getSession();
  if (session === null) {
    redirect("/login");
    return null;
  }

  const { fullName, roleName, permissions } = session;

  const supabase = await createClient();
  const [{ count: totalDocuments }, { data: recentDocuments }] = await Promise.all([
    countDocuments(supabase),
    listRecentDocuments(supabase, 5),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <p className="text-muted-foreground text-xs tracking-wide">Inicio</p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Panel principal</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Resumen general del sistema</p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-4 lg:px-7 lg:py-5">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido, {fullName}</h2>
            <p className="text-muted-foreground text-sm">
              Gestión documental de la IPS: organiza, busca y controla el acceso según tu rol.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Documentos
              </CardDescription>
              <CardTitle className="text-[28px] font-bold leading-none tabular-nums">
                {totalDocuments ?? "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
              <Files className="text-primary size-4" />
              Registro total de archivos
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Recientes
              </CardDescription>
              <CardTitle className="text-[28px] font-bold leading-none tabular-nums">
                {recentDocuments?.length ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="text-primary size-4" />
                Últimos documentos subidos
              </div>
              {recentDocuments !== null && recentDocuments.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {recentDocuments.slice(0, 3).map((doc) => (
                    <li key={doc.id} className="truncate">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground/60">Sin documentos recientes</span>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm sm:col-span-2 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">Tu rol</CardDescription>
              <CardTitle className="text-[28px] font-bold leading-none">
                {roleName !== "" ? roleName : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
              <ShieldCheck className="text-primary size-4" />
              Permisos aplicados en el sistema
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Accesos rapidos</h3>
            <p className="text-muted-foreground text-sm">
              Acciones principales para el flujo diario de gestión documental.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/documents" className="group block rounded-[var(--radius)]">
              <Card className="border-border h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="bg-primary/10 w-fit rounded-lg p-2">
                    <FileText className="text-primary size-5" />
                  </div>
                  <CardTitle className="text-base">Ver documentos</CardTitle>
                  <CardDescription>Explora y busca en el catálogo de documentos</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {hasPermission(permissions, "documents.create") ? (
              <Link href="/documents/new" className="group block rounded-[var(--radius)]">
                <Card className="border-border h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="gap-3">
                    <div className="bg-accent w-fit rounded-lg p-2">
                      <Upload className="text-accent-foreground size-5" />
                    </div>
                    <CardTitle className="text-base">Subir documento</CardTitle>
                    <CardDescription>Carga nuevos archivos al sistema</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : null}

            {hasPermission(permissions, "users.manage") ? (
              <Link href="/admin/users" className="group block rounded-[var(--radius)]">
                <Card className="border-border h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="gap-3">
                    <div className="bg-primary/10 w-fit rounded-lg p-2">
                      <Users className="text-primary size-5" />
                    </div>
                    <CardTitle className="text-base">Gestión de usuarios</CardTitle>
                    <CardDescription>Administra cuentas y permisos</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : null}

            {hasPermission(permissions, "categories.manage") ? (
              <Link href="/admin/categories" className="group block rounded-[var(--radius)]">
                <Card className="border-border h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="gap-3">
                    <div className="bg-primary/10 w-fit rounded-lg p-2">
                      <FolderOpen className="text-primary size-5" />
                    </div>
                    <CardTitle className="text-base">Categorías</CardTitle>
                    <CardDescription>Organiza la taxonomía documental</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : null}

            {hasPermission(permissions, "tags.manage") ? (
              <Link href="/admin/tags" className="group block rounded-[var(--radius)]">
                <Card className="border-border h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="gap-3">
                    <div className="bg-primary/10 w-fit rounded-lg p-2">
                      <Tag className="text-primary size-5" />
                    </div>
                    <CardTitle className="text-base">Etiquetas</CardTitle>
                    <CardDescription>Gestiona etiquetas de clasificación</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

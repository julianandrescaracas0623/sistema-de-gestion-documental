import {
  FileText,
  Upload,
  Users,
  Clock,
  Files,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { countDocuments, listRecentDocuments } from "@/features/documents/queries/documents.queries";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { getRoleForUser } from "@/shared/lib/auth/get-role-for-user";
import { createClient } from "@/shared/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
    return null;
  }

  const role = await getRoleForUser(supabase, user.id);

  const emailRaw: string | null = user.email as string | null;
  let emailLocalPart: string | null = null;
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions,@typescript-eslint/prefer-optional-chain
  if (emailRaw && emailRaw.includes("@")) {
    const parts = emailRaw.split("@");
    emailLocalPart = parts[0] ?? null;
  }
  const initials = emailLocalPart != null ? emailLocalPart.slice(0, 2).toUpperCase() : "??";
  const metadata = user.user_metadata as Record<string, string | null> | null;
  const firstNameMetadata = metadata != null ? metadata.first_name ?? null : null;
  const firstName = firstNameMetadata ?? emailLocalPart ?? "Usuario";

  // Fetch document stats
  const [{ count: totalDocuments }, { data: recentDocuments }] = await Promise.all([
    countDocuments(supabase),
    listRecentDocuments(supabase, 5),
  ]);

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">Panel principal</h1>
            <p className="text-xs text-muted-foreground">Resumen general del sistema</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
              {role}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{firstName}</span>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {firstName}</h2>
            <p className="text-sm text-muted-foreground">
              Gestión documental de la IPS: organiza, busca y controla el acceso según tu rol.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm bg-[rgba(0,0,1,0)]">
            <CardHeader className="pb-2">
              <CardDescription>Documentos</CardDescription>
              <CardTitle className="text-3xl">{totalDocuments ?? "—"}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
              <Files className="size-4 text-primary" />
              Registro total de archivos
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Recientes</CardDescription>
              <CardTitle className="text-2xl">{recentDocuments?.length ?? 0}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-secondary" />
                Últimos documentos subidos
              </div>
              {recentDocuments !== null && recentDocuments.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {recentDocuments.slice(0, 3).map((doc) => (
                    <li key={doc.id} className="truncate text-muted-foreground">
                      {doc.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground/60">Sin documentos recientes</span>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Tu rol</CardDescription>
              <CardTitle className="capitalize">{role}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-accent" />
              Permisos aplicados en el sistema
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Accesos rapidos</h3>
            <p className="text-sm text-muted-foreground">
              Acciones principales para el flujo diario de gestión documental.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/documents"
              className="group block rounded-xl"
            >
              <Card className="h-full border-border transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="w-fit rounded-lg bg-primary/10 p-2">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Ver documentos</CardTitle>
                  <CardDescription>Explora y busca en el catálogo de documentos</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link
              href="/documents/new"
              className="group block rounded-xl"
            >
              <Card className="h-full border-border transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="w-fit rounded-lg bg-secondary/10 p-2">
                    <Upload className="size-5 text-secondary" />
                  </div>
                  <CardTitle className="text-base">Subir documento</CardTitle>
                  <CardDescription>Carga nuevos archivos al sistema</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {role === "admin" && (
              <Link
                href="/admin/users"
                className="group block rounded-xl"
              >
                <Card className="h-full border-border transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader className="gap-3">
                    <div className="w-fit rounded-lg bg-accent/10 p-2">
                      <Users className="size-5 text-accent" />
                    </div>
                    <CardTitle className="text-base">Gestión de usuarios</CardTitle>
                    <CardDescription>Administra cuentas y permisos</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

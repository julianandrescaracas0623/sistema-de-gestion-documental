"use client";

import {
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Shield,
  ShieldCheck,
  Tag,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/features/auth/actions/logout.action";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import {
  canAccessModule,
  hasAnyAdminNavPermission,
  hasPermission,
  type PermissionKey,
} from "@/shared/lib/auth/permissions";
import { roleLabel } from "@/shared/lib/auth/user-display";
import { cn } from "@/shared/lib/utils";

export interface IpsAppShellProps {
  children: React.ReactNode;
  email: string;
  roleName: string;
  permissions: PermissionKey[];
  initials: string;
  displayName: string;
}

function useNavActive(pathname: string) {
  const isHome = pathname === "/";
  const isUpload = pathname.startsWith("/documents/new");
  const isDocuments =
    pathname.startsWith("/documents") && !pathname.startsWith("/documents/new");
  const isUsers = pathname.startsWith("/admin/users");
  const isRoles = pathname.startsWith("/admin/roles");
  const isCategories = pathname.startsWith("/admin/categories");
  const isTags = pathname.startsWith("/admin/tags");
  return { isHome, isUpload, isDocuments, isUsers, isRoles, isCategories, isTags };
}

function navClick(onNavigate: (() => void) | undefined): { onClick: () => void } | Record<string, never> {
  if (onNavigate === undefined) {
    return {};
  }
  return {
    onClick: () => {
      onNavigate();
    },
  };
}

function SidebarNavLinks({
  pathname,
  permissions,
  onNavigate,
  className,
}: {
  pathname: string;
  permissions: PermissionKey[];
  onNavigate?: () => void;
  className?: string;
}) {
  const { isHome, isUpload, isDocuments, isUsers, isRoles, isCategories, isTags } = useNavActive(pathname);
  const showAdminSection = hasAnyAdminNavPermission(permissions);

  const linkClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/60 hover:bg-white/7 hover:text-sidebar-foreground/90"
    );

  return (
    <nav className={cn("flex flex-col gap-0.5 px-2.5 py-3", className)}>
      <p className="px-2.5 pt-2 pb-1 text-[10.5px] font-semibold tracking-widest text-sidebar-foreground/35 uppercase">
        Principal
      </p>
      <Link href="/" className={linkClass(isHome)} {...navClick(onNavigate)}>
        <Home className="size-4 shrink-0 opacity-90" aria-hidden />
        Inicio
      </Link>
      <Link href="/documents" className={linkClass(isDocuments)} {...navClick(onNavigate)}>
        <FileText className="size-4 shrink-0 opacity-90" aria-hidden />
        Documentos
      </Link>
      {hasPermission(permissions, "documents.create") ? (
        <Link href="/documents/new" className={linkClass(isUpload)} {...navClick(onNavigate)}>
          <Upload className="size-4 shrink-0 opacity-90" aria-hidden />
          Subir documento
        </Link>
      ) : null}

      {showAdminSection ? (
        <>
          <p className="mt-2 px-2.5 pt-2 pb-1 text-[10.5px] font-semibold tracking-widest text-sidebar-foreground/35 uppercase">
            Administración
          </p>
          {canAccessModule(permissions, "users") ? (
            <Link href="/admin/users" className={linkClass(isUsers)} {...navClick(onNavigate)}>
              <Users className="size-4 shrink-0 opacity-90" aria-hidden />
              Usuarios
            </Link>
          ) : null}
          {canAccessModule(permissions, "roles") ? (
            <Link href="/admin/roles" className={linkClass(isRoles)} {...navClick(onNavigate)}>
              <ShieldCheck className="size-4 shrink-0 opacity-90" aria-hidden />
              Roles
            </Link>
          ) : null}
          {canAccessModule(permissions, "categories") ? (
            <Link href="/admin/categories" className={linkClass(isCategories)} {...navClick(onNavigate)}>
              <FolderOpen className="size-4 shrink-0 opacity-90" aria-hidden />
              Categorías
            </Link>
          ) : null}
          {canAccessModule(permissions, "tags") ? (
            <Link href="/admin/tags" className={linkClass(isTags)} {...navClick(onNavigate)}>
              <Tag className="size-4 shrink-0 opacity-90" aria-hidden />
              Etiquetas
            </Link>
          ) : null}
        </>
      ) : null}
    </nav>
  );
}

function SidebarFooter({
  initials,
  displayName,
  roleName,
}: {
  initials: string;
  displayName: string;
  roleName: string;
}) {
  return (
    <div className="border-sidebar-border border-t px-2.5 py-3">
      <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
        <div
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-sidebar-foreground/90">{displayName}</p>
          <p className="text-[11px] text-sidebar-muted">{roleLabel(roleName)}</p>
        </div>
      </div>
      <form action={logoutAction} className="mt-1">
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2 px-2.5 text-sidebar-foreground/40 hover:bg-white/7 hover:text-sidebar-foreground/80"
        >
          <LogOut className="size-3.5" aria-hidden />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="border-sidebar-border border-b px-5 py-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold tracking-tight text-primary-foreground">
          IPS
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground">Salud Integral</p>
          <p className="text-[11px] text-sidebar-muted">Gestión Documental</p>
        </div>
      </div>
    </div>
  );
}

export function IpsAppShell({
  children,
  email,
  roleName,
  permissions,
  initials,
  displayName,
}: IpsAppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderSidebar = (forMobile: boolean) => {
    const onNavigate = forMobile
      ? () => {
          setMobileOpen(false);
        }
      : undefined;
    return (
      <>
        <SidebarBrand />
        <SidebarNavLinks
          pathname={pathname}
          permissions={permissions}
          {...(onNavigate !== undefined ? { onNavigate } : {})}
          className="min-h-0 flex-1 overflow-y-auto"
        />
        <SidebarFooter initials={initials} displayName={displayName} roleName={roleName} />
      </>
    );
  };

  return (
    <div className="bg-background flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-sidebar-border border-r md:flex">
        {renderSidebar(false)}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="bg-card text-card-foreground flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <SheetDescription className="sr-only">Menú principal de la aplicación</SheetDescription>
              <div className="flex h-full flex-col">{renderSidebar(true)}</div>
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Shield className="size-4 text-primary" aria-hidden />
            </div>
            <span className="truncate text-sm font-medium">IPS</span>
          </div>
          <span className="max-w-[40%] truncate text-xs text-muted-foreground" title={email}>
            {email}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { UploadDocumentForm } from "@/features/documents/components/upload-document-form";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { getSession } from "@/shared/lib/auth/get-session";
import { getCachedCategories, getCachedTagsForFilter } from "@/shared/lib/cache/cached-queries";

export default async function NewDocumentPage() {
  const session = await getSession();
  if (session === null) redirect("/login");

  const [categories, availableTags] = await Promise.all([
    getCachedCategories(),
    getCachedTagsForFilter(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <PageBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Documentos", href: "/documents" },
            { label: "Subir" },
          ]}
        />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Subir documento</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Completa los datos y adjunta el archivo.</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents">← Volver al listado</Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <UploadDocumentForm categories={categories} availableTags={availableTags} />
      </div>
    </div>
  );
}

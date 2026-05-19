import Link from "next/link";
import { redirect } from "next/navigation";

import { UploadDocumentForm } from "@/features/documents/components/upload-document-form";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { Button } from "@/shared/components/ui/button";
import { createClient } from "@/shared/lib/supabase/server";

export default async function NewDocumentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
  }

  const { data: categories, error } = await listCategories(supabase);
  if (error !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
          <p className="text-muted-foreground text-xs tracking-wide">
            Inicio <span className="opacity-50">/</span> Documentos <span className="opacity-50">/</span> Subir
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Subir documento</h1>
        </header>
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <p className="text-destructive" role="alert">
            No se pudieron cargar las categorías: {error.message}
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/documents">Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
        <p className="text-muted-foreground text-xs tracking-wide">
          Inicio <span className="opacity-50">/</span> Documentos <span className="opacity-50">/</span> Subir
        </p>
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
        <UploadDocumentForm categories={categories ?? []} />
      </div>
    </div>
  );
}

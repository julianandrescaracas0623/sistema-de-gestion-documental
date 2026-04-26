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
      <main className="container mx-auto max-w-lg p-8">
        <p className="text-destructive" role="alert">
          No se pudieron cargar las categorías: {error.message}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/documents">Volver</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-lg space-y-6 p-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">← Volver al listado</Link>
        </Button>
      </div>
      <UploadDocumentForm categories={categories ?? []} />
    </main>
  );
}

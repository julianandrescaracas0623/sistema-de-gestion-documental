import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DocumentDeleteButton } from "@/features/documents/components/document-delete-button";
import { DocumentMetadataForm } from "@/features/documents/components/document-metadata-form";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { createSignedDocumentUrl } from "@/features/documents/lib/signed-url";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { getDocumentById } from "@/features/documents/queries/documents.queries";
import { Button } from "@/shared/components/ui/button";
import { createClient } from "@/shared/lib/supabase/server";

function canPreviewInline(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/login");
  }

  const [{ data: doc, error }, { data: categories }] = await Promise.all([
    getDocumentById(supabase, id),
    listCategories(supabase),
  ]);

  if (error !== null) {
    return (
      <main className="container mx-auto max-w-3xl p-8">
        <p className="text-destructive" role="alert">
          Error al cargar: {error.message}
        </p>
      </main>
    );
  }
  if (doc === null) {
    notFound();
  }

  const isDeleted = doc.deleted_at !== null;

  const { url: viewUrl } = isDeleted
    ? { url: null }
    : await createSignedDocumentUrl(supabase, doc.storage_object_path);
  const { url: downloadUrl } = isDeleted
    ? { url: null }
    : await createSignedDocumentUrl(supabase, doc.storage_object_path, {
        downloadFileName: doc.file_name,
      });

  const showPreview = !isDeleted && canPreviewInline(doc.mime_type) && viewUrl !== null;
  const tagLabels = doc.document_tags
    .map((r) => (r.tag !== null ? r.tag.name : null))
    .filter((n): n is string => n !== null && n !== "");

  return (
    <main className="container mx-auto max-w-3xl space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">← Volver</Link>
        </Button>
        {downloadUrl !== null ? (
          <Button asChild variant="outline" size="sm">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              Descargar
            </a>
          </Button>
        ) : null}
      </div>

      <div>
        {isDeleted ? (
          <p className="bg-destructive/10 text-destructive mb-2 inline-block rounded-md px-2 py-1 text-xs font-medium">
            Eliminado
          </p>
        ) : null}
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {doc.file_name} · {formatFileSize(doc.size_bytes)} · {doc.mime_type}
        </p>
        {doc.description !== null && doc.description !== "" ? (
          <p className="mt-3 text-sm leading-relaxed">{doc.description}</p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-sm">
          Categoría: {doc.category !== null ? doc.category.name : "—"} · Creado: {new Date(doc.created_at).toLocaleString()}
        </p>
        {tagLabels.length > 0 ? (
          <p className="text-muted-foreground mt-1 text-sm">Etiquetas: {tagLabels.join(", ")}</p>
        ) : null}
      </div>

      {isDeleted ? (
        <p className="text-muted-foreground text-sm">Este documento fue eliminado. La vista previa y la descarga ya no están disponibles.</p>
      ) : showPreview ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Vista previa</h2>
          <div className="bg-muted/30 aspect-[4/3] w-full overflow-hidden rounded-lg border border-border">
            <iframe
              title="Vista previa del documento"
              src={viewUrl}
              className="h-full min-h-[480px] w-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Vista previa no disponible para este tipo de archivo. Usa Descargar para abrirlo en tu equipo.
        </p>
      )}

      {!isDeleted ? (
        <>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Editar metadatos</h2>
            <DocumentMetadataForm document={doc} categories={categories ?? []} />
          </div>
          <div className="border-t border-border pt-6">
            <DocumentDeleteButton documentId={doc.id} />
          </div>
        </>
      ) : null}
    </main>
  );
}

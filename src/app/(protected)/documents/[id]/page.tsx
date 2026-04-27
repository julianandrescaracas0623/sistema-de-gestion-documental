import {
  CalendarDays,
  Download,
  FileText,
  FolderClosed,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DocumentDeleteButton } from "@/features/documents/components/document-delete-button";
import { DocumentMetadataForm } from "@/features/documents/components/document-metadata-form";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { createSignedDocumentUrl } from "@/features/documents/lib/signed-url";
import { listCategories } from "@/features/documents/queries/categories.queries";
import { getDocumentById } from "@/features/documents/queries/documents.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { createClient } from "@/shared/lib/supabase/server";

function canPreviewInline(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}
const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

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
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";

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
    <main className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-5 py-4 shadow-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents">← Volver</Link>
          </Button>
          {downloadUrl !== null ? (
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Descargar
              </a>
            </Button>
          ) : null}
        </header>

        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {isDeleted ? <Badge variant="destructive">Eliminado</Badge> : <Badge variant="outline">Activo</Badge>}
              <Badge variant="outline">{doc.mime_type}</Badge>
            </div>
            <CardTitle className="text-2xl">{doc.title}</CardTitle>
            <CardDescription>
              {doc.file_name} · {formatFileSize(doc.size_bytes)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doc.description !== null && doc.description !== "" ? (
              <p className="text-sm leading-relaxed text-foreground">{doc.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FolderClosed className="size-3.5" />
                {doc.category !== null ? doc.category.name : "Sin categoría"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {DATE_FORMATTER.format(new Date(doc.created_at))}
              </span>
            </div>
            {tagLabels.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {tagLabels.map((label) => (
                  <Badge key={label} variant="outline">
                    <Tag className="size-3" />
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isDeleted ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                Este documento fue eliminado. La vista previa y la descarga ya no están disponibles.
              </p>
            </CardContent>
          </Card>
        ) : showPreview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista previa</CardTitle>
              <CardDescription>
                {isPdf ? "Previsualización PDF en línea" : "Previsualización de imagen"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 min-h-[480px] w-full overflow-hidden rounded-lg border border-border">
                {isImage ? (
                  <img
                    src={viewUrl}
                    alt={`Vista previa de ${doc.title}`}
                    className="h-full max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <iframe
                    title="Vista previa del documento"
                    src={viewUrl}
                    className="h-[70vh] min-h-[480px] w-full"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                Vista previa no disponible para este tipo de archivo. Usa Descargar para abrirlo en tu equipo.
              </p>
            </CardContent>
          </Card>
        )}

        {!isDeleted ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Editar metadatos</CardTitle>
                <CardDescription>Actualiza título, descripción, categoría y etiquetas.</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentMetadataForm
                  document={doc}
                  categories={categories ?? []}
                  secondaryAction={<DocumentDeleteButton documentId={doc.id} />}
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  );
}

import {
  CalendarDays,
  Download,
  FileText,
  FolderClosed,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DocumentDeleteButton } from "@/features/documents/components/document-delete-button";
import { DocumentMetadataForm } from "@/features/documents/components/document-metadata-form";
import { OfficePreview } from "@/features/documents/components/office-preview";
import { formatFileSize } from "@/features/documents/lib/format-bytes";
import { canOfficePreview, canPreviewInline } from "@/features/documents/lib/mime-utils";
import { createSignedDocumentUrl } from "@/features/documents/lib/signed-url";
import { getDocumentById } from "@/features/documents/queries/documents.queries";
import { LocalDate } from "@/shared/components/local-date";
import { PageBreadcrumb } from "@/shared/components/page-breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getSession } from "@/shared/lib/auth/get-session";
import { getCachedCategories, getCachedTagsForFilter } from "@/shared/lib/cache/cached-queries";
import { createClient } from "@/shared/lib/supabase/server";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session === null) redirect("/login");

  const supabase = await createClient();
  const [{ data: doc, error }, categories, availableTags] = await Promise.all([
    getDocumentById(supabase, id),
    getCachedCategories(),
    getCachedTagsForFilter(),
  ]);

  if (error !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="bg-card shrink-0 border-b px-4 py-4 sm:px-6 lg:px-7">
          <p className="text-muted-foreground text-xs tracking-wide">Documentos</p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Detalle</h1>
        </header>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <p className="text-destructive" role="alert">
            Error al cargar: {error.message}
          </p>
        </div>
      </div>
    );
  }
  if (doc === null) {
    notFound();
  }

  const isDeleted = doc.deleted_at !== null;
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";
  const isOffice = canOfficePreview(doc.mime_type);

  const { url: viewUrl } = isDeleted
    ? { url: null }
    : await createSignedDocumentUrl(supabase, doc.storage_object_path);
  const { url: downloadUrl } = isDeleted
    ? { url: null }
    : await createSignedDocumentUrl(supabase, doc.storage_object_path, {
        downloadFileName: doc.file_name,
      });

  const showInlinePreview = !isDeleted && canPreviewInline(doc.mime_type) && viewUrl !== null;
  const showOfficePreview = !isDeleted && isOffice && viewUrl !== null;
  const tagLabels = doc.document_tags
    .map((r) => (r.tag !== null ? r.tag.name : null))
    .filter((n): n is string => n !== null && n !== "");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-card flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:px-7 md:flex-row md:items-center md:justify-between">
        <div>
          <PageBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Documentos", href: "/documents" },
              { label: "Detalle" },
            ]}
          />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Documento</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
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
                <LocalDate date={doc.created_at} />
              </span>
              {doc.uploader !== null ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5" />
                  {doc.uploader.email}
                </span>
              ) : null}
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
        ) : showInlinePreview ? (
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
        ) : showOfficePreview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista previa</CardTitle>
              <CardDescription>
                {isPdf ? "PDF" : doc.mime_type.includes("word") ? "Word" : "Excel"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-xl">
              <OfficePreview url={viewUrl} mime={doc.mime_type} />
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
                  categories={categories}
                  availableTags={availableTags}
                  secondaryAction={<DocumentDeleteButton documentId={doc.id} title={doc.title} />}
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

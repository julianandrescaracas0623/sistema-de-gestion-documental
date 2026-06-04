export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const XLS_MIME = "application/vnd.ms-excel";

export function canPreviewInline(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}

export function canOfficePreview(mime: string): boolean {
  return mime === DOCX_MIME || mime === XLSX_MIME || mime === XLS_MIME;
}

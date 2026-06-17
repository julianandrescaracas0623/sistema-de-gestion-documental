/**
 * File upload utilities
 */

/**
 * Reads a File or Blob as an ArrayBuffer.
 * Uses the Blob API so it runs in Node (Server Actions) and in the browser — FileReader is browser-only.
 */
export async function readUploadFileBuffer(file: File | Blob): Promise<ArrayBuffer> {
	return file.arrayBuffer();
}

/**
 * Validates file size before upload
 * @param file The file to validate
 * @param maxSizeInMB Maximum size in megabytes
 * @returns true if file is within size limit
 */
export function isFileSizeValid(file: File, maxSizeInMB: number): boolean {
	const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
	return file.size <= maxSizeInBytes;
}

/**
 * Gets the file extension from a filename
 */
export function getFileExtension(filename: string): string {
	const parts = filename.split(".");
	if (parts.length > 1) {
		const lastPart = parts[parts.length - 1];
		if (lastPart !== undefined && lastPart !== "") {
			return lastPart.toLowerCase();
		}
	}
	return "";
}

const EXTENSION_TO_MIME: Record<string, string> = {
	pdf: "application/pdf",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	txt: "text/plain",
};

export const ALLOWED_EXTENSIONS = Object.keys(EXTENSION_TO_MIME);

export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_DOCUMENT_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/gif",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
] as const;

const BLOCKED_EXTENSIONS = new Set(["csv"]);

/**
 * Validates if a file type is allowed for upload (MIME + extension fallback; CSV blocked).
 */
export function isFileTypeAllowed(file: File): boolean {
	const ext = getFileExtension(file.name);
	if (BLOCKED_EXTENSIONS.has(ext)) {
		return false;
	}
	if (ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
		return true;
	}
	if (ext !== "" && ext in EXTENSION_TO_MIME) {
		return true;
	}
	return false;
}

export function getFileTypeErrorMessage(): string {
	return "Tipo de archivo no permitido. Usa PDF, imágenes, Office (.doc, .docx, .xls, .xlsx) o texto plano. CSV no está soportado — usa Excel (.xlsx).";
}

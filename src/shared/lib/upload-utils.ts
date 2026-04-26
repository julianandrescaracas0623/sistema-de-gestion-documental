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

/**
 * Validates if a file type is allowed for upload
 */
export function isFileTypeAllowed(file: File): boolean {
	return ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number]);
}

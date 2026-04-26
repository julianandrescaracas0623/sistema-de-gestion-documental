/**
 * Safe FormData text extraction utilities
 * Avoids `no-base-to-string` lint error when extracting values from FormData
 */

/**
 * Safely extracts a text value from FormData
 * Returns empty string if the key doesn't exist or value is null
 */
export function formFieldText(formData: FormData, key: string): string {
	const value = formData.get(key);
	if (value === null) {
		return "";
	}
	// FormDataEntryValue is File | string
	if (typeof value === "string") {
		return value;
	}
	// It's a File, return the name
	return value.name;
}

/**
 * Safely extracts multiple text values from FormData for a given key
 * Returns empty array if no values exist
 */
export function formFieldTextArray(formData: FormData, key: string): string[] {
	const values = formData.getAll(key);
	return values.map((value) => {
		// FormDataEntryValue is File | string
		if (typeof value === "string") {
			return value;
		}
		// It's a File, return the name
		return value.name;
	});
}

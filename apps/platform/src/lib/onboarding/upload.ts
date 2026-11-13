import { huddlekit } from "@/lib/huddle-kit";

const UPLOAD_FAILED = "That file could not be uploaded. Please try again.";

/** A file chosen in a form, or null when none was picked. */
export const chosenFile = (data: FormData, name: string): File | null => {
  const value = data.get(name);
  return value instanceof File && value.size > 0 ? value : null;
};

/**
 * Uploads a private document (an insurance certificate, a DBS certificate) and
 * returns the id the API saves against the record. Throws when it fails.
 */
export const uploadSensitiveFile = async (file: File): Promise<string> => {
  const {
    file: created,
    uploadHeaders,
    uploadUrl,
  } = await huddlekit.files.create({
    contentType: file.type.length > 0 ? file.type : "application/octet-stream",
    fileName: file.name,
    kind: "sensitive",
    sizeBytes: file.size,
  });
  const response = await fetch(uploadUrl, {
    body: file,
    headers: uploadHeaders,
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(UPLOAD_FAILED);
  }
  await huddlekit.files.confirm(created.id);
  return created.id;
};

export { UPLOAD_FAILED };

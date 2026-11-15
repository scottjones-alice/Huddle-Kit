import { huddlekit } from "@/lib/huddle-kit";

/** A file on a person's record: their photo, their cover, or a document. */
export type PersonFile = Awaited<
  ReturnType<typeof huddlekit.people.listPersonFiles>
>["files"][number];

const HEX_RADIX = 16;
const HEX_DIGITS_PER_BYTE = 2;

/** SHA-256 of the file as lower-case hex. Storage needs it for private documents. */
const sha256Hex = async (file: File): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer()
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_BYTE, "0"))
    .join("");
};

/**
 * Sends a file to storage and returns its id once it is confirmed.
 * Photos are public to the club; documents are "sensitive", which storage
 * keeps under stricter rules and checks with a checksum.
 */
const upload = async (file: File, kind: "photo" | "sensitive") => {
  const {
    file: created,
    uploadHeaders,
    uploadUrl,
  } = await huddlekit.files.create({
    checksumSha256: kind === "sensitive" ? await sha256Hex(file) : undefined,
    contentType: file.type.length > 0 ? file.type : "application/octet-stream",
    fileName: file.name,
    kind,
    sizeBytes: file.size,
  });
  const response = await fetch(uploadUrl, {
    body: file,
    headers: uploadHeaders,
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error("The upload to storage failed");
  }
  await huddlekit.files.confirm(created.id);
  return created.id;
};

/** Every file on the person's record the signed-in member may see. */
export const loadPersonFiles = async (
  personId: string
): Promise<PersonFile[]> => {
  const { files } = await huddlekit.people.listPersonFiles(personId);
  return files;
};

/** Replaces the person's profile photo or cover. The old one is deleted. */
export const setPersonImage = async (
  personId: string,
  purpose: "avatar" | "cover",
  file: File
): Promise<void> => {
  const fileId = await upload(file, "photo");
  await huddlekit.people.attachPersonFile(personId, { fileId, purpose });
};

/** Keeps a private document (a consent form, a medical letter) on the person's record. */
export const addPersonDocument = async (
  personId: string,
  file: File
): Promise<void> => {
  const fileId = await upload(file, "sensitive");
  await huddlekit.people.attachPersonFile(personId, {
    fileId,
    purpose: "document",
  });
};

/** Deletes a file from storage and from the person's record. */
export const removePersonFile = async (
  personId: string,
  linkId: string
): Promise<void> => {
  await huddlekit.people.removePersonFile(linkId, { id: personId });
};

/** A temporary link to open a file in a new tab. Each one is logged as a view. */
export const openPersonFile = async (fileId: string): Promise<void> => {
  const { url } = await huddlekit.files.listDownloadURL(fileId);
  window.open(url, "_blank", "noopener,noreferrer");
};

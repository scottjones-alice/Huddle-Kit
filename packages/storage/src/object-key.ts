import type { FileKind } from "@alice/database";

const MAX_NAME_LENGTH = 100;
const PATH_PREFIX = /^.*[\\/]/u;
const UNSAFE_CHARACTERS = /[^A-Za-z0-9._-]+/gu;
const REPEATED_DOTS = /\.{2,}/gu;
const EDGE_SEPARATORS = /^[.-]+|[.-]+$/gu;

/**
 * Makes a user-supplied file name safe to use as the last part of an object key:
 * no directories, no traversal, only letters, digits, dot, dash and underscore.
 */
export const sanitizeFileName = (fileName: string): string => {
  const cleaned = fileName
    .replace(PATH_PREFIX, "")
    .replaceAll(UNSAFE_CHARACTERS, "-")
    .replaceAll(REPEATED_DOTS, ".")
    .replaceAll(EDGE_SEPARATORS, "")
    .slice(0, MAX_NAME_LENGTH);

  return cleaned === "" ? "file" : cleaned;
};

export interface ObjectKeyInput {
  organizationId: string;
  kind: FileKind;
  fileId: string;
  fileName: string;
}

/** `orgs/<organization>/<kind>/<file id>/<safe name>` */
export const buildObjectKey = ({
  organizationId,
  kind,
  fileId,
  fileName,
}: ObjectKeyInput): string =>
  `orgs/${organizationId}/${kind}/${fileId}/${sanitizeFileName(fileName)}`;

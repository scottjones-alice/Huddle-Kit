import { createFieldEncryptor, keyFromBase64 } from "@alice/database";

import { keys } from "@/keys";

const KEY_ID = "k1";

/** Encrypts saved onboarding drafts: they hold children's medical and contact details. */
export const draftEncryptor = createFieldEncryptor({
  activeKeyId: KEY_ID,
  keys: { [KEY_ID]: keyFromBase64(keys().ONBOARDING_DRAFT_KEY) },
});

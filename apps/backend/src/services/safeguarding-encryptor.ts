import { createFieldEncryptor, keyFromBase64 } from "@alice/database";

import { keys } from "@/keys";

const KEY_ID = "k1";

/**
 * Encrypts the free text of safeguarding concerns and notes. It has its own
 * key, apart from the onboarding drafts, so one leaked key does not open both.
 * The `context` passed to encrypt and decrypt is the record's id, so a value
 * copied onto another record will not decrypt.
 */
export const safeguardingEncryptor = createFieldEncryptor({
  activeKeyId: KEY_ID,
  keys: { [KEY_ID]: keyFromBase64(keys().SAFEGUARDING_KEY) },
});

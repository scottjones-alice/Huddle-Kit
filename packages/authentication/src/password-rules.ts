/**
 * Password length limits. One place, used by the server config and by the
 * sign-up and reset forms, so a form can never accept what the server refuses.
 */
export const PASSWORD_LIMITS = { max: 128, min: 12 } as const;

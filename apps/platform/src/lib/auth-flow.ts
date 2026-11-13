import { PASSWORD_LIMITS } from "@alice/authentication/client";

/** Where a signed-in person lands. The home page decides between onboarding and the app. */
export const SIGNED_IN_PATH = "/";

/**
 * A `next` value from the URL, accepted only when it is a path on this app.
 * Anything else (another site, a protocol-relative URL) falls back to home.
 */
export const safeNextPath = (value: string | undefined): string => {
  if (value === undefined || !value.startsWith("/") || value.startsWith("//")) {
    return SIGNED_IN_PATH;
  }
  if (value.includes("\\")) {
    return SIGNED_IN_PATH;
  }
  return value;
};

/**
 * An absolute URL on this app. Better Auth resolves a relative `callbackURL`
 * or `redirectTo` against the API's origin, so links in emails would send
 * people to the API instead of back here. Call from event handlers only.
 */
export const appUrl = (path: string): string =>
  new URL(path, window.location.origin).toString();

/** The verify-email page for an address, carrying where to go once verified. */
export const verifyEmailPath = (email: string, next: string): string => {
  const params = new URLSearchParams({ email });
  if (next !== SIGNED_IN_PATH) {
    params.set("next", next);
  }
  return `/verify-email?${params.toString()}`;
};

/** Shown when the request never got an answer, for example the person is offline. */
export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

const RATE_LIMIT_STATUS = 429;
const NETWORK_STATUS = 0;
const SERVER_ERROR_STATUS = 500;

/** The shape of an error returned by the Better Auth client. */
export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

/** What to show for a failed request, and which field it belongs under. */
export interface AuthProblem {
  /** The input the message belongs to. Absent means it is about the whole form. */
  field?: string;
  message: string;
  /** True when the person cannot fix it themselves (offline, server down). */
  transient: boolean;
}

/** Whether the server refused because of too many attempts. */
export const isRateLimited = (error: AuthErrorLike): boolean =>
  error.status === RATE_LIMIT_STATUS;

interface KnownProblem {
  field?: string;
  match: string;
  message: string;
}

// Matched against the error code, most specific first.
const KNOWN_PROBLEMS: readonly KnownProblem[] = [
  {
    match: "INVALID_EMAIL_OR_PASSWORD",
    message: "That email and password don't match. Check them and try again.",
  },
  {
    field: "email",
    match: "USER_ALREADY_EXISTS",
    message: "An account with this email already exists. Try signing in.",
  },
  {
    field: "email",
    match: "INVALID_EMAIL",
    message: "Enter a valid email address.",
  },
  {
    field: "password",
    match: "PASSWORD_TOO_SHORT",
    message: `Use at least ${PASSWORD_LIMITS.min} characters.`,
  },
  {
    field: "password",
    match: "PASSWORD_TOO_LONG",
    message: `Use ${PASSWORD_LIMITS.max} characters or fewer.`,
  },
  {
    match: "EMAIL_NOT_VERIFIED",
    message: "Verify your email first. We've sent you a new link.",
  },
  {
    match: "CANCELLED",
    message: "Passkey sign-in was cancelled. Try again when you're ready.",
  },
  {
    match: "PASSKEY",
    message:
      "We couldn't use that passkey. Try again, or sign in with your password.",
  },
  {
    match: "RECIPIENT",
    message:
      "This invite was sent to a different email address. Sign in with the address it was sent to.",
  },
  {
    match: "ALREADY_A_MEMBER",
    message: "You're already a member of this club.",
  },
  {
    match: "INVITATION_NOT_FOUND",
    message: "This invite is no longer valid. Ask for a new one.",
  },
];

/** Turns a Better Auth error into a message a person can act on. */
export const describeAuthError = (error: AuthErrorLike): AuthProblem => {
  if (error.status === NETWORK_STATUS) {
    return {
      message: NETWORK_ERROR_MESSAGE,
      transient: true,
    };
  }
  if (error.status !== undefined && error.status >= SERVER_ERROR_STATUS) {
    return {
      message:
        "Something went wrong on our side. Please try again in a moment.",
      transient: true,
    };
  }
  if (isRateLimited(error)) {
    return {
      message: "Too many attempts. Wait a minute and try again.",
      transient: true,
    };
  }

  const code = error.code?.toUpperCase() ?? "";
  const known = KNOWN_PROBLEMS.find((problem) => code.includes(problem.match));
  if (known !== undefined) {
    return { field: known.field, message: known.message, transient: false };
  }

  const serverMessage = error.message?.trim() ?? "";
  return {
    message:
      serverMessage.length > 0
        ? serverMessage
        : "Something went wrong. Please try again.",
    transient: false,
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** Returns a message when the email looks wrong, else null. */
export const emailProblem = (email: string): string | null => {
  if (email.trim().length === 0) {
    return "Enter your email address.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Enter a valid email address, like name@example.com.";
  }
  return null;
};

/** Returns a message when a password breaks the shared rules, else null. */
export const passwordProblem = (password: string): string | null => {
  if (password.length === 0) {
    return "Enter a password.";
  }
  if (password.length < PASSWORD_LIMITS.min) {
    return `Use at least ${PASSWORD_LIMITS.min} characters. ${password.length} so far.`;
  }
  if (password.length > PASSWORD_LIMITS.max) {
    return `Use ${PASSWORD_LIMITS.max} characters or fewer.`;
  }
  return null;
};

/** Reads a string field from a submitted form. */
export const formValue = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

/** Field name to message. Empty means the form is valid. */
export type FieldErrors = Partial<Record<string, string>>;

const MAX_FOCUS_FRAMES = 20;

/**
 * Moves focus to the first input that has an error, so keyboard users land on
 * it. Inputs are disabled while a request is pending, and a disabled input
 * cannot take focus, so this waits frame by frame until React enables it.
 */
export const focusFirstError = (
  form: HTMLFormElement,
  errors: FieldErrors,
  framesLeft = MAX_FOCUS_FRAMES
): void => {
  requestAnimationFrame(() => {
    for (const name of Object.keys(errors)) {
      const input = form.elements.namedItem(name);
      if (!(input instanceof HTMLElement)) {
        continue;
      }
      const blocked = "disabled" in input && input.disabled === true;
      if (blocked && framesLeft > 0) {
        focusFirstError(form, errors, framesLeft - 1);
      } else {
        input.focus();
      }
      return;
    }
  });
};

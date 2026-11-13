import { huddlekit } from "@/lib/huddle-kit";

export type ConnectStatus =
  | "active"
  | "not_connected"
  | "pending"
  | "restricted"
  | "unsupported";

/** Where the club's Stripe account stands, or null when we couldn't find out. */
export const loadConnectStatus = async (): Promise<ConnectStatus | null> => {
  try {
    const { status } = await huddlekit.payments.listConnectAccount();
    return status;
  } catch {
    return null;
  }
};

/** The Stripe page where the club connects its account. Throws on failure. */
export const startConnect = async (): Promise<string> => {
  const { url } = await huddlekit.payments.startConnectOnboarding();
  return url;
};

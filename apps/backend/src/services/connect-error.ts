/** Stripe Connect has no keys yet. The error handler turns this into a 503. */
export class ConnectNotConfiguredError extends Error {
  constructor() {
    super("Card payments are not set up on this server yet");
    this.name = "ConnectNotConfiguredError";
  }
}

/**
 * Public options for `sendmailPlugin(options)`.
 *
 * All fields are optional. On WPMU DEV Hosting the defaults work — most
 * sites call `sendmailPlugin()` with no arguments.
 */
export interface SendmailPluginOptions {
  /**
   * Absolute path to the sendmail binary. Default: `/usr/sbin/sendmail`.
   *
   * Override only if your host puts sendmail somewhere non-standard. On
   * WPMU DEV Hosting you never need to set this.
   */
  sendmailPath?: string;
}

/**
 * Shape of a single outgoing message as EmDash hands it to the
 * `email:deliver` hook. Mirrors core's `EmailMessage` interface
 * (`packages/core/src/plugins/types.ts`) — kept here so we don't take a
 * compile-time dependency on a private core type.
 *
 * Note: there is intentionally NO `from` field. EmDash core does not let
 * callers (or transports) specify the sender at the message level — the
 * From: header is whatever the underlying MTA decides. On WPMU DEV
 * Hosting that's `noreply@yourwpsite.email`, enforced via a Postfix
 * rewrite rule (`*@* noreply@yourwpsite.email Ffs`).
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Event payload for the `email:deliver` hook. Includes a `source`
 * identifier so transports can log which subsystem fired the send
 * (e.g. `"auth/magic-link"`, `"auth/invite"`, `"admin"`, `"plugin:<id>"`).
 */
export interface EmailDeliverEvent {
  message: EmailMessage;
  source: string;
}

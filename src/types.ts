/**
 * Public options for `sendmailPlugin(options)`.
 *
 * All fields are optional with sensible defaults. The most common knob is
 * `transport` — flip between "sendmail" and "smtp" to match what the host
 * actually permits.
 */
export interface SendmailPluginOptions {
  /**
   * Which underlying transport to use.
   *
   * - `"sendmail"` (default): spawn `/usr/sbin/sendmail -t` and pipe the
   *   message in over stdin. Same path PHP `mail()` uses on most shared
   *   hosts (including WPMU DEV Hosting). Works whenever the Node process
   *   has exec permissions on the sendmail binary — which is typical even
   *   when the SSH shell user is restricted.
   *
   * - `"smtp"`: connect to a local (or remote) SMTP relay. Useful if the
   *   host blocks process spawning but exposes Postfix/Exim on localhost.
   *   Configure via `smtp.host` / `smtp.port` / `smtp.auth`.
   */
  transport?: "sendmail" | "smtp";

  /**
   * Fallback `From:` address used when an `email:send` call doesn't supply
   * one. Should match a domain your relay (e.g. MailChannels) is
   * configured to send for, otherwise mail will be rejected.
   *
   * Example: `"no-reply@yourdomain.com"`
   */
  defaultFrom?: string;

  /**
   * Sendmail-specific options (only used when `transport === "sendmail"`).
   */
  sendmail?: {
    /** Absolute path to the sendmail binary. Default: `/usr/sbin/sendmail`. */
    path?: string;
    /** Line-ending style for the message. Default: `"unix"`. */
    newline?: "unix" | "windows";
  };

  /**
   * SMTP-specific options (only used when `transport === "smtp"`).
   */
  smtp?: {
    /** SMTP host. Default: `"localhost"`. */
    host?: string;
    /** SMTP port. Default: `25`. */
    port?: number;
    /** Whether the connection should start in TLS. Default: `false`. */
    secure?: boolean;
    /** Optional SMTP auth (host-dependent — usually not needed for localhost). */
    auth?: { user: string; pass: string };
    /**
     * Reject self-signed / mismatched certs. Default: `false` — many
     * local relays use self-signed certs and we trust localhost.
     */
    rejectUnauthorized?: boolean;
  };
}

/**
 * Shape of a single outgoing message as EmDash hands it to our transport
 * via the `email:deliver` hook. Mirrors core's `EmailMessage` interface
 * but kept here so we don't depend on private core types.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

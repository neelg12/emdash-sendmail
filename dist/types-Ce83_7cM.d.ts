/**
 * Public options for `sendmailPlugin(options)`.
 *
 * All fields are optional. On WPMU DEV Hosting the defaults work — most
 * sites call `sendmailPlugin()` with no arguments.
 */
interface SendmailPluginOptions {
    /**
     * Absolute path to the sendmail binary. Default: `/usr/sbin/sendmail`.
     *
     * Override only if your host puts sendmail somewhere non-standard. On
     * WPMU DEV Hosting you never need to set this.
     */
    sendmailPath?: string;
    /**
     * Domain used in the `Message-ID:` header. Defaults to
     * `"yourwpsite.email"` — the domain WPMU DEV's MTA rewrites every
     * outgoing `From:` to (`*@* noreply@yourwpsite.email Ffs`). Generating
     * Message-IDs against the same domain keeps every visible header
     * aligned, avoids the `@localhost` fallback that some spam scorers
     * frown on, and survives the MTA passthrough unchanged (the rewrite
     * rule touches `From:`/envelope-sender/`Sender:` only — not Message-ID).
     *
     * Override only if you're running on a custom WPMU DEV plan with a
     * different rewrite target. Most sites leave this alone.
     */
    messageIdDomain?: string;
}

export type { SendmailPluginOptions as S };

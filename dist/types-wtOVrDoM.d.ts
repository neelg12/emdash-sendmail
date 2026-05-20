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
}

export type { SendmailPluginOptions as S };

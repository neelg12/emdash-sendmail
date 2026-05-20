import type { PluginDescriptor } from "emdash";
import type { SendmailPluginOptions } from "./types.js";

export type { SendmailPluginOptions };

/**
 * Build the EmDash plugin descriptor for the WPMU DEV sendmail transport.
 *
 * Add to your `astro.config.mjs`:
 *
 * ```ts
 * import { sendmailPlugin } from "@incsub/emdash-sendmail";
 *
 * emdash({
 *   plugins: [sendmailPlugin()],
 * });
 * ```
 *
 * Then click **Rebuild** in the WPMU DEV Hub. EmDash auto-selects the
 * plugin as the active email transport (it's the only one installed), so
 * no further admin action is required — invites, magic links, and any
 * plugin's `ctx.email.send()` call flow through `/usr/sbin/sendmail` →
 * MailChannels immediately after restart.
 *
 * The single available option is `sendmailPath`, an escape hatch for
 * hosts where the binary lives somewhere other than `/usr/sbin/sendmail`.
 * On WPMU DEV Hosting you don't need it.
 */
export function sendmailPlugin(
  options: SendmailPluginOptions = {},
): PluginDescriptor<SendmailPluginOptions> {
  return {
    id: "sendmail-transport",
    version: "0.3.0",
    // Native format — nodemailer depends on Node `child_process`, which
    // doesn't exist in the sandboxed V8 isolate runtime.
    format: "native",
    entrypoint: "@incsub/emdash-sendmail/sandbox",
    options,
  };
}

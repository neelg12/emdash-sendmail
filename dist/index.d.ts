import { PluginDescriptor } from 'emdash';
import { S as SendmailPluginOptions } from './types-Ce83_7cM.js';

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
declare function sendmailPlugin(options?: SendmailPluginOptions): PluginDescriptor<SendmailPluginOptions>;

export { SendmailPluginOptions, sendmailPlugin };

import { PluginDescriptor } from 'emdash';
import { S as SendmailPluginOptions } from './types-BUbGAF9K.js';

/**
 * Build the EmDash plugin descriptor for the sendmail email transport.
 *
 * Add to your `astro.config.mjs`:
 *
 * ```ts
 * import { sendmailPlugin } from "@incsub/emdash-sendmail";
 *
 * emdash({
 *   plugins: [
 *     sendmailPlugin({
 *       transport: "sendmail",                    // or "smtp"
 *       defaultFrom: "no-reply@yourdomain.com",
 *     }),
 *   ],
 * });
 * ```
 *
 * After Hub Rebuild, go to **Admin → Settings → Email** and select
 * **Sendmail Transport** as the active provider.
 *
 * Options are forwarded to `createPlugin` at runtime — they control which
 * transport gets wired into the `email:deliver` exclusive hook.
 */
declare function sendmailPlugin(options?: SendmailPluginOptions): PluginDescriptor<SendmailPluginOptions>;

export { SendmailPluginOptions, sendmailPlugin };

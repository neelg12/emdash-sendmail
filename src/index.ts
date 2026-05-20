import type { PluginDescriptor } from "emdash";
import type { SendmailPluginOptions } from "./types.js";

export type { SendmailPluginOptions };

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
export function sendmailPlugin(
  options: SendmailPluginOptions = {},
): PluginDescriptor<SendmailPluginOptions> {
  return {
    id: "sendmail-transport",
    version: "0.1.0",
    // Native format — nodemailer uses Node net / child_process / dns which
    // aren't available in the sandboxed V8 isolate runtime.
    format: "native",
    entrypoint: "@incsub/emdash-sendmail/sandbox",
    options,
  };
}

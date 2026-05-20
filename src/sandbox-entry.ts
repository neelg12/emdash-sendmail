/**
 * EmDash Sendmail Transport — sandbox entrypoint.
 *
 * EmDash's native plugin loader imports `createPlugin` from this module at
 * runtime and calls it with the plugin descriptor's options. The function
 * returns a fully-resolved plugin definition that registers an exclusive
 * `email:deliver` hook — making this plugin the active email transport
 * for the whole EmDash site.
 */
import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";
import type { Transporter } from "nodemailer";
import type { EmailMessage, SendmailPluginOptions } from "./types.js";
import { createSendmailTransport } from "./transports/sendmail.js";
import { createSmtpTransport } from "./transports/smtp.js";

/**
 * Build the transport plugin. Called by EmDash at runtime via:
 *   import { createPlugin } from "@incsub/emdash-sendmail/sandbox";
 *   createPlugin(descriptor.options);
 */
export function createPlugin(options: SendmailPluginOptions = {}) {
  // Build the transporter once, eagerly, so the cost is paid at plugin
  // activate time rather than on every send. Both transports are cheap to
  // construct — they don't open sockets / spawn processes until sendMail
  // is invoked.
  let transporter: Transporter;
  try {
    transporter =
      options.transport === "smtp"
        ? createSmtpTransport(options.smtp)
        : createSendmailTransport(options.sendmail);
  } catch (e) {
    // If even constructing the transporter fails we want to surface that
    // clearly in EmDash logs rather than silently swallowing it. Re-throw
    // so the plugin fails to load with a visible error.
    throw new Error(
      `[emdash-sendmail] Failed to construct transporter (transport="${
        options.transport ?? "sendmail"
      }"): ${(e as Error).message}`,
    );
  }

  return definePlugin({
    // ─────────────────────────────────────────────────────────────────────
    // Native-format identity fields (required so definePlugin returns a
    // ResolvedPlugin rather than a StandardPluginDefinition).
    // ─────────────────────────────────────────────────────────────────────
    id: "sendmail-transport",
    version: "0.1.0",
    // We register the email-deliver hook — EmDash gates that behind this
    // capability.
    capabilities: ["hooks.email-transport:register"],

    // ─────────────────────────────────────────────────────────────────────
    // Hooks
    // ─────────────────────────────────────────────────────────────────────
    hooks: {
      "plugin:activate": {
        handler: async (_event: unknown, ctx: PluginContext) => {
          const transportName = options.transport ?? "sendmail";
          ctx.log.info(
            `Sendmail Transport activated (transport="${transportName}", ` +
              `defaultFrom="${options.defaultFrom ?? "<none>"}")`,
          );
        },
      },

      // The whole point of the plugin: register as THE email provider.
      // `exclusive: true` means EmDash will refuse to load if another
      // plugin tries to claim this slot — surfacing the conflict instead
      // of silently picking one.
      "email:deliver": {
        exclusive: true,
        handler: async (
          event: { message: EmailMessage },
          ctx: PluginContext,
        ) => {
          const { message } = event;

          // Resolve `from` — explicit message.from wins, then plugin
          // defaultFrom, then a hard fallback. We don't want to surface
          // nodemailer's cryptic "no from address" error to admins.
          const from =
            message.from ??
            options.defaultFrom ??
            "no-reply@localhost";

          try {
            const info = await transporter.sendMail({
              from,
              to: message.to,
              subject: message.subject,
              text: message.text,
              ...(message.html ? { html: message.html } : {}),
              ...(message.replyTo ? { replyTo: message.replyTo } : {}),
            });

            // nodemailer returns a SentMessageInfo with `messageId` /
            // `response` — log it so admins can correlate with relay
            // logs (MailChannels, Postfix, etc).
            ctx.log.info(
              `Email delivered: to="${
                Array.isArray(message.to) ? message.to.join(",") : message.to
              }" ` +
                `subject="${message.subject}" ` +
                `messageId="${info.messageId ?? "<none>"}"`,
            );
          } catch (e) {
            // Re-throw with a prefix so it's obvious in logs which plugin
            // failed. EmDash's email pipeline will mark the send as
            // failed and propagate to the caller.
            const err = e as Error & { code?: string };
            ctx.log.error(
              `Email delivery FAILED via "${
                options.transport ?? "sendmail"
              }" transport: ${err.message}` +
                (err.code ? ` (code=${err.code})` : ""),
            );
            throw new Error(
              `[emdash-sendmail] delivery failed: ${err.message}`,
            );
          }
        },
      },
    },
  });
}

export default createPlugin;

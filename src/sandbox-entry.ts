/**
 * EmDash Sendmail Transport — sandbox entrypoint.
 *
 * EmDash's native plugin loader imports `createPlugin` from this module at
 * runtime and calls it with the descriptor's options. The function returns
 * a fully-resolved plugin definition that registers an exclusive
 * `email:deliver` hook, making this plugin THE active email transport for
 * the whole EmDash site.
 *
 * Scope: built and tested for WPMU DEV Hosting, whose Postfix MTA rewrites
 * From: / envelope-sender / Sender: headers to `noreply@yourwpsite.email`
 * and relays out via MailChannels. That means this plugin does the
 * absolute minimum:
 *
 *   1. Hand the message to `/usr/sbin/sendmail -t` over stdin
 *   2. Log success / failure
 *
 * No address config, no transport modes, no validation — because none of
 * it would change the bytes that hit the recipient's inbox on this host.
 */
import { randomUUID } from "node:crypto";
import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";
import nodemailer from "nodemailer";
import type { EmailDeliverEvent, SendmailPluginOptions } from "./types.js";

/**
 * Default Message-ID domain — matches WPMU DEV's MTA rewrite target so
 * generated Message-IDs visually align with the rewritten `From:` header.
 * Overridable via `sendmailPlugin({ messageIdDomain: "..." })`.
 */
const DEFAULT_MESSAGE_ID_DOMAIN = "yourwpsite.email";

/**
 * Build the transport plugin. Called by EmDash at runtime via:
 *   import { createPlugin } from "@incsub/emdash-sendmail/sandbox";
 *   createPlugin(descriptor.options);
 */
export function createPlugin(options: SendmailPluginOptions = {}) {
  const sendmailPath = options.sendmailPath ?? "/usr/sbin/sendmail";
  const messageIdDomain =
    options.messageIdDomain ?? DEFAULT_MESSAGE_ID_DOMAIN;

  // Construct the nodemailer transporter once at plugin load. Cheap — no
  // process is spawned until sendMail() is invoked.
  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: sendmailPath,
  });

  return definePlugin({
    id: "sendmail-transport",
    version: "1.0.1",
    capabilities: ["hooks.email-transport:register"],

    hooks: {
      "plugin:activate": {
        handler: async (_event: unknown, ctx: PluginContext) => {
          ctx.log.info(
            `[emdash-sendmail] activated ` +
              `(sendmailPath="${sendmailPath}", ` +
              `messageIdDomain="${messageIdDomain}")`,
          );
        },
      },

      // Claim the exclusive transport slot. EmDash auto-selects us when
      // we're the only provider, so no admin action is required after
      // install — the plugin "just works" once activated.
      "email:deliver": {
        exclusive: true,
        handler: async (event: EmailDeliverEvent, ctx: PluginContext) => {
          const { message, source } = event;

          // Generate a clean Message-ID against the configured domain so
          // headers visually align with the MTA-rewritten From:. Nodemailer
          // would otherwise fall back to `<uuid@localhost>` because we
          // (correctly) don't pass a `from`.
          const messageId = `<${randomUUID()}@${messageIdDomain}>`;

          try {
            const info = await transporter.sendMail({
              to: message.to,
              subject: message.subject,
              text: message.text,
              messageId,
              ...(message.html ? { html: message.html } : {}),
              // Intentionally no `from`: the host MTA rewrites From: /
              // envelope-sender / Sender: to `noreply@yourwpsite.email`
              // via its rewrite rule. Setting from here would just be
              // overwritten downstream.
            });

            ctx.log.info(
              `[emdash-sendmail] delivered ` +
                `to="${message.to}" ` +
                `subject="${message.subject}" ` +
                `source="${source}" ` +
                `messageId="${info.messageId ?? messageId}"`,
            );
          } catch (e) {
            const err = e as Error & { code?: string };
            ctx.log.error(
              `[emdash-sendmail] delivery FAILED ` +
                `to="${message.to}" ` +
                `source="${source}" ` +
                `code="${err.code ?? "?"}" ` +
                `message="${err.message}"`,
            );
            // Rethrow so EmDash's email pipeline marks the send as failed
            // and surfaces it to the caller.
            throw err;
          }
        },
      },
    },
  });
}

export default createPlugin;

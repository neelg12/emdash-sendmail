// src/sandbox-entry.ts
import { definePlugin } from "emdash";

// src/transports/sendmail.ts
import nodemailer from "nodemailer";
function createSendmailTransport(opts = {}) {
  return nodemailer.createTransport({
    sendmail: true,
    newline: opts.newline ?? "unix",
    path: opts.path ?? "/usr/sbin/sendmail"
  });
}

// src/transports/smtp.ts
import nodemailer2 from "nodemailer";
function createSmtpTransport(opts = {}) {
  return nodemailer2.createTransport({
    host: opts.host ?? "localhost",
    port: opts.port ?? 25,
    secure: opts.secure ?? false,
    ...opts.auth ? { auth: opts.auth } : {},
    tls: {
      rejectUnauthorized: opts.rejectUnauthorized ?? false
    }
  });
}

// src/sandbox-entry.ts
function createPlugin(options = {}) {
  let transporter;
  try {
    transporter = options.transport === "smtp" ? createSmtpTransport(options.smtp) : createSendmailTransport(options.sendmail);
  } catch (e) {
    throw new Error(
      `[emdash-sendmail] Failed to construct transporter (transport="${options.transport ?? "sendmail"}"): ${e.message}`
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
        handler: async (_event, ctx) => {
          const transportName = options.transport ?? "sendmail";
          ctx.log.info(
            `Sendmail Transport activated (transport="${transportName}", defaultFrom="${options.defaultFrom ?? "<none>"}")`
          );
        }
      },
      // The whole point of the plugin: register as THE email provider.
      // `exclusive: true` means EmDash will refuse to load if another
      // plugin tries to claim this slot — surfacing the conflict instead
      // of silently picking one.
      "email:deliver": {
        exclusive: true,
        handler: async (event, ctx) => {
          const { message } = event;
          const from = message.from ?? options.defaultFrom ?? "no-reply@localhost";
          try {
            const info = await transporter.sendMail({
              from,
              to: message.to,
              subject: message.subject,
              text: message.text,
              ...message.html ? { html: message.html } : {},
              ...message.replyTo ? { replyTo: message.replyTo } : {}
            });
            ctx.log.info(
              `Email delivered: to="${Array.isArray(message.to) ? message.to.join(",") : message.to}" subject="${message.subject}" messageId="${info.messageId ?? "<none>"}"`
            );
          } catch (e) {
            const err = e;
            ctx.log.error(
              `Email delivery FAILED via "${options.transport ?? "sendmail"}" transport: ${err.message}` + (err.code ? ` (code=${err.code})` : "")
            );
            throw new Error(
              `[emdash-sendmail] delivery failed: ${err.message}`
            );
          }
        }
      }
    }
  });
}
var sandbox_entry_default = createPlugin;
export {
  createPlugin,
  sandbox_entry_default as default
};

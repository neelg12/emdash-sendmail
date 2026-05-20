// src/sandbox-entry.ts
import { definePlugin } from "emdash";
import nodemailer from "nodemailer";
function createPlugin(options = {}) {
  const sendmailPath = options.sendmailPath ?? "/usr/sbin/sendmail";
  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: sendmailPath
  });
  return definePlugin({
    id: "sendmail-transport",
    version: "0.3.1",
    capabilities: ["hooks.email-transport:register"],
    hooks: {
      "plugin:activate": {
        handler: async (_event, ctx) => {
          ctx.log.info(
            `[emdash-sendmail] activated (sendmailPath="${sendmailPath}")`
          );
        }
      },
      // Claim the exclusive transport slot. EmDash auto-selects us when
      // we're the only provider, so no admin action is required after
      // install — the plugin "just works" once activated.
      "email:deliver": {
        exclusive: true,
        handler: async (event, ctx) => {
          const { message, source } = event;
          try {
            const info = await transporter.sendMail({
              to: message.to,
              subject: message.subject,
              text: message.text,
              ...message.html ? { html: message.html } : {}
              // Intentionally no `from`: the host MTA rewrites From: /
              // envelope-sender / Sender: to `noreply@yourwpsite.email`
              // via its rewrite rule. Setting from here would just be
              // overwritten downstream.
            });
            ctx.log.info(
              `[emdash-sendmail] delivered to="${message.to}" subject="${message.subject}" source="${source}" messageId="${info.messageId ?? "<none>"}"`
            );
          } catch (e) {
            const err = e;
            ctx.log.error(
              `[emdash-sendmail] delivery FAILED to="${message.to}" source="${source}" code="${err.code ?? "?"}" message="${err.message}"`
            );
            throw err;
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

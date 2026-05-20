import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { SendmailPluginOptions } from "../types.js";

/**
 * Build a nodemailer transporter that connects to an SMTP server.
 *
 * Default config targets `localhost:25` — the address most shared-host
 * Postfix/Exim instances listen on for in-server clients. No auth by
 * default because localhost relays typically don't require it (they
 * accept anything from the loopback interface).
 *
 * If your host requires auth or runs SMTP on a non-standard port, pass
 * `smtp.host` / `smtp.port` / `smtp.auth` in plugin options.
 */
export function createSmtpTransport(
  opts: SendmailPluginOptions["smtp"] = {},
): Transporter {
  return nodemailer.createTransport({
    host: opts.host ?? "localhost",
    port: opts.port ?? 25,
    secure: opts.secure ?? false,
    ...(opts.auth ? { auth: opts.auth } : {}),
    tls: {
      rejectUnauthorized: opts.rejectUnauthorized ?? false,
    },
  });
}

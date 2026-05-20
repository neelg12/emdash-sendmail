import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { SendmailPluginOptions } from "../types.js";

/**
 * Build a nodemailer transporter that pipes messages into the local
 * sendmail binary. The host's sendmail (Postfix / Exim / OpenSMTPD) is
 * expected to relay onward — on WPMU DEV Hosting that means out via
 * MailChannels, same as PHP `mail()`.
 *
 * No network connection involved; messages are written to stdin of a
 * spawned `/usr/sbin/sendmail -t` process. As long as the EmDash Node
 * process can exec that binary, mail flows.
 */
export function createSendmailTransport(
  opts: SendmailPluginOptions["sendmail"] = {},
): Transporter {
  return nodemailer.createTransport({
    sendmail: true,
    newline: opts.newline ?? "unix",
    path: opts.path ?? "/usr/sbin/sendmail",
  });
}

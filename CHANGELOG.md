# Changelog

All notable changes to `@incsub/emdash-sendmail` (maintained by [WPMU DEV](https://wpmudev.com)) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-20

Initial release.

### Added
- Registers as the active EmDash email transport via the `email:deliver` exclusive hook
- Two transports selectable via `transport: "sendmail" | "smtp"` option
  - **sendmail** (default): pipes messages into `/usr/sbin/sendmail -t` — same path PHP `mail()` uses on most shared hosts, including WPMU DEV Hosting (relays out via MailChannels)
  - **smtp**: connects to a host-supplied SMTP relay (default `localhost:25`); useful when process spawning is blocked but a local Postfix/Exim is listening
- `defaultFrom` option as a fallback `From:` for callers that don't supply one
- Structured logging through `ctx.log` — every send logs `to`, `subject`, and the relay's `messageId`; failures log the underlying nodemailer error code for fast diagnosis in the Hub logs
- Fully native-format plugin (runs in-process — required because nodemailer uses Node `net` / `child_process`)

### Known limitations
- Requires the EmDash Node process to have exec permission on `/usr/sbin/sendmail` (sendmail mode) or network access to the configured SMTP host (smtp mode). On locked-down shared hosting, one of the two paths is usually open — the other may not be.
- No retry / queue. If the underlying transport rejects a message, the send fails immediately and EmDash's email pipeline surfaces the error to the caller. Pair with `email:afterSend` retry logic in a separate plugin if you need durability.
- No HTTP-API transports (MailChannels HTTP, Resend, SendGrid). Out of scope for v0.1.
- No PHP-bridge fallback. If both sendmail and SMTP fail on your host, file an issue describing the host setup and we'll evaluate adding one.

[0.1.0]: https://github.com/neelg12/emdash-sendmail/releases/tag/v0.1.0

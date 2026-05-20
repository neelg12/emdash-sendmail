# Changelog

All notable changes to `@incsub/emdash-sendmail` (maintained by [WPMU DEV](https://wpmudev.com)) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] — 2026-05-20

### Fixed

- **`peerDependencies.emdash` lowered from `>=0.13.0` back to `>=0.11.0`** to match the version range that's actually shipped via WPMU DEV Hosting templates (e.g. `@emdash-cms/template-portfolio@0.0.3` pins `emdash@^0.11.1`). 0.3.0's tighter range caused `npm install` to fail on those templates with an `ERESOLVE` peer-conflict error during Hub Rebuild. The email pipeline / `email:deliver` exclusive hook is available in 0.11.x — verified empirically (0.1.0 with the same lower peer range successfully delivered mail on `emdash@0.11.1`), so the looser range is correct. Apologies for the noise.

## [0.3.0] — 2026-05-20

Stable release. The plugin is now scoped explicitly to **WPMU DEV Hosting** and built around the host MTA's behaviour. Configuration surface reduced to a single optional field; the rest is hard-coded to what actually works on the target environment.

### Changed

- **Scope narrowed to WPMU DEV Hosting.** The host's Postfix MTA already rewrites `From:` / envelope-sender / `Sender:` headers to `noreply@yourwpsite.email` via the rewrite rule `*@* noreply@yourwpsite.email Ffs`, and relays out via MailChannels. The plugin now leans on that completely instead of trying to set or validate sender identity from Node — anything we set there would be overwritten downstream anyway. SPF / DKIM / DMARC are also handled host-side.
- **Plugin no longer sets `from`** when calling `nodemailer.sendMail`. EmDash's `EmailMessage` type intentionally has no `from` field (verified against `emdash-cms/emdash` core source at `packages/core/src/plugins/types.ts`), so there's nothing to forward, and setting one on the transport side would be wasted work.
- **`peerDependencies.emdash` raised** from `>=0.9.0` to `>=0.13.0` — the version where the email pipeline (`email:deliver` exclusive hook, `EmailMessage` shape) stabilised. Earlier versions don't have the hook surface we register against.
- **`EmailMessage` type updated** to match core exactly: `to: string` (not `string[]`), `text: string` (required, not optional), `html?: string`. The handler now receives the full event shape `{ message, source }` and logs `source` so operators can see which subsystem fired each send (`auth/magic-link`, `auth/invite`, `admin`, `plugin:<id>`, etc).

### Removed

- **`forceFrom`, `defaultFrom`, `messageIdDomain` options** — all redundant given the host MTA rewrite. From: / envelope sender / Message-ID hostname are decided by the MTA, not by us.
- **SMTP transport mode.** The plugin is now sendmail-only. Other hosts that need SMTP can fork; this package is intentionally scoped.
- **Startup address validation, categorised error labels, transport-construction try/catch.** Removed to keep the surface area minimal. nodemailer errors flow through unchanged with the underlying `code` logged.
- **`src/helpers.ts`, `src/transports/`** — deleted along with the options they supported.

### Migration from 0.2.x

You almost certainly never installed 0.2.x in production. If you did, simplify your `astro.config.mjs`:

```diff
- sendmailPlugin({
-   transport: "sendmail",
-   defaultFrom: "noreply@yourdomain.com",
-   forceFrom: "noreply@yourdomain.com",
- })
+ sendmailPlugin()
```

Bump the dependency and click Rebuild:

```diff
- "@incsub/emdash-sendmail": "github:neelg12/emdash-sendmail#v0.2.0"
+ "@incsub/emdash-sendmail": "github:neelg12/emdash-sendmail#v0.3.0"
```

## [0.2.0] — 2026-05-20

Pre-release. Introduced `forceFrom`, `messageIdDomain`, startup validation, and categorised errors. Superseded by 0.3.0 once we confirmed the host MTA already handles sender identity. Do not use in production.

## [0.1.0] — 2026-05-20

Initial release. Sendmail + SMTP transports with `defaultFrom` option. Superseded by 0.3.0.

[0.3.1]: https://github.com/neelg12/emdash-sendmail/releases/tag/v0.3.1
[0.3.0]: https://github.com/neelg12/emdash-sendmail/releases/tag/v0.3.0
[0.2.0]: https://github.com/neelg12/emdash-sendmail/releases/tag/v0.2.0
[0.1.0]: https://github.com/neelg12/emdash-sendmail/releases/tag/v0.1.0

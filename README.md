# @incsub/emdash-sendmail

> Built and maintained by [WPMU DEV](https://wpmudev.com).

An email transport plugin for [EmDash CMS](https://emdash.dev). Routes outgoing mail through the host's local `sendmail` binary (or a localhost SMTP relay) — the same path PHP `mail()` uses on most shared hosting, including WPMU DEV Hosting. If WordPress emails work on your server, this plugin makes EmDash emails work the same way.

> **Why this plugin exists.** EmDash ships an email pipeline but no production transport — out of the box, calls to `ctx.email.send(...)` throw `EmailNotConfiguredError`, and magic-link / invite / signup flows silently degrade. This plugin fills that gap with the simplest possible transport that works on a shared host.

---

## Features

- **Registers as the active EmDash email transport** via the `email:deliver` exclusive hook
- **Two transports**, switchable via one config line:
  - `sendmail` (default) — spawns `/usr/sbin/sendmail -t`, the same way PHP `mail()` does
  - `smtp` — connects to a localhost (or remote) SMTP relay
- **Structured logging** — every send logs through `ctx.log` so failures are visible in the Hub logs
- **Zero external runtime dependencies** beyond `nodemailer`
- **Same trust path as PHP `mail()`** — if your host's WordPress emails reach the inbox, so do EmDash's

---

## Install

### On WPMU DEV Hosting (recommended workflow)

You can't run `npm install` directly over SSH on locked-down shared hosting. The proper flow is to **edit `package.json` on the server, then click Rebuild in the Hub**, which runs `npm install + npm run build + restart` with the right permissions. Same pattern as the [Contact Form plugin install guide](https://wpmudev.com/docs/hosting/unlimited/#emdash-contact-form-install).

1. SSH into your hosting and edit `package.json` in your EmDash site root:

   ```diff
     "dependencies": {
   +   "@incsub/emdash-sendmail": "github:neelg12/emdash-sendmail#v0.1.0"
     }
   ```

2. Edit `astro.config.mjs`:

   ```js
   import { defineConfig } from "astro/config";
   import emdash from "emdash/astro";
   import { sqlite } from "emdash/db";
   import { sendmailPlugin } from "@incsub/emdash-sendmail";

   export default defineConfig({
     output: "server",
     integrations: [
       emdash({
         database: sqlite({ url: "file:./data.db" }),
         plugins: [
           sendmailPlugin({
             transport: "sendmail",                    // try this first
             defaultFrom: "no-reply@yourdomain.com",   // must be on an allowed sending domain
           }),
         ],
       }),
     ],
   });
   ```

3. **Click Rebuild in the WPMU DEV Hub.** This installs the package and restarts the EmDash app.

4. Open the admin UI → **Settings → Email** → select **Sendmail Transport** as the active provider.

5. Trigger a real email — invite a user, request a magic-link login, or use Settings → Email → "Send test email" if your EmDash version exposes that button. The mail should arrive within seconds via the same MailChannels relay WordPress uses.

### Local development

```bash
npm install github:neelg12/emdash-sendmail#v0.1.0
```

Then wire into `astro.config.mjs` and restart `npx emdash dev`. For local development against an in-progress copy of the plugin:

```bash
npm install file:../path/to/emdash-sendmail
```

> **Local-path installs only** need a small Vite hint to dedupe the symlinked dependencies. Skip this if you installed from GitHub:
>
> ```js
> vite: {
>   resolve: { dedupe: ["emdash", "astro"] },
>   optimizeDeps: { exclude: ["@incsub/emdash-sendmail"] },
> },
> ```

---

## Plugin options

```ts
sendmailPlugin({
  transport: "sendmail",                   // "sendmail" (default) | "smtp"
  defaultFrom: "no-reply@yourdomain.com",  // fallback From: address
  sendmail: {
    path: "/usr/sbin/sendmail",            // absolute path; override if non-standard
    newline: "unix",                       // "unix" | "windows"
  },
  smtp: {
    host: "localhost",                     // SMTP host
    port: 25,                              // SMTP port
    secure: false,                         // start in TLS?
    auth: { user: "...", pass: "..." },    // only if your relay requires it
    rejectUnauthorized: false,             // verify TLS cert chain
  },
})
```

All fields are optional. `transport: "sendmail"` with `defaultFrom` set to your domain's no-reply address is enough for most WPMU DEV Hosting setups.

---

## Picking a transport

| Situation | Use |
| --- | --- |
| WPMU DEV Hosting (default) | `sendmail` |
| WordPress emails on the same server work via `mail()` | `sendmail` |
| Host blocks process spawning but has a local Postfix/Exim | `smtp` (host `localhost`, port `25`) |
| Host provides a remote SMTP relay (e.g. dedicated relay box) | `smtp` with host/port/auth set |
| External SMTP service (Mailgun, SES, Postmark) | `smtp` with credentials |

If you're unsure which one your host permits, start with `sendmail`. If sends fail with `EACCES` / `ENOENT` / "permission denied" in the Hub logs, flip the config to `smtp` and click Rebuild — no other change needed.

---

## How sends flow

```
caller (auth, invite, plugin)
   │
   ▼  ctx.email.send({ to, subject, text, ... })
EmailPipeline (EmDash core)
   │  ├─ runs all `email:beforeSend` hooks
   │  ▼
   │  email:deliver  ◀── this plugin
   │     │
   │     ├─ "sendmail" → spawn /usr/sbin/sendmail -t → MailChannels (or your MTA)
   │     └─ "smtp"     → connect localhost:25 → MailChannels (or your MTA)
   │
   └─ runs all `email:afterSend` hooks
```

EmDash's `email:beforeSend` and `email:afterSend` hooks are still available for other plugins to layer on logging, rate-limiting, retries, or analytics — this plugin only claims the `email:deliver` slot.

---

## Troubleshooting

Email not arriving? In rough order of likelihood on a shared host:

1. **`EACCES` on the sendmail binary** — Node process can't exec `/usr/sbin/sendmail`. Flip `transport: "smtp"` and Rebuild.
2. **`ENOENT` on the sendmail binary** — sendmail is somewhere other than `/usr/sbin/sendmail`. Set `sendmail.path` to the actual path (ask your host).
3. **`ECONNREFUSED` on localhost:25** — local SMTP isn't running, or isn't listening on that port. Ask your host for the SMTP relay address.
4. **Message accepted by the local MTA but never delivered** — the upstream relay (MailChannels) rejected the message, usually because the `From:` domain isn't on the allowed-senders list. Use a `defaultFrom` on your real domain, not a placeholder.
5. **Plugin not selected as active provider** — go to Settings → Email and pick **Sendmail Transport** explicitly. EmDash refuses to auto-pick a transport in production.

Every send (success or failure) logs via `ctx.log` with the transport name and underlying error code. Check the Hub's server logs for `[emdash-sendmail]` entries to see what actually happened.

---

## Privacy & security

| Concern | Mitigation |
| --- | --- |
| **No-auth localhost SMTP relay** | Default — relies on the relay accepting only loopback connections (standard for shared-host Postfix/Exim). Override `smtp.auth` if your relay requires creds |
| **`From:` spoofing** | The plugin trusts whatever `from` value EmDash hands it; EmDash callers should pre-validate. Set `defaultFrom` to a domain you control so callers that omit `from` can't slip through |
| **TLS cert validation** | `rejectUnauthorized` defaults to `false` because many local relays use self-signed certs. Set to `true` if connecting to a remote SMTP service with proper certs |
| **Log content** | Subject lines and recipient addresses are logged at `info`; message bodies are NOT logged |

---

## Limitations

1. **Single transport at a time** — EmDash's `email:deliver` is `exclusive`, so only one provider plugin can be active. Don't enable both this and another email plugin.
2. **No retry / queue** — failed sends throw to the caller. Pair with a separate `email:afterSend` retry plugin if you need durability.
3. **No HTTP-API transports** (MailChannels HTTP, Resend, SendGrid). Out of scope for v0.1.
4. **Trusted (native) format only** — this plugin uses `nodemailer`, which depends on Node's `net` and `child_process`. It can't run in EmDash's sandboxed V8 isolate runtime.

---

## Developing the plugin

```bash
git clone https://github.com/neelg12/emdash-sendmail.git
cd emdash-sendmail
npm install
```

Make your changes in `src/`. Then **build before committing or testing in a consumer site**:

```bash
npm run build       # regenerates dist/
npm run typecheck   # optional: confirms TS is clean
```

The compiled `dist/` is **committed to git** so GitHub installs work without needing the consumer's host to run a build step. If you change `src/` without rebuilding, your changes won't reach consumers until you do `npm run build` and commit `dist/`.

---

## Made by

[WPMU DEV](https://wpmudev.com) — we build managed-hosting and WordPress tooling used by 100k+ agencies. This plugin is part of our exploration of EmDash CMS. Questions, bug reports, or feature requests welcome at [github.com/neelg12/emdash-sendmail/issues](https://github.com/neelg12/emdash-sendmail/issues).

---

## License

MIT — see [LICENSE](./LICENSE).

# @incsub/emdash-sendmail

> Built and maintained by [WPMU DEV](https://wpmudev.com).

An email transport plugin for [EmDash CMS](https://emdash.dev), scoped to **WPMU DEV Hosting**. Routes outgoing mail through the local `sendmail` binary; the host's MTA rewrites sender headers and relays via MailChannels. Zero configuration — install, rebuild, done.

If WordPress emails work on your WPMU DEV server, EmDash emails work the same way after installing this plugin.

**Verified in production:** Real round-trip on `emdash@0.11.1` delivered with **SPF pass, DKIM pass, DMARC pass (`p=REJECT`, strict alignment)** via MailChannels into Gmail. No deliverability blemishes.

---

## Why this plugin exists

EmDash ships an email pipeline but no production transport. Out of the box, calls to `ctx.email.send(...)` throw `EmailNotConfiguredError`, and magic-link / invite / signup flows silently degrade. This plugin fills the gap with the simplest possible transport that works on WPMU DEV's stack.

## What it does

- Registers as the active EmDash email transport via the `email:deliver` exclusive hook
- Hands every outgoing message to `/usr/sbin/sendmail -t` via [nodemailer](https://nodemailer.com)
- Lets the WPMU DEV MTA handle sender identity, SPF/DKIM/DMARC alignment, and MailChannels relaying — none of that is configured in the plugin
- Logs every send (success and failure) through EmDash's `ctx.log` so issues show up in the Hub server logs

That's the whole plugin. ~40 lines of real code, one optional config field, no admin UI.

---

## Install

The standard WPMU DEV Hosting install flow — edit `package.json` on the server, then click **Rebuild** in the Hub.

1. SSH into your hosting and edit `package.json` in your EmDash site root:

   ```diff
     "dependencies": {
   +   "@incsub/emdash-sendmail": "github:neelg12/emdash-sendmail#v1.0.1"
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
         plugins: [sendmailPlugin()],
       }),
     ],
   });
   ```

3. **Click Rebuild in the WPMU DEV Hub.** This runs `npm install + npm run build + restart` with the right permissions.

4. That's it. EmDash auto-selects the plugin as the active email transport (it's the only one installed), so no further admin action is needed. Send a test from **Admin → Settings → Email** to verify.

### Local development

```bash
npm install github:neelg12/emdash-sendmail#v1.0.1
```

Then wire into `astro.config.mjs` and restart `npx emdash dev`. For development against an in-progress copy of the plugin:

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

## Configuration

There are two optional fields. Most sites don't need either:

```ts
sendmailPlugin({
  sendmailPath: "/usr/sbin/sendmail",     // default — only set if your host puts the binary elsewhere
  messageIdDomain: "yourwpsite.email",    // default — matches the MTA's rewrite target
});
```

**You won't need to set anything.** Sender identity (`From:` / envelope sender / `Sender:` / SPF / DKIM / DMARC) is handled entirely by the WPMU DEV MTA — the plugin deliberately leaves all of it alone so the host can do its job. The plugin generates `Message-ID:` headers locally so they align with the MTA-rewritten `From:` (no `@localhost` fallback).

> **What about the From: address?** WPMU DEV's Postfix rewrite rule `*@* noreply@yourwpsite.email Ffs` rewrites three things on every outgoing message: the visible `From:` header, the envelope sender, and the `Sender:` header. All outgoing mail will show as coming from `noreply@yourwpsite.email`, regardless of anything the plugin does. This is by design — it guarantees SPF / DKIM alignment with the relay. If you need a different sender address, ask your hosting support; it isn't something the plugin can override.

---

## How sends flow

```
caller (auth, invite, plugin, admin test-send)
   │
   ▼  ctx.email.send({ to, subject, text, html? })
EmailPipeline (EmDash core)
   │  ├─ email:beforeSend hooks (other plugins can transform / cancel)
   │  ▼
   │  email:deliver  ◀── this plugin (exclusive)
   │     │
   │     └─ /usr/sbin/sendmail -t  →  Postfix (rewrites headers)  →  MailChannels  →  recipient
   │
   └─ email:afterSend hooks (other plugins can log / retry / fire webhooks)
```

EmDash's `email:beforeSend` and `email:afterSend` hooks remain available for layered behaviour from other plugins; this plugin only claims the `email:deliver` slot.

---

## Verifying it works

After install + Rebuild:

1. Go to **Admin → Settings → Email**. The active provider should show as **sendmail-transport**.
2. Send a test email from that page. It should arrive within seconds with `From: noreply@yourwpsite.email`.
3. Tail the Hub server logs while sending — you'll see one `[emdash-sendmail] delivered ...` entry per send.

## Troubleshooting

If sends fail, the Hub logs will show one `[emdash-sendmail] delivery FAILED ...` line per attempt with the underlying nodemailer error code. The two failures you might realistically see on WPMU DEV Hosting:

| Code | What it means | What to do |
| --- | --- | --- |
| `ENOENT` | `/usr/sbin/sendmail` not at that path | Set `sendmailPath` in plugin options to the actual location; ask hosting support if unsure |
| `EACCES` | Node process can't exec sendmail | Contact WPMU DEV support — this shouldn't happen on standard hosting |

Anything else (relay rejections, message-deferred warnings, etc.) is happening downstream of the plugin and is a hosting / MTA / MailChannels matter.

---

## Limitations

1. **WPMU DEV Hosting only.** The defaults assume the host MTA rewrites sender headers. On other hosts, mail will go out with no `From:` header and most relays will reject it. Forks are welcome — see `src/sandbox-entry.ts`.
2. **Single transport at a time.** EmDash's `email:deliver` is exclusive — only one provider plugin can be active. Don't enable this alongside another email plugin.
3. **No retry / queue.** Failed sends throw to the caller. Pair with a separate `email:afterSend` retry plugin if you need durability.
4. **Native plugin only.** Uses nodemailer + Node `child_process`; can't run in EmDash's sandboxed V8 isolate runtime.

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

[WPMU DEV](https://wpmudev.com) — managed hosting and WordPress tooling used by 100k+ agencies. This plugin is part of our exploration of EmDash CMS. Questions, bug reports, or feature requests welcome at [github.com/neelg12/emdash-sendmail/issues](https://github.com/neelg12/emdash-sendmail/issues).

---

## License

MIT — see [LICENSE](./LICENSE).

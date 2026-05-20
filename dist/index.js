// src/index.ts
function sendmailPlugin(options = {}) {
  return {
    id: "sendmail-transport",
    version: "0.1.0",
    // Native format — nodemailer uses Node net / child_process / dns which
    // aren't available in the sandboxed V8 isolate runtime.
    format: "native",
    entrypoint: "@incsub/emdash-sendmail/sandbox",
    options
  };
}
export {
  sendmailPlugin
};

// src/index.ts
function sendmailPlugin(options = {}) {
  return {
    id: "sendmail-transport",
    version: "1.0.1",
    // Native format — nodemailer depends on Node `child_process`, which
    // doesn't exist in the sandboxed V8 isolate runtime.
    format: "native",
    entrypoint: "@incsub/emdash-sendmail/sandbox",
    options
  };
}
export {
  sendmailPlugin
};

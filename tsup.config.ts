import { defineConfig } from "tsup";

/**
 * Build config for the published package.
 *
 * Two entry points map to the two `exports` paths in package.json:
 *   `.`         → dist/index.js          (the descriptor; consumer-facing)
 *   `./sandbox` → dist/sandbox-entry.js  (runtime entrypoint loaded by EmDash)
 *
 * `nodemailer` is left external (peer-installed in the plugin's own
 * dependencies) so we don't re-bundle its hefty internals; consumer's Node
 * resolves it from node_modules at runtime.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "sandbox-entry": "src/sandbox-entry.ts",
  },
  format: ["esm"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: false,
  target: "node18",
  external: ["emdash", "nodemailer"],
});

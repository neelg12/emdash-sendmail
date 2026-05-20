import * as emdash from 'emdash';
import { S as SendmailPluginOptions } from './types-wtOVrDoM.js';

/**
 * Build the transport plugin. Called by EmDash at runtime via:
 *   import { createPlugin } from "@incsub/emdash-sendmail/sandbox";
 *   createPlugin(descriptor.options);
 */
declare function createPlugin(options?: SendmailPluginOptions): emdash.ResolvedPlugin<emdash.PluginStorageConfig>;

export { createPlugin, createPlugin as default };

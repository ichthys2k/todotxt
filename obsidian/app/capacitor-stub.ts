/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian API is used without its type package */
/**
 * Replaces @capacitor/* and @capawesome/* in the Obsidian build.
 *
 * Obsidian mobile itself runs on Capacitor, so the real @capacitor/core would
 * report a native platform and the app would try to use its Android-only
 * plugins (SafStorage). Inside Obsidian the app always behaves like the web /
 * Electron build and gets file access from the plugin bridge instead.
 */
const unavailable = (name: string) =>
  new Proxy(
    {},
    {
      get: (_t, prop) =>
        prop === 'then'
          ? undefined
          : async () => {
              throw new Error(`${name}.${String(prop)} is not available in Obsidian`);
            },
    },
  ) as any;

export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
  isPluginAvailable: () => false,
};

export const registerPlugin = <T = any>(name: string): T => unavailable(name);

export const Filesystem = unavailable('Filesystem');
export const Directory = { Data: 'DATA', Documents: 'DOCUMENTS', Cache: 'CACHE' } as const;
export const Encoding = { UTF8: 'utf8' } as const;

export const GoogleSignIn = unavailable('GoogleSignIn');

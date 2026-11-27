/* eslint-disable @typescript-eslint/no-explicit-any -- reads the parent (Obsidian) window */
/**
 * Makes the embedded app look like the active Obsidian theme.
 *
 * The app colours almost everything with Tailwind's `slate` (neutrals) and
 * `indigo` (accent) scales. Tailwind v4 resolves these through CSS variables
 * (`--color-slate-900`, …), so redefining the variables re-colours the whole
 * app without touching its components:
 * - slate -> mixes of Obsidian's background and text colours (per light/dark),
 *   with the key steps pinned to Obsidian's own variables,
 * - indigo -> Obsidian's accent colour,
 * - fonts -> Obsidian's interface and monospace fonts.
 * Light/dark follows Obsidian (body.theme-dark / body.theme-light).
 */
import { applyTheme } from '../../src/services/themeService';

export const HOST_STYLE_EVENT = 'todotxt:host-style';

const OBSIDIAN_VARS = [
  '--background-primary',
  '--background-secondary',
  '--background-modifier-hover',
  '--background-modifier-border',
  '--background-modifier-border-hover',
  '--text-normal',
  '--text-muted',
  '--text-faint',
  '--text-accent',
  '--text-on-accent',
  '--interactive-accent',
  '--interactive-accent-hover',
  '--font-interface',
  '--font-monospace',
  '--font-ui-medium',
];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Share of text colour mixed into the background for each slate step. */
const MIX_LIGHT: Record<number, number> = { 50: 3, 100: 6, 200: 12, 300: 22, 400: 40, 500: 55, 600: 68, 700: 80, 800: 88, 900: 94, 950: 100 };
const MIX_DARK: Record<number, number> = { 50: 100, 100: 96, 200: 90, 300: 78, 400: 62, 500: 48, 600: 34, 700: 20, 800: 11, 900: 4, 950: 0 };

/** Slate steps that use an Obsidian variable directly. */
const PIN_LIGHT: Record<number, string> = {
  50: 'var(--obs-background-secondary)',
  100: 'var(--obs-background-modifier-hover)',
  200: 'var(--obs-background-modifier-border)',
  400: 'var(--obs-text-faint)',
  500: 'var(--obs-text-muted)',
  900: 'var(--obs-text-normal)',
};
const PIN_DARK: Record<number, string> = {
  50: 'var(--obs-text-normal)',
  200: 'var(--obs-text-normal)',
  400: 'var(--obs-text-muted)',
  500: 'var(--obs-text-faint)',
  800: 'var(--obs-background-modifier-border)',
  900: 'var(--obs-background-secondary)',
  950: 'var(--obs-background-primary)',
};

/** Accent: tints towards white below 500, shades towards black above. */
const ACCENT: Record<number, string> = {
  50: 'color-mix(in srgb, var(--obs-accent) 8%, white)',
  100: 'color-mix(in srgb, var(--obs-accent) 16%, white)',
  200: 'color-mix(in srgb, var(--obs-accent) 30%, white)',
  300: 'color-mix(in srgb, var(--obs-accent) 55%, white)',
  400: 'var(--obs-text-accent)',
  500: 'var(--obs-accent)',
  600: 'var(--obs-accent)',
  700: 'var(--obs-accent-hover)',
  800: 'color-mix(in srgb, var(--obs-accent) 60%, black)',
  900: 'color-mix(in srgb, var(--obs-accent) 40%, black)',
  950: 'color-mix(in srgb, var(--obs-accent) 25%, black)',
};

const buildCss = (vars: Record<string, string>, dark: boolean): string => {
  const obs = OBSIDIAN_VARS.filter((n) => vars[n]).map((n) => `--obs-${n.slice(2)}: ${vars[n]};`);
  obs.push(`--obs-accent: ${vars['--interactive-accent'] || '#7c3aed'};`);
  obs.push(`--obs-accent-hover: ${vars['--interactive-accent-hover'] || vars['--interactive-accent'] || '#6d28d9'};`);

  const mix = dark ? MIX_DARK : MIX_LIGHT;
  const pin = dark ? PIN_DARK : PIN_LIGHT;
  const slate = STEPS.map((s) =>
    `--color-slate-${s}: ${pin[s] ?? `color-mix(in srgb, var(--obs-text-normal) ${mix[s]}%, var(--obs-background-primary))`};`);
  const indigo = STEPS.map((s) => `--color-indigo-${s}: ${ACCENT[s]};`);

  const fontSize = parseFloat(vars['--font-ui-medium'] || '') || 15;
  return `:root {
  ${obs.join('\n  ')}
  ${slate.join('\n  ')}
  ${indigo.join('\n  ')}
  --color-border: var(--obs-background-modifier-border);
  --font-sans: var(--obs-font-interface, ui-sans-serif, system-ui, sans-serif);
  --font-mono: var(--obs-font-monospace, ui-monospace, monospace);
  color-scheme: ${dark ? 'dark' : 'light'};
}
html { font-size: ${fontSize}px; }
html, body { font-family: var(--font-sans); background: ${dark ? 'var(--obs-background-primary)' : 'var(--obs-background-secondary)'}; }
`;
};

/** Reads the current Obsidian theme from the parent window and applies it. */
export const applyHostTheme = (): void => {
  let pdoc: Document;
  let cs: CSSStyleDeclaration;
  try {
    pdoc = (window.parent as any).document;
    cs = (window.parent as any).getComputedStyle(pdoc.body);
  } catch {
    return;
  }
  const dark = pdoc.body.classList.contains('theme-dark');
  const vars: Record<string, string> = {};
  for (const n of OBSIDIAN_VARS) vars[n] = cs.getPropertyValue(n).trim();

  // The app's own light/dark switch follows Obsidian
  localStorage.setItem('todo_txt_app_theme', dark ? 'dark' : 'light');
  applyTheme();

  let style = document.getElementById('ttk-host-theme') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'ttk-host-theme';
  }
  style.textContent = buildCss(vars, dark);
  document.head.appendChild(style); // keep it last, so it wins over the app's CSS
};

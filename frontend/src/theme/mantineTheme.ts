/**
 * ClickLess AI – Assembled Mantine Theme
 *
 * Combines color tokens, semantic CSS variables, and component overrides
 * into one MantineThemeOverride object consumed by MantineProvider.
 *
 * CSS custom properties prefixed --cl-* are injected here so all
 * Mantine component overrides and custom CSS can reference them without
 * hard-coding hex values.
 */
import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { componentOverrides } from './componentOverrides';
import { dark, light } from './colors';

// Build a Mantine-compatible 10-shade tuple from our brand color
// (Mantine 8 requires full tuple for primaryColor)
const brandShades: MantineColorsTuple = [
    '#e6f5fd', // 0
    '#cdeafb', // 1
    '#9cdef8', // 2
    '#6bcdf4', // 3
    '#39bdf1', // 4
    '#2D9CDB', // 5 – brand base
    '#208bc7', // 6
    '#176f9f', // 7
    '#105378', // 8
    '#093750', // 9
];

// Create CSS variable declarations injected into :root
// These become available everywhere as var(--cl-*)
function buildCSSVars(tokens: typeof dark | typeof light): Record<string, string> {
    return {
        '--cl-bg': tokens.bg,
        '--cl-bg-subtle': tokens.bgSubtle,
        '--cl-surface': tokens.surface,
        '--cl-surface-alt': tokens.surfaceAlt,
        '--cl-surface-raised': tokens.surfaceRaised,
        '--cl-border': tokens.border,
        '--cl-border-strong': tokens.borderStrong,
        '--cl-brand': tokens.brand,
        '--cl-brand-soft': tokens.brandSoft,
        '--cl-brand-glow': tokens.brandGlow,
        '--cl-text-primary': tokens.textPrimary,
        '--cl-text-secondary': tokens.textSecondary,
        '--cl-text-muted': tokens.textMuted,
        '--cl-success': tokens.success,
        '--cl-success-soft': tokens.successSoft,
        '--cl-warning': tokens.warning,
        '--cl-warning-soft': tokens.warningSoft,
        '--cl-error': tokens.error,
        '--cl-error-soft': tokens.errorSoft,
        '--cl-info': tokens.info,
        '--cl-info-soft': tokens.infoSoft,
        '--cl-overlay': tokens.overlay,
    };
}

// Build CSS variable blocks for both schemes as a global style string
export function buildGlobalCSSVarsStyle(): string {
    const darkVars = buildCSSVars(dark);
    const lightVars = buildCSSVars(light);
    const toCss = (vars: Record<string, string>) =>
        Object.entries(vars)
            .map(([k, v]) => `  ${k}: ${v};`)
            .join('\n');
    return `
[data-mantine-color-scheme="dark"] {
${toCss(darkVars)}
}
[data-mantine-color-scheme="light"] {
${toCss(lightVars)}
}
  `.trim();
}

export const mantineTheme = createTheme({
    primaryColor: 'brand',
    colors: {
        brand: brandShades,
    },
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontFamilyMonospace: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    headings: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        fontWeight: '600',
    },
    defaultRadius: 'md',
    radius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
    },
    shadows: {
        xs: '0 1px 3px rgba(0,0,0,0.4)',
        sm: '0 2px 8px rgba(0,0,0,0.4)',
        md: '0 4px 16px rgba(0,0,0,0.5)',
        lg: '0 8px 32px rgba(0,0,0,0.6)',
        xl: '0 16px 48px rgba(0,0,0,0.7)',
    },
    focusRing: 'auto',
    components: componentOverrides,
});

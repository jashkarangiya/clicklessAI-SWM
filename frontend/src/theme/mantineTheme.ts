/**
 * ClickLess AI – Assembled Mantine Theme
 *
 * Pearl + Juniper identity system.
 * Combines color tokens, semantic CSS variables, and component overrides.
 *
 * CSS custom properties prefixed --cl-* are injected via globals.css.
 */
import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { componentOverrides } from './componentOverrides';

// Build a Mantine-compatible 10-shade tuple from juniper #1D7A67
const brandShades: MantineColorsTuple = [
    '#E8F6F1', // 0  – tint
    '#C4E8DE', // 1
    '#8ED4C4', // 2
    '#5BBFA8', // 3
    '#44C4A7', // 4  – dark mode brand
    '#1D7A67', // 5  – light mode brand base
    '#176353', // 6  – hover
    '#114E42', // 7
    '#0C3B32', // 8
    '#082923', // 9
];

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
        xs: '6px',
        sm: '10px',
        md: '16px',
        lg: '20px',
        xl: '24px',
    },
    shadows: {
        xs: '0 1px 2px rgba(0,0,0,0.03)',
        sm: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        lg: '0 8px 24px rgba(0,0,0,0.08)',
        xl: '0 16px 48px rgba(0,0,0,0.10)',
    },
    focusRing: 'auto',
    components: componentOverrides,
});

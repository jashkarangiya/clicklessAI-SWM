/**
 * ClickLess AI – Raw Color Tokens
 *
 * !! THIS IS THE ONLY FILE WHERE HEX VALUES ARE ALLOWED !!
 * All components must reference these constants or the semantic tokens derived from them.
 * Changing the brand palette requires only editing this file.
 */

// ---------------------------------------------------------------------------
// DARK PALETTE
// ---------------------------------------------------------------------------
export const dark = {
    bg: '#0A1118',
    bgSubtle: '#0E1721',
    surface: '#131D2A',
    surfaceAlt: '#1A2636',
    surfaceRaised: '#223145',
    border: '#2B3B52',
    borderStrong: '#3D5475',
    brand: '#2D9CDB',
    brandSoft: '#186A9B',
    brandGlow: '#56CCF2',
    // text
    textPrimary: '#F0F6FC',
    textSecondary: '#B1C5D8',
    textMuted: '#768EAB',
    // status
    success: '#34D399',
    successSoft: '#064E3B',
    warning: '#FBBF24',
    warningSoft: '#431407',
    error: '#F87171',
    errorSoft: '#450A0A',
    info: '#60A5FA',
    infoSoft: '#1E3A5F',
    // overlay
    overlay: 'rgba(10,17,24,0.85)',
} as const;

// ---------------------------------------------------------------------------
// LIGHT PALETTE
// ---------------------------------------------------------------------------
export const light = {
    bg: '#F8FAFC',
    bgSubtle: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#E2E8F0',
    surfaceRaised: '#CBD5E1',
    border: '#CBD5E1',
    borderStrong: '#94A3B8',
    brand: '#2D9CDB',
    brandSoft: '#E0F2FE',
    brandGlow: '#0A7EBD',
    // text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    // status
    success: '#059669',
    successSoft: '#D1FAE5',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    error: '#DC2626',
    errorSoft: '#FEE2E2',
    info: '#2563EB',
    infoSoft: '#DBEAFE',
    // overlay
    overlay: 'rgba(15,23,42,0.6)',
} as const;

export type ColorSchemeTokens = typeof dark;
export type ColorSchemeLightTokens = typeof light;

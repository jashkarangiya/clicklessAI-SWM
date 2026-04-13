/**
 * ClickLess AI – Raw Color Tokens
 *
 * Theme: Ink / Pearl / Cobalt
 *
 * !! THIS IS THE ONLY FILE WHERE HEX VALUES ARE ALLOWED !!
 * All components must reference these constants or the semantic tokens derived from them.
 *
 * Palette logic:
 *   Ink Teal (#0C7A8A / #1FC8DC) — primary action (precise, commerce-grade, distinctive)
 *     Sits between blue and green — neither techy-generic nor earthy. Reads as
 *     intelligent precision: the color of instruments, data, trust in commerce.
 *   Mint   (#12936F / #22C98A) — status and success only, never a CTA
 *   Amber  (#B88343 / #D4A055) — tiny editorial support note, never a main UI color
 *   Iris   (#7569E6 / #A091FF) — secondary insight accent
 *   Light  — pearl canvas, white surfaces, ink typography
 *   Dark   — deep ink canvas, ocean-dark surfaces, mist typography
 */

// ---------------------------------------------------------------------------
// LIGHT PALETTE — Pearl + Cobalt
// ---------------------------------------------------------------------------
export const light = {
    // canvas & surfaces
    bg:              '#F7F6F3',
    bgSubtle:        '#F0EDE8',
    surface:         '#FFFFFF',
    surfaceAlt:      '#F8FAFC',
    surfaceRaised:   '#F2F5FA',
    // borders
    border:          '#E6EAF0',
    borderStrong:    '#D8DEE8',
    // ink teal — primary action
    brand:           '#0C7A8A',
    brandSoft:       '#E6F6F9',
    brandGlow:       '#0A6878',
    // amber — editorial support only
    accentGold:      '#B88343',
    accentGoldSoft:  '#FAF1E6',
    // iris — secondary insight
    accentIris:      '#7569E6',
    accentIrisSoft:  '#F0EEFF',
    // typography
    textPrimary:     '#142033',
    textSecondary:   '#617084',
    textMuted:       '#8B96A6',
    // mint — status/success only
    success:         '#12936F',
    successSoft:     '#EAF8F2',
    // warning
    warning:         '#B87A2A',
    warningSoft:     '#FFF3E0',
    // error
    error:           '#C94D4D',
    errorSoft:       '#FFF1F1',
    // info
    info:            '#0C7A8A',
    infoSoft:        '#E6F6F9',
    // dark band for trust/contrast sections
    inverseBg:       '#0A1B20',
    inverseSurface:  '#102530',
    inverseText:     '#F0F7F9',
    inverseMuted:    '#94AEBA',
    // overlay
    overlay:         'rgba(10,20,28,0.4)',
} as const;

// ---------------------------------------------------------------------------
// DARK PALETTE — Ink / Deep Navy
// ---------------------------------------------------------------------------
export const dark = {
    // canvas & surfaces
    bg:              '#0A0F15',
    bgSubtle:        '#0E1520',
    surface:         '#101721',
    surfaceAlt:      '#121B26',
    surfaceRaised:   '#15202E',
    // borders
    border:          '#1E2A38',
    borderStrong:    '#283548',
    // ink teal — primary action
    brand:           '#1FC8DC',
    brandSoft:       '#0C2D35',
    brandGlow:       '#18B3C6',
    // amber — editorial support only
    accentGold:      '#D4A055',
    accentGoldSoft:  '#2E2010',
    // iris
    accentIris:      '#A091FF',
    accentIrisSoft:  '#241F3E',
    // typography
    textPrimary:     '#EEF4F7',
    textSecondary:   '#90A4AE',
    textMuted:       '#607080',
    // mint — status/success only
    success:         '#22C98A',
    successSoft:     '#0A2E20',
    // warning
    warning:         '#D4A055',
    warningSoft:     '#2E2010',
    // error
    error:           '#F87171',
    errorSoft:       '#3D1515',
    // info
    info:            '#1FC8DC',
    infoSoft:        '#0C2D35',
    // contrast band
    inverseBg:       '#06111A',
    inverseSurface:  '#0C1E2A',
    inverseText:     '#EEF4F7',
    inverseMuted:    '#90A4AE',
    // overlay
    overlay:         'rgba(4,10,18,0.75)',
} as const;

export type ColorSchemeTokens = typeof dark;
export type ColorSchemeLightTokens = typeof light;
